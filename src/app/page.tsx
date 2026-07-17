import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { SetupNotice } from "@/components/setup-notice";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  return (
    <main className="px-4 pt-8">
      <h1 className="text-3xl">Sunday Sweets</h1>
      <p className="mt-1 text-latte">What are we baking tonight?</p>

      <Link
        href="/bake"
        className="mt-6 flex items-center justify-between rounded-2xl bg-terracotta px-5 py-4 text-cream shadow-sm active:scale-[0.99]"
      >
        <span className="text-lg font-medium">Bake tonight</span>
        <span aria-hidden>→</span>
      </Link>

      {isDbConfigured() ? <RecentBakes /> : <SetupNotice />}
    </main>
  );
}

async function RecentBakes() {
  const db = getDb();
  const recent = await db.query.bakes.findMany({
    orderBy: [desc(schema.bakes.bakedOn)],
    limit: 5,
    with: {
      version: { with: { recipe: true } },
      feedback: true,
    },
  });

  if (recent.length === 0) {
    return (
      <section className="mt-8">
        <h2 className="text-xl">Recent bakes</h2>
        <p className="mt-2 rounded-2xl border border-butter-dark bg-butter/60 p-5 text-sm text-latte">
          No bakes logged yet. Add a recipe, then hit &ldquo;Bake
          tonight&rdquo; on a Sunday.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl">Recent bakes</h2>
      <ul className="mt-3 space-y-2">
        {recent.map((bake) => {
          const ratings = bake.feedback.map((f) => Number(f.overall));
          const avg =
            ratings.length > 0
              ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
              : null;
          return (
            <li key={bake.id}>
              <div className="rounded-xl border border-butter-dark bg-white/60 px-4 py-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">
                    {bake.version.recipe.name} · v{bake.version.versionNumber}
                  </span>
                  {avg && (
                    <span className="text-sm text-honey">★ {avg}</span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-latte">
                  {bake.bakedOn} · {bake.feedback.length} taster
                  {bake.feedback.length === 1 ? "" : "s"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
