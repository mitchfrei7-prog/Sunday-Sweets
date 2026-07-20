// TEMPORARY self-test for Vercel Blob in production — verifies the resolved
// token, put(), public read access, and del(). Remove after verifying.
import { del, put } from "@vercel/blob";
import { getBlobToken } from "@/lib/blob";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = getBlobToken();
  const env = {
    tokenResolved: Boolean(token),
    tokenPrefix: token ? token.slice(0, 12) : null,
  };

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==",
    "base64",
  );

  try {
    const blob = await put(`__blobtest__/${Date.now()}.png`, png, {
      access: "public",
      contentType: "image/png",
      token,
    });
    // Confirm the public URL is actually readable
    const readRes = await fetch(blob.url);
    const publiclyReadable = readRes.ok;

    let deleted = false;
    try {
      await del(blob.url, { token });
      deleted = true;
    } catch {
      // report put success even if cleanup fails
    }
    return Response.json({ ok: true, env, url: blob.url, publiclyReadable, deleted });
  } catch (e) {
    return Response.json(
      { ok: false, env, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
