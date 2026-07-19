import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { SetupNotice } from "@/components/setup-notice";
import { LocalDateInput } from "@/components/local-date-input";
import { createBakeAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function LogBakePage({
  params,
  searchParams,
}: {
  params: Promise<{ recipeId: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { recipeId } = await params;
  const { v } = await searchParams;

  if (!isDbConfigured()) {
    return (
      <main className="px-4 pt-8">
        <SetupNotice />
      </main>
    );
  }

  const db = getDb();
  const version = await db.query.versions.findFirst({
    where: eq(schema.versions.id, v ?? ""),
    with: { recipe: true },
  });

  if (!version || version.recipeId !== recipeId) notFound();

  const blends = await db.query.flourBlends.findMany({
    orderBy: [asc(schema.flourBlends.name)],
  });

  return (
    <main className="px-4 pt-8">
      <Link href={`/bake/${recipeId}`} className="text-sm text-latte">
        ← Back to versions
      </Link>
      <h1 className="mt-2 text-3xl">Log the bake</h1>
      <p className="mt-1 text-latte">
        {version.recipe.name} · version {version.versionNumber}
      </p>

      <details className="mt-4 rounded-xl border border-butter-dark bg-white/60 p-4">
        <summary className="cursor-pointer text-sm font-medium text-terracotta-dark">
          Recipe reference (ingredients &amp; steps)
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

      <form action={createBakeAction} className="mt-5 space-y-4 pb-8">
        <input type="hidden" name="versionId" value={version.id} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium" htmlFor="bakedOn">
              Bake date
            </label>
            <LocalDateInput
              id="bakedOn"
              name="bakedOn"
              className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="batchSize">
              Batch size
            </label>
            <input
              id="batchSize"
              name="batchSize"
              placeholder="2 dozen"
              className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="flourBlendId">
            Flour blend
          </label>
          <select
            id="flourBlendId"
            name="flourBlendId"
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
            defaultValue=""
          >
            <option value="">— pick a blend —</option>
            {blends.map((blend) => (
              <option key={blend.id} value={blend.id}>
                {blend.name}
              </option>
            ))}
          </select>
          <input
            name="newBlendName"
            placeholder="…or type a new blend (e.g. King Arthur Measure for Measure)"
            className="mt-2 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
          <p className="mt-1 text-xs text-latte">
            Often the biggest variable in GF baking — worth tracking every
            time.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="notes">
            Notes for tonight (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="dough felt sticky, chilled 30 extra min…"
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </div>

        <div className="rounded-xl border border-butter-dark bg-butter/40 p-3">
          <label className="text-sm font-medium" htmlFor="bakeoffDiff">
            Bake-off? (optional)
          </label>
          <input
            id="bakeoffDiff"
            name="bakeoffDiff"
            placeholder="e.g. half the batch has +1 tsp xanthan gum"
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
          <p className="mt-1 text-xs text-latte">
            Splitting the batch into A and B with one change? Describe the
            difference and tasters will rate each plate separately. Leave
            empty for a normal bake.
          </p>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-terracotta py-3 font-medium text-cream active:scale-[0.99]"
        >
          Start baking 🍪
        </button>
      </form>
    </main>
  );
}
