// Built-in recipe categories. `recipes.category` is free text, so Emma can also
// type her own (stored lowercase, e.g. "breads"); anything not in this list is
// treated as a custom category and rendered with a title-cased label.
export const CATEGORIES = [
  { value: "cookies", label: "Cookies" },
  { value: "brownies", label: "Brownies" },
  { value: "cakes", label: "Cakes" },
  { value: "pies", label: "Pies" },
  { value: "snacks", label: "Snacks" },
  { value: "muffins", label: "Muffins" },
  { value: "other", label: "Other" },
] as const;

/** Canonical stored form of a typed category: lowercase, single-spaced. */
export function normalizeCategory(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Display name — built-in label, else title-cased custom value. */
export function categoryLabel(value: string): string {
  const known = CATEGORIES.find((c) => c.value === value);
  if (known) return known.label;
  return value
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Order categories for display: built-ins first (in their canonical order),
 * then any custom ones alphabetically, with "Other" last so it stays the
 * catch-all at the bottom.
 */
export function orderedCategories(present: string[]): string[] {
  const unique = Array.from(new Set(present));
  const builtIn = CATEGORIES.map((c) => c.value as string);
  const known = builtIn.filter((c) => c !== "other" && unique.includes(c));
  const custom = unique
    .filter((c) => !builtIn.includes(c))
    .sort((a, b) => a.localeCompare(b));
  const other = unique.includes("other") ? ["other"] : [];
  return [...known, ...custom, ...other];
}
