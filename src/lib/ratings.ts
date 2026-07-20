type BakeStars = {
  rating: string | null;
  feedback: { overall: string | null }[];
};

/** Every "overall" star on a bake: Emma's own rating plus each taster's. */
function bakeStars(bake: BakeStars): number[] {
  const stars: number[] = [];
  const emma = Number(bake.rating);
  if (emma > 0) stars.push(emma);
  for (const f of bake.feedback) {
    const o = Number(f.overall);
    if (o > 0) stars.push(o);
  }
  return stars;
}

/**
 * Combined average of overall stars across one or more bakes — Emma's rating
 * and every taster's overall, pooled together. Returns a "4.0"-style string,
 * or null when nothing has been rated yet. Pass a single bake in an array for a
 * per-bake average, or all of a version's bakes for the version average.
 */
export function averageStars(bakes: BakeStars[]): string | null {
  const stars = bakes.flatMap(bakeStars);
  if (stars.length === 0) return null;
  return (stars.reduce((a, b) => a + b, 0) / stars.length).toFixed(1);
}
