"use client";

import { useActionState } from "react";
import { StarRatingInput } from "@/components/star-rating-input";
import { saveBakeAction, type BakeFormState } from "../actions";

export function BakeForm({
  bakeId,
  blends,
  initial,
}: {
  bakeId: string;
  blends: { id: string; name: string }[];
  initial: {
    bakedOn: string;
    flourBlendId: string;
    notes: string;
    outcomeNotes: string;
    rating: number;
    texture: number;
    taste: number;
    moisture: number;
  };
}) {
  const [state, formAction, pending] = useActionState<BakeFormState, FormData>(
    saveBakeAction,
    {},
  );

  return (
    <form action={formAction} className="mt-5 space-y-5">
      <input type="hidden" name="bakeId" value={bakeId} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium" htmlFor="bakedOn">
            Date
          </label>
          <input
            id="bakedOn"
            name="bakedOn"
            type="date"
            required
            defaultValue={initial.bakedOn}
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="flourBlendId">
            Flour blend
          </label>
          <select
            id="flourBlendId"
            name="flourBlendId"
            defaultValue={initial.flourBlendId}
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          >
            <option value="">— none —</option>
            {blends.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <input
        name="newBlendName"
        placeholder="…or type a new blend (e.g. King Arthur Measure for Measure)"
        className="w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
      />

      <div>
        <label className="text-sm font-medium" htmlFor="notes">
          What did you change or do tonight?
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={initial.notes}
          placeholder="−¼ cup sugar, chilled the dough 30 extra min…"
          className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
        />
      </div>

      <div className="rounded-2xl border border-butter-dark bg-white/60 p-4">
        <h2 className="text-lg">Emma&apos;s wrap-up</h2>
        <div className="mt-3 space-y-3">
          <StarRatingInput name="rating" label="Overall" defaultValue={initial.rating} />
          <StarRatingInput name="texture" label="Texture" defaultValue={initial.texture} />
          <StarRatingInput name="taste" label="Taste" defaultValue={initial.taste} />
          <StarRatingInput
            name="moisture"
            label="Moisture"
            defaultValue={initial.moisture}
          />
        </div>
        <p className="mt-2 text-xs text-latte">
          Rate as much or as little as you like — 5 stars = perfect.
        </p>
        <textarea
          name="outcomeNotes"
          rows={3}
          defaultValue={initial.outcomeNotes}
          placeholder="How did it turn out? Texture, taste, what you'd try next…"
          className="mt-3 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
        />
      </div>

      {state.error && (
        <p className="text-sm text-terracotta-dark">{state.error}</p>
      )}
      {state.saved && (
        <p className="text-sm font-medium text-sage">Bake saved ✓</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-terracotta py-3 font-medium text-cream active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save this Bake"}
      </button>
    </form>
  );
}
