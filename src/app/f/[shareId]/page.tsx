import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";

export const dynamic = "force-dynamic";

/**
 * Standalone taster route — what the QR code opens. No tab bar, no login.
 * Phase 2 turns this into the four-star feedback form; for now it greets
 * tasters gracefully so shared links never dead-end.
 */
export default async function TasterPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;

  let recipeName: string | null = null;
  if (isDbConfigured()) {
    const db = getDb();
    const bake = await db.query.bakes.findFirst({
      where: eq(schema.bakes.shareId, shareId),
      with: { version: { with: { recipe: true } } },
    });
    recipeName = bake?.version.recipe.name ?? null;
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <span className="text-5xl" aria-hidden>
        🍪
      </span>
      <h1 className="mt-4 text-3xl">Sunday Sweets</h1>
      {recipeName ? (
        <>
          <p className="mt-3 text-lg">
            Thanks for tasting Emma&apos;s {recipeName}!
          </p>
          <p className="mt-2 text-latte">
            The feedback form is almost ready — soon you&apos;ll rate this
            bake right here. For now, tell Emma in person what you loved.
          </p>
        </>
      ) : (
        <p className="mt-3 text-latte">
          Hmm, this link doesn&apos;t match a bake. Double-check with the
          baker!
        </p>
      )}
    </main>
  );
}
