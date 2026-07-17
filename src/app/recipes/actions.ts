"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
    | "cake"
    | "bites"
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
