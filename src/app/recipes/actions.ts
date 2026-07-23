"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { extractRecipeFromUrl, type ExtractedRecipe } from "@/lib/extract";

export type ExtractState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; recipe: ExtractedRecipe; sourceUrl: string };

export async function extractRecipeAction(
  _prev: ExtractState,
  formData: FormData,
): Promise<ExtractState> {
  const url = String(formData.get("url") ?? "").trim();
  if (!/^https?:\/\//i.test(url)) {
    return { status: "error", message: "Paste a full link starting with http(s)://" };
  }
  try {
    const recipe = await extractRecipeFromUrl(url);
    return { status: "success", recipe, sourceUrl: url };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong reading that page.";
    return { status: "error", message };
  }
}

export async function createRecipeAction(formData: FormData) {
  if (!isDbConfigured()) {
    throw new Error("Database is not configured yet — see the setup notice.");
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("The recipe needs a name.");

  const category = String(formData.get("category") ?? "other") as
    | "cookies"
    | "brownies"
    | "cakes"
    | "pies"
    | "snacks"
    | "muffins"
    | "other";
  const gfTypeRaw = String(formData.get("gfType") ?? "");
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim() || null;
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const ingredients = String(formData.get("ingredients") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const steps = String(formData.get("steps") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const db = getDb();
  const [recipe] = await db
    .insert(schema.recipes)
    .values({
      name,
      category,
      tags,
      sourceUrl,
      gfType:
        gfTypeRaw === "gf_native" || gfTypeRaw === "substituted"
          ? gfTypeRaw
          : null,
    })
    .returning();

  // Version 1 is the recipe as imported/entered
  await db.insert(schema.versions).values({
    recipeId: recipe.id,
    versionNumber: 1,
    ingredients,
    steps,
    diffSummary: null,
    why: sourceUrl ? "Original recipe as imported" : "Original recipe",
  });

  revalidatePath("/recipes");
  redirect(`/recipes/${recipe.id}`);
}

/**
 * Delete a recipe and everything under it. Versions → bakes → feedback/photos
 * and any recipe-scoped AI insights all cascade via their FK onDelete rules.
 */
export async function deleteRecipeAction(formData: FormData) {
  const recipeId = String(formData.get("recipeId") ?? "");
  if (!recipeId) throw new Error("Missing recipe id.");

  const db = getDb();
  await db.delete(schema.recipes).where(eq(schema.recipes.id, recipeId));

  revalidatePath("/recipes");
  revalidatePath("/");
}

export async function renameRecipeAction(formData: FormData) {
  const recipeId = String(formData.get("recipeId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!recipeId) throw new Error("Missing recipe id.");
  if (!name) throw new Error("The recipe needs a name.");

  const db = getDb();
  await db
    .update(schema.recipes)
    .set({ name })
    .where(eq(schema.recipes.id, recipeId));

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/");
}

/** Rename (or clear) a version's custom label. Empty resets to "Version N". */
export async function renameVersionAction(formData: FormData) {
  const versionId = String(formData.get("versionId") ?? "");
  const recipeId = String(formData.get("recipeId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  if (!versionId) throw new Error("Missing version id.");

  const db = getDb();
  await db
    .update(schema.versions)
    .set({ label: label || null })
    .where(eq(schema.versions.id, versionId));

  if (recipeId) revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/");
}

/**
 * Delete a single version (cascades to its bakes and their feedback). Refuses
 * to remove a recipe's last version — delete the whole recipe instead.
 */
export async function deleteVersionAction(formData: FormData) {
  const versionId = String(formData.get("versionId") ?? "");
  const recipeId = String(formData.get("recipeId") ?? "");
  if (!versionId || !recipeId) throw new Error("Missing version or recipe id.");

  const db = getDb();
  const remaining = await db.query.versions.findMany({
    where: eq(schema.versions.recipeId, recipeId),
    columns: { id: true },
  });
  if (remaining.length <= 1) {
    throw new Error(
      "Can't delete the only version — delete the whole recipe instead.",
    );
  }

  await db.delete(schema.versions).where(eq(schema.versions.id, versionId));

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/");
}
