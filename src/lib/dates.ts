/**
 * A bake's date shown as "Sat Jul 18 2026". `bakedOn` is a plain YYYY-MM-DD
 * (Drizzle `date`); parse the parts into a local date so it never shifts a day
 * across time zones. toDateString() already yields the "Www Mmm DD YYYY" shape.
 */
export function formatBakeDate(bakedOn: string): string {
  const [y, m, d] = bakedOn.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toDateString();
}
