import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { SetupNotice } from "@/components/setup-notice";

export const dynamic = "force-dynamic";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isDbConfigured()) {
    return (
      <main className="px-4 pt-8">
        <SetupNotice />
      </main>
    );
  }

  const db = getDb();
  const recipe = await db.query.recipes.findFirst({
    where: eq(schema.recipes.id, id),
    with: {
      versions: {
        orderBy: [asc(schema.versions.versionNumber)],
        with: { bakes: { with: { feedback: true } } },
      },
    },
  });

  if (!recipe) notFound();

  return (
    <main className="px-4 pt-8">
      <Link href="/recipes" className="text-sm text-latte">
        ← Recipes
      </Link>
      <h1 className="mt-2 text-3xl">{recipe.name}</h1>
      <p className="mt-1 text-sm text-latte">
        {recipe.category}
        {recipe.gfType === "gf_native" && " · written for GF flours"}
        {recipe.gfType === "substituted" && " · regular recipe, 1:1 GF swap"}
        {recipe.sourceUrl && (
          <>
            {" · "}
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              source
            </a>
          </>
        )}
      </p>

      {recipe.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-butter px-2.5 py-1 text-xs text-chocolate"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <h2 className="mt-8 text-xl">Versions</h2>
      <ul className="mt-3 space-y-3">
        {recipe.versions.map((version) => {
          const allRatings = version.bakes.flatMap((b) =>
            b.feedback.map((f) => Number(f.overall)),
          );
          const avg =
            allRatings.length > 0
              ? (
                  allRatings.reduce((a, b) => a + b, 0) / allRatings.length
                ).toFixed(1)
              : null;
          const latest =
            version.versionNumber ===
            Math.max(...recipe.versions.map((v) => v.versionNumber));

          return (
            <li
              key={version.id}
              className={`rounded-xl border bg-white/60 p-4 ${
                latest ? "border-terracotta" : "border-butter-dark"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-medium">
                  Version {version.versionNumber}
                  {version.versionNumber === 1 && " · original"}
                </span>
                <span className="text-sm text-honey">
                  {avg ? `★ ${avg} avg` : "not baked yet"}
                </span>
              </div>
              {version.diffSummary && (
                <p className="mt-1 text-sm text-chocolate">
                  {version.diffSummary}
                </p>
              )}
              {version.why && (
                <p className="mt-0.5 text-sm italic text-latte">
                  &ldquo;{version.why}&rdquo;
                </p>
              )}
              <p className="mt-1 text-xs text-latte">
                {version.bakes.length} bake
                {version.bakes.length === 1 ? "" : "s"}
              </p>

              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-terracotta-dark">
                  Ingredients &amp; steps
                </summary>
                <div className="mt-2 space-y-3 text-sm">
                  <ul className="list-disc space-y-0.5 pl-5">
                    {version.ingredients.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                  <ol className="list-decimal space-y-1 pl-5">
                    {version.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              </details>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 pb-8">
        <Link
          href="/bake"
          className="block rounded-xl bg-terracotta py-3 text-center font-medium text-cream"
        >
          Bake this tonight
        </Link>
      </div>
    </main>
  );
}
