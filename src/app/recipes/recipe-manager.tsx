"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteRecipeAction, renameRecipeAction } from "./actions";

export type RecipeRow = {
  id: string;
  name: string;
  category: string;
  gfType: string | null;
  versionCount: number;
};

const categoryLabels: Record<string, string> = {
  cookies: "Cookies",
  brownies: "Brownies",
  cake: "Cake",
  bites: "Energy bites",
  other: "Other",
};

function RowBody({ recipe }: { recipe: RecipeRow }) {
  return (
    <>
      <div className="flex items-baseline justify-between">
        <span className="font-medium">{recipe.name}</span>
        <span className="text-xs text-latte">
          {recipe.versionCount} version{recipe.versionCount === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mt-0.5 text-sm text-latte">
        {categoryLabels[recipe.category] ?? recipe.category}
        {recipe.gfType === "gf_native" && " · GF-native"}
        {recipe.gfType === "substituted" && " · 1:1 substituted"}
      </p>
    </>
  );
}

export function RecipeManager({ recipes }: { recipes: RecipeRow[] }) {
  const [editing, setEditing] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);

  return (
    <>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setEditing((e) => !e);
            setConfirmId(null);
            setRenameId(null);
          }}
          className="rounded-full px-3 py-1 text-sm font-medium text-terracotta-dark active:bg-butter/60"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      <ul className="mt-1 space-y-2">
        {recipes.map((recipe) => (
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
                      setRenameId((id) => (id === recipe.id ? null : recipe.id));
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
                      setConfirmId((id) => (id === recipe.id ? null : recipe.id));
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
                  and all of its versions, bakes, and taster feedback? This
                  can&apos;t be undone.
                </p>
                <div className="mt-2.5 flex gap-2">
                  <form action={deleteRecipeAction} className="flex-1">
                    <input type="hidden" name="recipeId" value={recipe.id} />
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
    </>
  );
}
