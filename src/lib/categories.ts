// Recipe categories — keep in sync with the recipe_category enum in schema.ts.
export const CATEGORIES = [
  { value: "cookies", label: "Cookies" },
  { value: "brownies", label: "Brownies" },
  { value: "cakes", label: "Cakes" },
  { value: "pies", label: "Pies" },
  { value: "snacks", label: "Snacks" },
  { value: "muffins", label: "Muffins" },
  { value: "other", label: "Other" },
] as const;

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
