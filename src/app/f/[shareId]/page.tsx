import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { TasterForm } from "./taster-form";

export const dynamic = "force-dynamic";

/**
 * Standalone taster route — what the QR code opens. No tab bar, no login.
 * Four half-star ratings (Overall required) + free-text note + optional name.
 * Bake-offs ask for a rating + note per plate (A/B) instead.
 */
export default async function TasterPage({
  params,
  searchParams,
}: {
  params: Promise<{ shareId: string }>;
  searchParams: Promise<{ done?: string; by?: string }>;
}) {
  const { shareId } = await params;
  const { done, by } = await searchParams;

  if (!isDbConfigured()) {
    return (
      <Shell>
        <p className="mt-3 text-latte">This bake isn&apos;t available right now.</p>
      </Shell>
    );
  }

  const db = getDb();
  const bake = await db.query.bakes.findFirst({
    where: eq(schema.bakes.shareId, shareId),
    with: { version: { with: { recipe: true } } },
  });

  if (!bake) {
    return (
      <Shell>
        <p className="mt-3 text-latte">
          Hmm, this link doesn&apos;t match a bake. Double-check with the baker!
        </p>
      </Shell>
    );
  }

  if (done) {
    const emma = by === "emma";
    return (
      <Shell>
        <p className="mt-3 text-lg">Feedback sent — thank you!</p>
        <p className="mt-2 text-latte">
          {emma
            ? "Saved. Log another taster's feedback, or head back to the app."
            : "Emma reads every word. Your taste buds are shaping the next batch."}
        </p>
        <div className="mt-6 flex flex-col items-stretch gap-2">
          {emma ? (
            <>
              <Link
                href={`/f/${shareId}?by=emma`}
                className="rounded-xl border border-terracotta px-5 py-2.5 text-center text-sm font-medium text-terracotta-dark"
              >
                Enter another person&apos;s feedback
              </Link>
              <Link
                href={`/bakes/${bake.id}`}
                className="rounded-xl bg-terracotta px-5 py-2.5 text-center text-sm font-medium text-cream"
              >
                Back to the bake
              </Link>
            </>
          ) : (
            <Link
              href={`/f/${shareId}`}
              className="rounded-xl border border-terracotta px-5 py-2.5 text-center text-sm font-medium text-terracotta-dark"
            >
              Hand the phone to the next taster
            </Link>
          )}
        </div>
      </Shell>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center px-5 py-10 text-center">
      <span className="text-5xl" aria-hidden>
        🍪
      </span>
      <h1 className="mt-3 text-3xl">How was it?</h1>
      <p className="mt-1 text-latte">
        {bake.version.recipe.name} · baked {bake.bakedOn}
      </p>
      <TasterForm
        shareId={shareId}
        isBakeoff={bake.isBakeoff}
        bakeoffDiff={bake.bakeoffDiff}
        enteredByEmma={by === "emma"}
      />
    </main>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <span className="text-5xl" aria-hidden>
        🍪
      </span>
      <h1 className="mt-4 text-3xl">Sunday Sweets</h1>
      {children}
    </main>
  );
}
