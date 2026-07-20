import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { SetupNotice } from "@/components/setup-notice";
import { RecipeManager } from "./recipe-manager";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  return (
    <main className="px-4 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Recipes</h1>
        <Link
          href="/recipes/new"
          className="rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-cream"
        >
          + Add recipe
        </Link>
      </div>

      {isDbConfigured() ? <RecipeList /> : <SetupNotice />}
    </main>
  );
}

async function RecipeList() {
  const db = getDb();
  const allRecipes = await db.query.recipes.findMany({
    orderBy: [desc(schema.recipes.createdAt)],
    with: { versions: true },
  });

  if (allRecipes.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-butter-dark bg-butter/60 p-5 text-sm text-latte">
        The recipe box is empty. Add your first recipe — paste a Pinterest link
        and let the app do the typing.
      </p>
    );
  }

  return (
    <RecipeManager
      recipes={allRecipes.map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        category: recipe.category,
        gfType: recipe.gfType,
        versionCount: recipe.versions.length,
      }))}
    />
  );
}
