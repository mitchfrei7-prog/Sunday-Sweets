import Link from "next/link";

export default function BakePage() {
  return (
    <main className="px-4 pt-8">
      <h1 className="text-3xl">Bake tonight</h1>
      <p className="mt-1 text-latte">
        Pick a recipe, see its history, choose a version, and log the bake.
      </p>
      <div className="mt-6 rounded-2xl border border-butter-dark bg-butter/60 p-5 text-sm text-latte">
        The bake flow is the next slice of Phase 1 — coming right after the
        recipe box. For now,{" "}
        <Link href="/recipes" className="text-terracotta-dark underline">
          build up the recipe box
        </Link>
        .
      </div>
    </main>
  );
}
