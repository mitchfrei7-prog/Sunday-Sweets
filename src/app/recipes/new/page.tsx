"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import {
  createRecipeAction,
  extractRecipeAction,
  type ExtractState,
} from "../actions";

export default function NewRecipePage() {
  const [extractState, extractFormAction, extracting] = useActionState<
    ExtractState,
    FormData
  >(extractRecipeAction, { status: "idle" });

  const [name, setName] = useState("");
  const [category, setCategory] = useState("other");
  const [gfType, setGfType] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");

  // When extraction succeeds, pour the results into the form for review
  useEffect(() => {
    if (extractState.status === "success") {
      const r = extractState.recipe;
      setName(r.name);
      setCategory(r.category);
      setGfType(r.isGlutenFree ? "gf_native" : "substituted");
      setSourceUrl(extractState.sourceUrl);
      setIngredients(r.ingredients.join("\n"));
      setSteps(r.steps.join("\n"));
    }
  }, [extractState]);

  return (
    <main className="px-4 pt-8">
      <Link href="/recipes" className="text-sm text-latte">
        ← Recipes
      </Link>
      <h1 className="mt-2 text-3xl">Add a recipe</h1>

      <form action={extractFormAction} className="mt-5">
        <label className="text-sm font-medium" htmlFor="url">
          Paste a recipe link
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            id="url"
            name="url"
            type="url"
            inputMode="url"
            placeholder="https://pinterest.com/..."
            className="min-w-0 flex-1 rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
          <button
            type="submit"
            disabled={extracting}
            className="shrink-0 rounded-xl bg-terracotta px-4 py-2.5 text-sm font-medium text-cream disabled:opacity-60"
          >
            {extracting ? "Reading…" : "Extract"}
          </button>
        </div>
        {extractState.status === "error" && (
          <p className="mt-2 text-sm text-terracotta-dark">
            {extractState.message}
          </p>
        )}
        {extractState.status === "success" && (
          <p className="mt-2 text-sm text-sage">
            Recipe extracted — review below, tweak anything, then save.
          </p>
        )}
      </form>

      <div className="mt-6 flex items-center gap-3 text-xs text-latte">
        <span className="h-px flex-1 bg-butter-dark" />
        or type it in
        <span className="h-px flex-1 bg-butter-dark" />
      </div>

      <form action={createRecipeAction} className="mt-4 space-y-4 pb-8">
        <Field label="Name" htmlFor="name">
          <input
            id="name"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="GF chocolate chip cookies"
            className="w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" htmlFor="category">
            <select
              id="category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
            >
              <option value="cookies">Cookies</option>
              <option value="brownies">Brownies</option>
              <option value="cake">Cake</option>
              <option value="bites">Energy bites</option>
              <option value="other">Other</option>
            </select>
          </Field>

          <Field label="GF type" htmlFor="gfType">
            <select
              id="gfType"
              name="gfType"
              value={gfType}
              onChange={(e) => setGfType(e.target.value)}
              className="w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
            >
              <option value="">Not sure</option>
              <option value="gf_native">Written for GF flours</option>
              <option value="substituted">Regular + 1:1 GF swap</option>
            </select>
          </Field>
        </div>

        <Field label="Source link (optional)" htmlFor="sourceUrl">
          <input
            id="sourceUrl"
            name="sourceUrl"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </Field>

        <Field label="Tags (comma separated, optional)" htmlFor="tags">
          <input
            id="tags"
            name="tags"
            placeholder="chocolate, freezes well"
            className="w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </Field>

        <Field label="Ingredients (one per line)" htmlFor="ingredients">
          <textarea
            id="ingredients"
            name="ingredients"
            required
            rows={7}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder={"2 cups GF flour blend\n1 tsp xanthan gum\n..."}
            className="w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </Field>

        <Field label="Steps (one per line)" htmlFor="steps">
          <textarea
            id="steps"
            name="steps"
            required
            rows={7}
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder={"Cream butter and sugar\nMix in eggs\n..."}
            className="w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </Field>

        <div className="flex gap-2">
          <Link
            href="/recipes"
            className="flex-1 rounded-xl border border-butter-dark bg-white py-3 text-center font-medium text-chocolate active:scale-[0.99]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-terracotta py-3 font-medium text-cream active:scale-[0.99]"
          >
            Save recipe
          </button>
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={htmlFor}>
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
