"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { deleteRecipeAction, renameRecipeAction } from "./actions";

export type RecipeRow = {
  id: string;
  name: string;
  category: string;
  tags: string[];
  gfType: string | null;
  versionCount: number;
};

function RowBody({ recipe }: { recipe: RecipeRow }) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{recipe.name}</span>
        <span className="shrink-0 text-xs text-latte">
          {recipe.versionCount} version{recipe.versionCount === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mt-0.5 text-sm text-latte">
        {recipe.gfType === "gf_native" && "GF-native"}
        {recipe.gfType === "substituted" && "1:1 substituted"}
        {!recipe.gfType && categoryLabel(recipe.category)}
        {recipe.tags.length > 0 && ` · ${recipe.tags.join(", ")}`}
      </p>
    </>
  );
}

export function RecipeManager({ recipes }: { recipes: RecipeRow[] }) {
  const [editing, setEditing] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Matches on name, tags, or the category name so "cookies" finds them too.
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((r) =>
      [r.name, categoryLabel(r.category), ...r.tags]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [recipes, query]);

  // Group into the canonical category order; alphabetical inside each group.
  const groups = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        value: c.value as string,
        label: c.label as string,
        items: matches
          .filter((r) => r.category === c.value)
          .sort((a, b) => a.name.localeCompare(b.name)),
      })).filter((g) => g.items.length > 0),
    [matches],
  );

  return (
    <>
      <div className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes…"
            aria-label="Search recipes"
            className="w-full rounded-xl border border-butter-dark bg-white py-2.5 pl-3 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-latte"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing((e) => !e);
            setConfirmId(null);
            setRenameId(null);
          }}
          className="shrink-0 rounded-full px-3 py-2 text-sm font-medium text-terracotta-dark active:bg-butter/60"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-butter-dark bg-butter/60 p-5 text-sm text-latte">
          No recipes match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="mt-5 space-y-6 pb-8">
          {groups.map((group) => (
            <section key={group.value}>
              <h2 className="text-sm font-medium uppercase tracking-wide text-latte">
                {group.label}
                <span className="ml-1.5 normal-case">({group.items.length})</span>
              </h2>
              <ul className="mt-2 space-y-2">
                {group.items.map((recipe) => (
                  <li
                    key={recipe.id}
                    className="overflow-hidden rounded-xl border border-butter-dark bg-white/60"
                  >
                    <div className="flex items-stretch">
                      {editing ? (
                        <div className="flex-1 px-4 py-3">
                          <RowBody recipe={recipe} />
                        </div>
                      ) : (
                        <Link
                          href={`/recipes/${recipe.id}`}
                          className="flex-1 px-4 py-3 active:bg-butter/50"
                        >
                          <RowBody recipe={recipe} />
                        </Link>
                      )}
                      {editing && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setRenameId((id) =>
                                id === recipe.id ? null : recipe.id,
                              );
                              setConfirmId(null);
                            }}
                            aria-label={`Rename ${recipe.name}`}
                            className="flex w-14 shrink-0 items-center justify-center border-l border-butter-dark bg-butter/40 text-lg text-terracotta-dark active:bg-butter/70"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmId((id) =>
                                id === recipe.id ? null : recipe.id,
                              );
                              setRenameId(null);
                            }}
                            aria-label={`Delete ${recipe.name}`}
                            className="flex w-14 shrink-0 items-center justify-center border-l border-butter-dark bg-terracotta/10 text-lg text-terracotta-dark active:bg-terracotta/20"
                          >
                            🗑
                          </button>
                        </>
                      )}
                    </div>

                    {renameId === recipe.id && (
                      <div className="border-t border-butter-dark bg-butter/30 px-4 py-3">
                        <form
                          action={renameRecipeAction}
                          onSubmit={() => setRenameId(null)}
                          className="flex gap-2"
                        >
                          <input type="hidden" name="recipeId" value={recipe.id} />
                          <input
                            name="name"
                            defaultValue={recipe.name}
                            required
                            aria-label="Recipe name"
                            className="min-w-0 flex-1 rounded-lg border border-butter-dark bg-white px-3 py-2 text-sm"
                          />
                          <button
                            type="submit"
                            className="shrink-0 rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-cream active:scale-[0.99]"
                          >
                            Save
                          </button>
                        </form>
                      </div>
                    )}

                    {confirmId === recipe.id && (
                      <div className="border-t border-butter-dark bg-butter/30 px-4 py-3">
                        <p className="text-sm">
                          Delete <span className="font-medium">{recipe.name}</span>{" "}
                          and all of its versions, bakes, and taster feedback?
                          This can&apos;t be undone.
                        </p>
                        <div className="mt-2.5 flex gap-2">
                          <form action={deleteRecipeAction} className="flex-1">
                            <input
                              type="hidden"
                              name="recipeId"
                              value={recipe.id}
                            />
                            <button
                              type="submit"
                              className="w-full rounded-lg bg-terracotta py-2 text-sm font-medium text-cream active:scale-[0.99]"
                            >
                              Delete recipe
                            </button>
                          </form>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="flex-1 rounded-lg border border-butter-dark bg-white py-2 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
