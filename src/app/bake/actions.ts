"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, max } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { fetchCurrentWeather } from "@/lib/weather";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Start a bake for a version: creates the row (date + auto weather + share id)
 * so the combined bake page can immediately show photos and a QR code. All the
 * other details (flour blend, notes, ratings) are filled in on that page.
 */
async function startBake(versionId: string, bakedOn: string) {
  const db = getDb();
  const weather = await fetchCurrentWeather();
  const [bake] = await db
    .insert(schema.bakes)
    .values({
      versionId,
      bakedOn,
      weather: weather ?? undefined,
      shareId: randomBytes(9).toString("base64url"),
    })
    .returning();
  return bake;
}

export async function createVersionAction(formData: FormData) {
  const recipeId = String(formData.get("recipeId") ?? "");
  const parentVersionId = String(formData.get("parentVersionId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const diffSummary = String(formData.get("diffSummary") ?? "").trim();
  const why = String(formData.get("why") ?? "").trim();
  // "recipe" returns to the recipe page (just versioning); otherwise we start a
  // bake for the new version and open the combined bake page.
  const next = String(formData.get("next") ?? "");
  const ingredients = String(formData.get("ingredients") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const steps = String(formData.get("steps") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (!recipeId || ingredients.length === 0 || steps.length === 0) {
    throw new Error("A version needs ingredients and steps.");
  }

  const db = getDb();
  const [{ maxNumber }] = await db
    .select({ maxNumber: max(schema.versions.versionNumber) })
    .from(schema.versions)
    .where(eq(schema.versions.recipeId, recipeId));

  const [version] = await db
    .insert(schema.versions)
    .values({
      recipeId,
      parentVersionId: parentVersionId || null,
      versionNumber: (maxNumber ?? 0) + 1,
      label: label || null,
      ingredients,
      steps,
      diffSummary: diffSummary || null,
      why: why || null,
    })
    .returning();

  revalidatePath(`/recipes/${recipeId}`);
  if (next === "recipe") redirect(`/recipes/${recipeId}`);

  const bake = await startBake(version.id, todayIso());
  revalidatePath("/");
  redirect(`/bakes/${bake.id}`);
}

/** Start baking the chosen version → opens the combined bake page. */
export async function createBakeAction(formData: FormData) {
  const versionId = String(formData.get("versionId") ?? "");
  if (!versionId) throw new Error("A bake needs a version.");
  const bakedOn = String(formData.get("bakedOn") ?? "").trim() || todayIso();

  const bake = await startBake(versionId, bakedOn);
  revalidatePath("/");
  redirect(`/bakes/${bake.id}`);
}
