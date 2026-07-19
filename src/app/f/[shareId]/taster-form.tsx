"use client";

import { useActionState } from "react";
import { StarRatingInput } from "@/components/star-rating-input";
import { submitFeedbackAction, type FeedbackState } from "../actions";

export function TasterForm({
  shareId,
  isBakeoff,
  bakeoffDiff,
  enteredByEmma,
}: {
  shareId: string;
  isBakeoff: boolean;
  bakeoffDiff: string | null;
  enteredByEmma: boolean;
}) {
  const [state, formAction, pending] = useActionState<FeedbackState, FormData>(
    submitFeedbackAction,
    {},
  );

  return (
    <form action={formAction} className="mt-6 w-full space-y-4 text-left">
      <input type="hidden" name="shareId" value={shareId} />
      {enteredByEmma && <input type="hidden" name="enteredBy" value="emma" />}

      {isBakeoff ? (
        <>
          <p className="text-center text-sm text-latte">
            This bake was a taste test — two plates, one secret difference.
            Rate each plate!
          </p>
          {(["a", "b"] as const).map((plate) => (
            <div
              key={plate}
              className="rounded-2xl border border-butter-dark bg-white/70 p-4"
            >
              <h2 className="text-lg">Plate {plate.toUpperCase()}</h2>
              <div className="mt-3">
                <StarRatingInput
                  name={`overall_${plate}`}
                  label="Overall"
                />
              </div>
              <textarea
                name={`notes_${plate}`}
                rows={2}
                placeholder="What did you like or not like?"
                className="mt-3 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
              />
            </div>
          ))}
        </>
      ) : (
        <div className="rounded-2xl border border-butter-dark bg-white/70 p-4">
          <div className="space-y-3">
            <StarRatingInput name="overall" label="Overall" />
            <StarRatingInput name="texture" label="Texture" />
            <StarRatingInput name="taste" label="Taste" />
            <StarRatingInput name="moisture" label="Moisture" />
          </div>
          <p className="mt-2 text-xs text-latte">
            Only Overall is required — skip any you&apos;re not sure about. 5
            stars = perfect.
          </p>
          <textarea
            name="notes"
            rows={3}
            placeholder="What did you like? What would you change?"
            className="mt-3 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </div>
      )}

      <input
        name="tasterName"
        placeholder={enteredByEmma ? "Whose feedback is this?" : "Your name (optional)"}
        className="w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
      />

      {state.error && (
        <p className="text-center text-sm text-terracotta-dark">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-terracotta py-3 font-medium text-cream active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send feedback"}
      </button>
      {isBakeoff && bakeoffDiff && (
        <p className="text-center text-xs text-latte">
          (Emma knows what the difference is — she&apos;ll reveal it after!)
        </p>
      )}
    </form>
  );
}
