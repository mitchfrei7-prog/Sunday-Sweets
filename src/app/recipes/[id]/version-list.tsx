"use client";

import { useState } from "react";
import { deleteVersionAction, renameVersionAction } from "../actions";

export type VersionRow = {
  id: string;
  recipeId: string;
  versionNumber: number;
  label: string | null;
  name: string;
  isLatest: boolean;
  avg: string | null;
  bakeCount: number;
  diffSummary: string | null;
  why: string | null;
  ingredients: string[];
  steps: string[];
};

export function VersionList({ versions }: { versions: VersionRow[] }) {
  const [editing, setEditing] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const canDelete = versions.length > 1;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl">Versions</h2>
        <button
          type="button"
          onClick={() => {
            setEditing((e) => !e);
            setConfirmId(null);
          }}
          className="rounded-full px-3 py-1 text-sm font-medium text-terracotta-dark active:bg-butter/60"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      <ul className="mt-3 space-y-3">
        {versions.map((version) => (
          <li
            key={version.id}
            className={`rounded-xl border bg-white/60 p-4 ${
              version.isLatest ? "border-terracotta" : "border-butter-dark"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-medium">
                {version.name}
                {version.versionNumber === 1 && " · original"}
              </span>
              <span className="text-sm text-honey">
                {version.avg ? `★ ${version.avg} avg` : "not baked yet"}
              </span>
            </div>
            {version.diffSummary && (
              <p className="mt-1 text-sm text-chocolate">{version.diffSummary}</p>
            )}
            {version.why && (
              <p className="mt-0.5 text-sm italic text-latte">
                &ldquo;{version.why}&rdquo;
              </p>
            )}
            <p className="mt-1 text-xs text-latte">
              {version.bakeCount} bake{version.bakeCount === 1 ? "" : "s"}
            </p>

            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-terracotta-dark">
                Ingredients &amp; steps
              </summary>
              <div className="mt-2 space-y-3 text-sm">
                <ul className="list-disc space-y-0.5 pl-5">
                  {version.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
                <ol className="list-decimal space-y-1 pl-5">
                  {version.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </details>

            {editing && (
              <div className="mt-3 space-y-3 border-t border-butter-dark/60 pt-3">
                <form action={renameVersionAction} className="flex gap-2">
                  <input type="hidden" name="versionId" value={version.id} />
                  <input type="hidden" name="recipeId" value={version.recipeId} />
                  <input
                    name="label"
                    defaultValue={version.label ?? ""}
                    placeholder={`Name (blank = Version ${version.versionNumber})`}
                    className="min-w-0 flex-1 rounded-lg border border-butter-dark bg-white px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg bg-terracotta px-3 py-2 text-sm font-medium text-cream"
                  >
                    Rename
                  </button>
                </form>

                {canDelete ? (
                  confirmId === version.id ? (
                    <div className="rounded-lg bg-butter/40 p-3">
                      <p className="text-sm">
                        {`Delete ${version.name} and its ${version.bakeCount} bake${
                          version.bakeCount === 1 ? "" : "s"
                        } plus their feedback? This can't be undone.`}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <form
                          action={deleteVersionAction}
                          className="flex-1"
                        >
                          <input
                            type="hidden"
                            name="versionId"
                            value={version.id}
                          />
                          <input
                            type="hidden"
                            name="recipeId"
                            value={version.recipeId}
                          />
                          <button
                            type="submit"
                            className="w-full rounded-lg bg-terracotta py-2 text-sm font-medium text-cream"
                          >
                            Delete version
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
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(version.id)}
                      className="text-sm font-medium text-terracotta-dark"
                    >
                      Delete this version
                    </button>
                  )
                ) : (
                  <p className="text-xs text-latte">
                    This is the only version — delete the whole recipe to remove
                    it.
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
