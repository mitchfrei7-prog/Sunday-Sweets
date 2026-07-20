import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { SetupNotice } from "@/components/setup-notice";
import { BakeHistory } from "@/components/bake-history";
import { versionName } from "@/lib/version";

export const dynamic = "force-dynamic";

export default async function BakeRecapPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = await params;

  if (!isDbConfigured()) {
    return (
      <main className="px-4 pt-8">
        <SetupNotice />
      </main>
    );
  }

  const db = getDb();
  const recipe = await db.query.recipes.findFirst({
    where: eq(schema.recipes.id, recipeId),
    with: {
      versions: {
        orderBy: [desc(schema.versions.versionNumber)],
        with: {
          bakes: {
            orderBy: [desc(schema.bakes.bakedOn)],
            with: { feedback: true },
          },
        },
      },
    },
  });

  if (!recipe) notFound();

  return (
    <main className="px-4 pt-8">
      <Link href="/bake" className="text-sm text-latte">
        ← Pick a different recipe
      </Link>
      <h1 className="mt-2 text-3xl">{recipe.name}</h1>
      <p className="mt-1 text-latte">Step 2 · Pick or tweak a version</p>

      <h2 className="mt-8 text-xl">Versions</h2>
      <ul className="mt-3 space-y-3">
        {recipe.versions.map((version, idx) => {
          const allRatings = version.bakes.flatMap((b) =>
            b.feedback.map((f) => Number(f.overall)),
          );
          const avg =
            allRatings.length > 0
              ? (
                  allRatings.reduce((a, b) => a + b, 0) / allRatings.length
                ).toFixed(1)
              : null;

          return (
            <li
              key={version.id}
              className={`rounded-xl border bg-white/60 p-4 ${
                idx === 0 ? "border-terracotta" : "border-butter-dark"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-medium">
                  {versionName(version)}
                  {idx === 0 && " · latest"}
                </span>
                <span className="text-sm text-honey">
                  {avg ? `★ ${avg}` : "not baked yet"}
                </span>
              </div>
              {version.diffSummary && (
                <p className="mt-1 text-sm">{version.diffSummary}</p>
              )}
              {version.why && (
                <p className="mt-0.5 text-sm italic text-latte">
                  &ldquo;{version.why}&rdquo;
                </p>
              )}
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
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/bake/${recipe.id}/log?v=${version.id}`}
                  className="flex-1 rounded-xl bg-terracotta py-2.5 text-center text-sm font-medium text-cream"
                >
                  Bake this
                </Link>
                <Link
                  href={`/bake/${recipe.id}/tweak?from=${version.id}`}
                  className="flex-1 rounded-xl border border-terracotta py-2.5 text-center text-sm font-medium text-terracotta-dark"
                >
                  Tweak it first
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="pb-8">
        <BakeHistory
          versions={recipe.versions}
          empty="No bakes logged yet — pick a version above to bake the first one."
        />
      </div>
    </main>
  );
}
