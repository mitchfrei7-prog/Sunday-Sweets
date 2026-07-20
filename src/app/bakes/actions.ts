"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

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
