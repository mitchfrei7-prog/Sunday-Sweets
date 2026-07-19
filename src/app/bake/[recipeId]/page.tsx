import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { SetupNotice } from "@/components/setup-notice";

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

  const recentBakes = recipe.versions
    .flatMap((v) =>
      v.bakes.map((b) => ({ ...b, versionNumber: v.versionNumber })),
    )
    .sort((a, b) => (a.bakedOn < b.bakedOn ? 1 : -1))
    .slice(0, 3);

  return (
    <main className="px-4 pt-8">
      <Link href="/bake" className="text-sm text-latte">
        ← Pick a different recipe
      </Link>
      <h1 className="mt-2 text-3xl">{recipe.name}</h1>
      <p className="mt-1 text-latte">Step 2 · Pick or tweak a version</p>

      {recentBakes.length > 0 && (
        <section className="mt-5 rounded-2xl border border-butter-dark bg-butter/50 p-4">
          <h2 className="text-base">Last time&hellip;</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {recentBakes.map((bake) => {
              const ratings = bake.feedback.map((f) => Number(f.overall));
              const avg =
                ratings.length > 0
                  ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
                  : null;
              const bestNote = bake.feedback.find((f) => f.notes)?.notes;
              return (
                <li key={bake.id}>
                  <span className="font-medium">
                    v{bake.versionNumber} · {bake.bakedOn}
                  </span>
                  {avg && <span className="text-honey"> · ★ {avg}</span>}
                  {bake.rating && (
                    <span className="text-latte">
                      {" "}
                      · Emma ★ {Number(bake.rating).toFixed(1)}
                    </span>
                  )}
                  {bestNote && (
                    <span className="text-latte">
                      {" "}
                      · &ldquo;{bestNote.slice(0, 60)}
                      {bestNote.length > 60 ? "…" : ""}&rdquo;
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <ul className="mt-5 space-y-3 pb-8">
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
                  Version {version.versionNumber}
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
    </main>
  );
}
