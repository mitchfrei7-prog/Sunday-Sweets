import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { SetupNotice } from "@/components/setup-notice";
import { createVersionAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function TweakVersionPage({
  params,
  searchParams,
}: {
  params: Promise<{ recipeId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { recipeId } = await params;
  const { from } = await searchParams;

  if (!isDbConfigured()) {
    return (
      <main className="px-4 pt-8">
        <SetupNotice />
      </main>
    );
  }

  const db = getDb();
  const parent = await db.query.versions.findFirst({
    where: eq(schema.versions.id, from ?? ""),
    with: { recipe: true },
  });

  if (!parent || parent.recipeId !== recipeId) notFound();

  return (
    <main className="px-4 pt-8">
      <Link href={`/bake/${recipeId}`} className="text-sm text-latte">
        ← Back to versions
      </Link>
      <h1 className="mt-2 text-3xl">Tweak v{parent.versionNumber}</h1>
      <p className="mt-1 text-latte">
        This creates version {parent.versionNumber + 1} of{" "}
        {parent.recipe.name}. Edit the recipe, then say what changed and why —
        that story is what makes the history (and the AI coach) useful.
      </p>

      <form action={createVersionAction} className="mt-5 space-y-4 pb-8">
        <input type="hidden" name="recipeId" value={recipeId} />
        <input type="hidden" name="parentVersionId" value={parent.id} />

        <div>
          <label className="text-sm font-medium" htmlFor="ingredients">
            Ingredients (one per line)
          </label>
          <textarea
            id="ingredients"
            name="ingredients"
            required
            rows={9}
            defaultValue={parent.ingredients.join("\n")}
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="steps">
            Steps (one per line)
          </label>
          <textarea
            id="steps"
            name="steps"
            required
            rows={9}
            defaultValue={parent.steps.join("\n")}
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="diffSummary">
            What changed?
          </label>
          <input
            id="diffSummary"
            name="diffSummary"
            required
            placeholder="−¼ cup sugar, +1 tsp xanthan gum, 350→325°F"
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="why">
            Why?
          </label>
          <input
            id="why"
            name="why"
            required
            placeholder="fixing crumbly texture"
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-terracotta py-3 font-medium text-cream active:scale-[0.99]"
        >
          Create v{parent.versionNumber + 1} and continue
        </button>
      </form>
    </main>
  );
}
