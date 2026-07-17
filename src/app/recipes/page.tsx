import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { SetupNotice } from "@/components/setup-notice";

export const dynamic = "force-dynamic";

const categoryLabels: Record<string, string> = {
  cookies: "Cookies",
  brownies: "Brownies",
  cake: "Cake",
  bites: "Energy bites",
  other: "Other",
};

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
    <ul className="mt-5 space-y-2">
      {allRecipes.map((recipe) => (
        <li key={recipe.id}>
          <Link
            href={`/recipes/${recipe.id}`}
            className="block rounded-xl border border-butter-dark bg-white/60 px-4 py-3 active:bg-butter/50"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-medium">{recipe.name}</span>
              <span className="text-xs text-latte">
                {recipe.versions.length} version
                {recipe.versions.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-latte">
              {categoryLabels[recipe.category]}
              {recipe.gfType === "gf_native" && " · GF-native"}
              {recipe.gfType === "substituted" && " · 1:1 substituted"}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
