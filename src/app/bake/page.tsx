import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { SetupNotice } from "@/components/setup-notice";

export const dynamic = "force-dynamic";

export default async function BakePickRecipePage() {
  return (
    <main className="px-4 pt-8">
      <h1 className="text-3xl">Bake tonight</h1>
      <p className="mt-1 text-latte">Step 1 · Pick a recipe</p>
      {isDbConfigured() ? <RecipePicker /> : <SetupNotice />}
    </main>
  );
}

async function RecipePicker() {
  const db = getDb();
  const recipes = await db.query.recipes.findMany({
    orderBy: [desc(schema.recipes.createdAt)],
    with: {
      versions: { with: { bakes: { with: { feedback: true } } } },
    },
  });

  if (recipes.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-butter-dark bg-butter/60 p-5 text-sm text-latte">
        No recipes yet.{" "}
        <Link href="/recipes/new" className="text-terracotta-dark underline">
          Add your first recipe
        </Link>{" "}
        to start baking.
      </div>
    );
  }

  return (
    <ul className="mt-5 space-y-2 pb-8">
      {recipes.map((recipe) => {
        const bakes = recipe.versions.flatMap((v) => v.bakes);
        const lastBaked = bakes
          .map((b) => b.bakedOn)
          .sort()
          .at(-1);
        const allRatings = bakes.flatMap((b) =>
          b.feedback.map((f) => Number(f.overall)),
        );
        const avg =
          allRatings.length > 0
            ? (
                allRatings.reduce((a, b) => a + b, 0) / allRatings.length
              ).toFixed(1)
            : null;

        const latestVersion = [...recipe.versions].sort(
          (a, b) => b.versionNumber - a.versionNumber,
        )[0];

        return (
          <li key={recipe.id}>
            <div className="rounded-xl border border-butter-dark bg-white/60 px-4 py-3">
              <Link href={`/bake/${recipe.id}`} className="block active:opacity-70">
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">{recipe.name}</span>
                  {avg && <span className="text-sm text-honey">★ {avg}</span>}
                </div>
                <p className="mt-0.5 text-sm text-latte">
                  {bakes.length === 0
                    ? "Never baked — first time!"
                    : `${bakes.length} bake${bakes.length === 1 ? "" : "s"} · last ${lastBaked}`}
                </p>
              </Link>
              {latestVersion && latestVersion.ingredients.length > 0 && (
                <details className="mt-2 border-t border-butter-dark/60 pt-2">
                  <summary className="cursor-pointer text-sm text-terracotta-dark">
                    Ingredients (v{latestVersion.versionNumber})
                  </summary>
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm">
                    {latestVersion.ingredients.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
