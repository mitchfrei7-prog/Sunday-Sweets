"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export async function saveBakeReviewAction(formData: FormData) {
  const bakeId = String(formData.get("bakeId") ?? "");
  const rating = String(formData.get("rating") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!bakeId) throw new Error("Missing bake id.");

  const parsed = rating ? Number(rating) : null;
  if (parsed !== null && (parsed < 0.5 || parsed > 5 || (parsed * 2) % 1 !== 0)) {
    throw new Error("Rating must be between 0.5 and 5.0 in half-star steps.");
  }

  const db = getDb();
  await db
    .update(schema.bakes)
    .set({
      rating: parsed !== null ? parsed.toFixed(1) : null,
      notes: notes || null,
    })
    .where(eq(schema.bakes.id, bakeId));

  revalidatePath(`/bakes/${bakeId}`);
  revalidatePath("/");
}
