import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { SetupNotice } from "@/components/setup-notice";
import { CATEGORIES } from "@/lib/categories";
import { updateRecipeAction } from "@/app/recipes/actions";

export const dynamic = "force-dynamic";

export default async function EditRecipePage({
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
  });

  if (!recipe) notFound();

  return (
    <main className="px-4 pt-8">
      <Link href={`/recipes/${id}`} className="text-sm text-latte">
        ← Back to {recipe.name}
      </Link>
      <h1 className="mt-2 text-3xl">Edit recipe</h1>
      <p className="mt-1 text-latte">
        Name, category, and tags for the recipe itself. To change ingredients or
        steps, edit a version instead.
      </p>

      <form action={updateRecipeAction} className="mt-5 space-y-4 pb-8">
        <input type="hidden" name="recipeId" value={recipe.id} />

        <div>
          <label className="text-sm font-medium" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={recipe.name}
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              name="category"
              defaultValue={recipe.category}
              className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="gfType">
              GF type
            </label>
            <select
              id="gfType"
              name="gfType"
              defaultValue={recipe.gfType ?? ""}
              className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
            >
              <option value="">Not sure</option>
              <option value="gf_native">Written for GF flours</option>
              <option value="substituted">Regular + 1:1 GF swap</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="sourceUrl">
            Source link (optional)
          </label>
          <input
            id="sourceUrl"
            name="sourceUrl"
            defaultValue={recipe.sourceUrl ?? ""}
            placeholder="https://…"
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="tags">
            Tags (comma separated, optional)
          </label>
          <input
            id="tags"
            name="tags"
            defaultValue={recipe.tags.join(", ")}
            placeholder="chocolate, freezes well"
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </div>

        <div className="flex gap-2">
          <Link
            href={`/recipes/${id}`}
            className="flex-1 rounded-xl border border-butter-dark bg-white py-3 text-center font-medium text-chocolate active:scale-[0.99]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-terracotta py-3 font-medium text-cream active:scale-[0.99]"
          >
            Save changes
          </button>
        </div>
      </form>
    </main>
  );
}
