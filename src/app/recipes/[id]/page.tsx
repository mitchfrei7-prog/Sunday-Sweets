import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { SetupNotice } from "@/components/setup-notice";
import { versionName } from "@/lib/version";
import { categoryLabel } from "@/lib/categories";
import { averageStars } from "@/lib/ratings";
import { BakeHistory } from "@/components/bake-history";
import { VersionList, type VersionRow } from "./version-list";

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

  const maxNumber = Math.max(...recipe.versions.map((v) => v.versionNumber));

  const versionRows: VersionRow[] = recipe.versions.map((version) => ({
    id: version.id,
    recipeId: recipe.id,
    versionNumber: version.versionNumber,
    label: version.label,
    name: versionName(version),
    isLatest: version.versionNumber === maxNumber,
    avg: averageStars(version.bakes),
    bakeCount: version.bakes.length,
    diffSummary: version.diffSummary,
    why: version.why,
    ingredients: version.ingredients,
    steps: version.steps,
  }));

  return (
    <main className="px-4 pt-8">
      <Link href="/recipes" className="text-sm text-latte">
        ← Recipes
      </Link>
      <h1 className="mt-2 text-3xl">{recipe.name}</h1>
      <p className="mt-1 text-sm text-latte">
        {categoryLabel(recipe.category)}
        {recipe.gfType === "gf_native" && " · written for GF flours"}
        {recipe.gfType === "substituted" && " · regular recipe, 1:1 GF swap"}
      </p>
      {recipe.sourceUrl && (
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block break-all text-sm text-terracotta-dark underline"
        >
          {recipe.sourceUrl}
        </a>
      )}

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

      <div className="pb-8">
        <BakeHistory
          versions={recipe.versions}
          empty={<>No bakes yet — hit &ldquo;Bake this tonight&rdquo; on a version above.</>}
        />
      </div>
    </main>
  );
}
