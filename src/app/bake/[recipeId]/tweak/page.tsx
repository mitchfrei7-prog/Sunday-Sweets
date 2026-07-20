import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { SetupNotice } from "@/components/setup-notice";
import { versionName } from "@/lib/version";
import { createVersionAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function TweakVersionPage({
  params,
  searchParams,
}: {
  params: Promise<{ recipeId: string }>;
  searchParams: Promise<{ from?: string; next?: string }>;
}) {
  const { recipeId } = await params;
  const { from, next } = await searchParams;

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

  // From the recipe page we return there after saving; from the bake flow we
  // continue into logging tonight's bake.
  const toRecipe = next === "recipe";
  const backHref = toRecipe ? `/recipes/${recipeId}` : `/bake/${recipeId}`;
  const parentName = versionName(parent);

  return (
    <main className="px-4 pt-8">
      <Link href={backHref} className="text-sm text-latte">
        {toRecipe ? "← Back to recipe" : "← Back to versions"}
      </Link>
      <h1 className="mt-2 text-3xl">Tweak {parentName}</h1>
      <p className="mt-1 text-latte">
        This creates a new version of {parent.recipe.name}. Give it a name if
        you like, edit the recipe, then say what changed and why — that story is
        what makes the history (and the AI coach) useful.
      </p>

      <form action={createVersionAction} className="mt-5 space-y-4 pb-8">
        <input type="hidden" name="recipeId" value={recipeId} />
        <input type="hidden" name="parentVersionId" value={parent.id} />
        {toRecipe && <input type="hidden" name="next" value="recipe" />}

        <div>
          <label className="text-sm font-medium" htmlFor="label">
            Version name (optional)
          </label>
          <input
            id="label"
            name="label"
            placeholder="½ flour ½ oats"
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
          <p className="mt-1 text-xs text-latte">
            Leave blank to auto-number it (Version {parent.versionNumber + 1}).
          </p>
        </div>

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
          {toRecipe ? "Save new version" : "Create version and continue"}
        </button>
      </form>
    </main>
  );
}
