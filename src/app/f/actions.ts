"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export type FeedbackState = { error?: string };

/** Parse a half-star rating; returns null for empty, throws label on invalid. */
function parseRating(raw: FormDataEntryValue | null, label: string): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  if (Number.isNaN(n) || n < 0.5 || n > 5 || (n * 2) % 1 !== 0) {
    throw new Error(`${label} must be 0.5–5 stars in half-star steps.`);
  }
  return n.toFixed(1);
}

export async function submitFeedbackAction(
  _prev: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  const shareId = String(formData.get("shareId") ?? "");
  const enteredBy =
    String(formData.get("enteredBy") ?? "") === "emma" ? "emma" : "taster";
  const tasterName = String(formData.get("tasterName") ?? "").trim() || null;

  const db = getDb();
  const bake = await db.query.bakes.findFirst({
    where: eq(schema.bakes.shareId, shareId),
  });
  if (!bake) return { error: "This link doesn't match a bake anymore." };

  try {
    const overall = parseRating(formData.get("overall"), "Overall rating");
    if (!overall) {
      return { error: "An overall star rating is required — tap the stars!" };
    }
    await db.insert(schema.feedback).values({
      bakeId: bake.id,
      variant: "single",
      overall,
      texture: parseRating(formData.get("texture"), "Texture"),
      taste: parseRating(formData.get("taste"), "Taste"),
      moisture: parseRating(formData.get("moisture"), "Moisture"),
      notes: String(formData.get("notes") ?? "").trim() || null,
      tasterName,
      enteredBy,
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Something went wrong — try again.",
    };
  }

  revalidatePath(`/bakes/${bake.id}`);
  revalidatePath("/");
  redirect(`/f/${shareId}?done=1${enteredBy === "emma" ? "&by=emma" : ""}`);
}
