"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { del, put } from "@vercel/blob";
import { getDb, schema } from "@/db";
import { getBlobToken, isBlobConfigured } from "@/lib/blob";

/** Parse a half-star rating; empty -> null, invalid -> throws. */
function parseRating(raw: FormDataEntryValue | null): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  if (Number.isNaN(n) || n < 0.5 || n > 5 || (n * 2) % 1 !== 0) {
    throw new Error("Rating must be between 0.5 and 5.0 in half-star steps.");
  }
  return n.toFixed(1);
}

export type BakeFormState = { saved?: boolean; error?: string };

/**
 * Save everything on the combined bake page: date, flour blend, both notes, and
 * Emma's ratings. Also the later "edit this bake" path. New flour blends typed
 * in the field are created on the fly.
 */
export async function saveBakeAction(
  _prev: BakeFormState,
  formData: FormData,
): Promise<BakeFormState> {
  const bakeId = String(formData.get("bakeId") ?? "");
  if (!bakeId) return { error: "Missing bake id." };

  const bakedOn = String(formData.get("bakedOn") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bakedOn)) {
    return { error: "Please pick a bake date." };
  }
  const notes = String(formData.get("notes") ?? "").trim();
  const outcomeNotes = String(formData.get("outcomeNotes") ?? "").trim();
  const flourBlendId = String(formData.get("flourBlendId") ?? "");
  const newBlendName = String(formData.get("newBlendName") ?? "").trim();

  try {
    const db = getDb();

    let blendId: string | null = flourBlendId || null;
    if (!blendId && newBlendName) {
      const [blend] = await db
        .insert(schema.flourBlends)
        .values({ name: newBlendName })
        .returning();
      blendId = blend.id;
    }

    await db
      .update(schema.bakes)
      .set({
        bakedOn,
        flourBlendId: blendId,
        notes: notes || null,
        outcomeNotes: outcomeNotes || null,
        rating: parseRating(formData.get("rating")),
        texture: parseRating(formData.get("texture")),
        taste: parseRating(formData.get("taste")),
        moisture: parseRating(formData.get("moisture")),
      })
      .where(eq(schema.bakes.id, bakeId));
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Couldn't save — try again.",
    };
  }

  revalidatePath(`/bakes/${bakeId}`);
  revalidatePath("/");
  return { saved: true };
}

/** Delete a bake and everything under it (feedback + photos cascade). */
export async function deleteBakeAction(formData: FormData) {
  const bakeId = String(formData.get("bakeId") ?? "");
  if (!bakeId) throw new Error("Missing bake id.");

  const db = getDb();
  // Best-effort: remove photo blobs before the rows cascade away.
  if (isBlobConfigured()) {
    const photos = await db.query.bakePhotos.findMany({
      where: eq(schema.bakePhotos.bakeId, bakeId),
    });
    for (const p of photos) {
      try {
        await del(p.url, { token: getBlobToken() });
      } catch {
        // ignore — the row still cascades
      }
    }
  }

  await db.delete(schema.bakes).where(eq(schema.bakes.id, bakeId));
  revalidatePath("/");
  redirect("/");
}

// ── Bake photos (Vercel Blob) ────────────────────────────────────────────────

// Photos are downscaled to JPEG client-side; this is a safety net for direct
// or oversized posts.
const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

/**
 * Store one bake photo. Expects an already-downscaled image File under
 * "photo". Uploads to Vercel Blob and records the public URL. Called directly
 * from the client uploader (not a form action), so it returns an error string
 * rather than throwing.
 */
export async function addBakePhotoAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const bakeId = String(formData.get("bakeId") ?? "");
  const file = formData.get("photo");

  if (!bakeId) return { error: "Missing bake id." };
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No photo selected." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "That doesn't look like an image." };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { error: "That photo is too large — try a smaller one." };
  }
  if (!isBlobConfigured()) {
    return {
      error:
        "Photo storage isn't set up yet. Add a Vercel Blob store to enable uploads.",
    };
  }

  try {
    const key = `bakes/${bakeId}/${randomBytes(8).toString("hex")}.jpg`;
    const blob = await put(key, file, {
      access: "public",
      contentType: "image/jpeg",
      token: getBlobToken(),
    });
    const db = getDb();
    await db.insert(schema.bakePhotos).values({ bakeId, url: blob.url });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Upload failed — try again.",
    };
  }

  revalidatePath(`/bakes/${bakeId}`);
  revalidatePath("/");
  return {};
}

/** Remove a bake photo from Blob storage and the database. */
export async function deleteBakePhotoAction(formData: FormData) {
  const photoId = String(formData.get("photoId") ?? "");
  const bakeId = String(formData.get("bakeId") ?? "");
  if (!photoId) throw new Error("Missing photo id.");

  const db = getDb();
  const photo = await db.query.bakePhotos.findFirst({
    where: eq(schema.bakePhotos.id, photoId),
  });
  if (photo) {
    // Best-effort blob removal — never block the DB delete on it.
    if (isBlobConfigured()) {
      try {
        await del(photo.url, { token: getBlobToken() });
      } catch {
        // ignore — the row still gets removed
      }
    }
    await db.delete(schema.bakePhotos).where(eq(schema.bakePhotos.id, photoId));
  }

  if (bakeId) revalidatePath(`/bakes/${bakeId}`);
  revalidatePath("/");
}
