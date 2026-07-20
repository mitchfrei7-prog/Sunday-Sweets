// TEMPORARY self-test for Vercel Blob in production — verifies OIDC auth,
// put(), del(), and the store's access mode. Remove after verifying.
import { del, put } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    hasReadWriteToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    hasStoreId: Boolean(process.env.BLOB_STORE_ID),
    hasOidcToken: Boolean(process.env.VERCEL_OIDC_TOKEN),
  };

  // 1x1 png
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==",
    "base64",
  );

  try {
    const blob = await put(`__blobtest__/${Date.now()}.png`, png, {
      access: "public",
      contentType: "image/png",
    });
    let deleted = false;
    try {
      await del(blob.url);
      deleted = true;
    } catch {
      // report put success even if cleanup fails
    }
    return Response.json({ ok: true, env, url: blob.url, deleted });
  } catch (e) {
    return Response.json(
      { ok: false, env, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
