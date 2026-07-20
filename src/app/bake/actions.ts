"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, max } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { fetchCurrentWeather } from "@/lib/weather";

export async function createVersionAction(formData: FormData) {
  const recipeId = String(formData.get("recipeId") ?? "");
  const parentVersionId = String(formData.get("parentVersionId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const diffSummary = String(formData.get("diffSummary") ?? "").trim();
  const why = String(formData.get("why") ?? "").trim();
  // "recipe" returns to the recipe page (just versioning); default continues
  // into the bake log (the Bake Tonight flow).
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
  redirect(`/bake/${recipeId}/log?v=${version.id}`);
}

export async function createBakeAction(formData: FormData) {
  const versionId = String(formData.get("versionId") ?? "");
  const bakedOn = String(formData.get("bakedOn") ?? "");
  const batchSize = String(formData.get("batchSize") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const bakeoffDiff = String(formData.get("bakeoffDiff") ?? "").trim();
  const flourBlendId = String(formData.get("flourBlendId") ?? "");
  const newBlendName = String(formData.get("newBlendName") ?? "").trim();

  if (!versionId || !bakedOn) {
    throw new Error("A bake needs a version and a date.");
  }

  const db = getDb();

  let blendId: string | null = flourBlendId || null;
  if (!blendId && newBlendName) {
    const [blend] = await db
      .insert(schema.flourBlends)
      .values({ name: newBlendName })
      .returning();
    blendId = blend.id;
  }

  // Silent, best-effort — never blocks the bake
  const weather = await fetchCurrentWeather();

  const [bake] = await db
    .insert(schema.bakes)
    .values({
      versionId,
      bakedOn,
      batchSize: batchSize || null,
      notes: notes || null,
      flourBlendId: blendId,
      weather: weather ?? undefined,
      isBakeoff: bakeoffDiff.length > 0,
      bakeoffDiff: bakeoffDiff || null,
      shareId: randomBytes(9).toString("base64url"),
    })
    .returning();

  revalidatePath("/");
  redirect(`/bakes/${bake.id}`);
}
