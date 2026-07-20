import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { SetupNotice } from "@/components/setup-notice";
import { versionName } from "@/lib/version";
import { VersionList, type VersionRow } from "./version-list";

export const dynamic = "force-dynamic";

function avgOverall(feedback: { overall: string | null }[]): string | null {
  const ratings = feedback.map((f) => Number(f.overall)).filter((n) => n > 0);
  if (ratings.length === 0) return null;
  return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
}

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

  const maxNumber = Math.max(...recipe.versions.map((v) => v.versionNumber));
  const latestVersion = recipe.versions.find(
    (v) => v.versionNumber === maxNumber,
  );

  const versionRows: VersionRow[] = recipe.versions.map((version) => ({
    id: version.id,
    recipeId: recipe.id,
    versionNumber: version.versionNumber,
    label: version.label,
    name: versionName(version),
    isLatest: version.versionNumber === maxNumber,
    avg: avgOverall(version.bakes.flatMap((b) => b.feedback)),
    bakeCount: version.bakes.length,
    diffSummary: version.diffSummary,
    why: version.why,
    ingredients: version.ingredients,
    steps: version.steps,
  }));

  // Every bake across every version, newest first — the recipe's full history.
  const history = recipe.versions
    .flatMap((version) => version.bakes.map((b) => ({ bake: b, version })))
    .sort((a, b) => (a.bake.bakedOn < b.bake.bakedOn ? 1 : -1));

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

      <VersionList versions={versionRows} />

      <section className="mt-8">
        <h2 className="text-xl">Bake history</h2>
        {history.length === 0 ? (
          <p className="mt-2 rounded-2xl border border-butter-dark bg-butter/60 p-5 text-sm text-latte">
            No bakes yet. Hit &ldquo;Bake this tonight&rdquo; below to log the
            first one.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.map(({ bake, version }) => {
              const avg = avgOverall(bake.feedback);
              return (
                <li key={bake.id}>
                  <Link
                    href={`/bakes/${bake.id}`}
                    className="block rounded-xl border border-butter-dark bg-white/60 px-4 py-3 active:bg-butter/50"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-medium">
                        {versionName(version, { short: true })}
                        {bake.isBakeoff && " · bake-off"}
                      </span>
                      {avg && <span className="text-sm text-honey">★ {avg}</span>}
                    </div>
                    <p className="mt-0.5 text-sm text-latte">
                      {bake.bakedOn} · {bake.feedback.length} taster
                      {bake.feedback.length === 1 ? "" : "s"}
                      {bake.rating && ` · Emma ★ ${Number(bake.rating).toFixed(1)}`}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-8 space-y-2 pb-8">
        <Link
          href={`/bake/${recipe.id}`}
          className="block rounded-xl bg-terracotta py-3 text-center font-medium text-cream active:scale-[0.99]"
        >
          Bake this tonight
        </Link>
        {latestVersion && (
          <Link
            href={`/bake/${recipe.id}/tweak?from=${latestVersion.id}&next=recipe`}
            className="block rounded-xl border border-terracotta py-3 text-center font-medium text-terracotta-dark active:scale-[0.99]"
          >
            Tweak into a new version
          </Link>
        )}
      </div>
    </main>
  );
}
