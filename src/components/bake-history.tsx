import Link from "next/link";
import { versionName } from "@/lib/version";
import { averageStars } from "@/lib/ratings";
import { formatBakeDate } from "@/lib/dates";

type Feedback = { overall: string | null };
type Bake = {
  id: string;
  bakedOn: string;
  isBakeoff: boolean;
  rating: string | null;
  feedback: Feedback[];
};
type Version = { label: string | null; versionNumber: number; bakes: Bake[] };

/**
 * Every bake across every version of a recipe, newest first — each links to its
 * wrap-up (Emma's ratings + taster feedback). Shared by the recipe detail page
 * and the Bake Tonight version picker.
 */
export function BakeHistory({
  versions,
  empty,
}: {
  versions: Version[];
  empty: React.ReactNode;
}) {
  const history = versions
    .flatMap((version) => version.bakes.map((bake) => ({ bake, version })))
    .sort((a, b) => (a.bake.bakedOn < b.bake.bakedOn ? 1 : -1));

  return (
    <section className="mt-8">
      <h2 className="text-xl">Bake history</h2>
      {history.length === 0 ? (
        <p className="mt-2 rounded-2xl border border-butter-dark bg-butter/60 p-5 text-sm text-latte">
          {empty}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {history.map(({ bake, version }) => {
            const avg = averageStars([bake]);
            return (
              <li key={bake.id}>
                <Link
                  href={`/bakes/${bake.id}`}
                  className="block rounded-xl border border-butter-dark bg-white/60 px-4 py-3 active:bg-butter/50"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium">
                      {versionName(version, { short: true })}
                      {bake.isBakeoff && " · bake-off"}
                    </span>
                    {avg && <span className="text-sm text-honey">★ {avg}</span>}
                  </div>
                  <p className="mt-0.5 text-sm text-latte">
                    {formatBakeDate(bake.bakedOn)} · {bake.feedback.length}{" "}
                    taster{bake.feedback.length === 1 ? "" : "s"}
                    {bake.rating &&
                      ` · Emma ★ ${Number(bake.rating).toFixed(1)}`}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
