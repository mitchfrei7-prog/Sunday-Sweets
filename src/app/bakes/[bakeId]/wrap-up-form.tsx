"use client";

import { useActionState } from "react";
import { StarRatingInput } from "@/components/star-rating-input";
import { saveBakeReviewAction, type WrapUpState } from "../actions";

export function WrapUpForm({
  bakeId,
  initial,
}: {
  bakeId: string;
  initial: {
    rating: number;
    texture: number;
    taste: number;
    moisture: number;
    notes: string;
  };
}) {
  const [state, formAction, pending] = useActionState<WrapUpState, FormData>(
    saveBakeReviewAction,
    {},
  );

  return (
    <form action={formAction} className="mt-3 space-y-4">
      <input type="hidden" name="bakeId" value={bakeId} />
      <div className="space-y-3">
        <StarRatingInput name="rating" label="Overall" defaultValue={initial.rating} />
        <StarRatingInput name="texture" label="Texture" defaultValue={initial.texture} />
        <StarRatingInput name="taste" label="Taste" defaultValue={initial.taste} />
        <StarRatingInput
          name="moisture"
          label="Moisture"
          defaultValue={initial.moisture}
        />
      </div>
      <p className="text-xs text-latte">
        Rate as much or as little as you like — 5 stars = perfect. The breakdown
        helps the AI coach later.
      </p>
      <textarea
        name="notes"
        rows={3}
        defaultValue={initial.notes}
        placeholder="How did it go? Oven quirks, texture, what you'd change…"
        className="w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
      />
      {state.error && (
        <p className="text-sm text-terracotta-dark">{state.error}</p>
      )}
      {state.saved && (
        <p className="text-sm font-medium text-sage">Wrap-up saved ✓</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-terracotta py-2.5 text-sm font-medium text-cream disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save wrap-up"}
      </button>
    </form>
  );
}
