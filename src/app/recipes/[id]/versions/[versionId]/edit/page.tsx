import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { SetupNotice } from "@/components/setup-notice";
import { versionName } from "@/lib/version";
import { updateVersionAction } from "@/app/recipes/actions";

export const dynamic = "force-dynamic";

export default async function EditVersionPage({
  params,
}: {
  params: Promise<{ id: string; versionId: string }>;
}) {
  const { id, versionId } = await params;

  if (!isDbConfigured()) {
    return (
      <main className="px-4 pt-8">
        <SetupNotice />
      </main>
    );
  }

  const db = getDb();
  const version = await db.query.versions.findFirst({
    where: eq(schema.versions.id, versionId),
    with: { recipe: true },
  });

  if (!version || version.recipeId !== id) notFound();

  return (
    <main className="px-4 pt-8">
      <Link href={`/recipes/${id}`} className="text-sm text-latte">
        ← Back to {version.recipe.name}
      </Link>
      <h1 className="mt-2 text-3xl">Edit {versionName(version)}</h1>
      <p className="mt-1 text-latte">
        Fix this version in place — this doesn&apos;t create a new one. (To try a
        change while keeping the old version, use &ldquo;Tweak it first&rdquo;
        instead.)
      </p>

      <form action={updateVersionAction} className="mt-5 space-y-4 pb-8">
        <input type="hidden" name="versionId" value={version.id} />
        <input type="hidden" name="recipeId" value={id} />
        <input
          type="hidden"
          name="autoName"
          value={`Version ${version.versionNumber}`}
        />

        <div>
          <label className="text-sm font-medium" htmlFor="label">
            Version name
          </label>
          <input
            id="label"
            name="label"
            defaultValue={versionName(version)}
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
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
            defaultValue={version.ingredients.join("\n")}
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
            defaultValue={version.steps.join("\n")}
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="diffSummary">
            What changed? (optional)
          </label>
          <input
            id="diffSummary"
            name="diffSummary"
            defaultValue={version.diffSummary ?? ""}
            placeholder="−¼ cup sugar, +1 tsp xanthan gum, 350→325°F"
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="why">
            Why? (optional)
          </label>
          <input
            id="why"
            name="why"
            defaultValue={version.why ?? ""}
            placeholder="fixing crumbly texture"
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
