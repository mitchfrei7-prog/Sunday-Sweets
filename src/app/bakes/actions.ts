"use server";

import { randomBytes } from "crypto";
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

export type WrapUpState = { saved?: boolean; error?: string };

export async function saveBakeReviewAction(
  _prev: WrapUpState,
  formData: FormData,
): Promise<WrapUpState> {
  const bakeId = String(formData.get("bakeId") ?? "");
  if (!bakeId) return { error: "Missing bake id." };
  const notes = String(formData.get("notes") ?? "").trim();

  try {
    const db = getDb();
    await db
      .update(schema.bakes)
      .set({
        rating: parseRating(formData.get("rating")),
        texture: parseRating(formData.get("texture")),
        taste: parseRating(formData.get("taste")),
        moisture: parseRating(formData.get("moisture")),
        notes: notes || null,
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
