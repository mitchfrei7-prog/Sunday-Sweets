"use client";

import { useRef } from "react";
import { createBakeAction } from "../actions";

/**
 * Starts a bake for a specific version. Fills in the local date on submit (a
 * server default would use UTC and can slip a day during evening bakes), then
 * the server action creates the bake and redirects to the combined bake page.
 */
export function BakeThisButton({
  versionId,
  label = "Bake this",
}: {
  versionId: string;
  label?: string;
}) {
  const dateRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={createBakeAction}
      className="flex-1"
      onSubmit={() => {
        if (dateRef.current) {
          const now = new Date();
          const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
          dateRef.current.value = local.toISOString().slice(0, 10);
        }
      }}
    >
      <input type="hidden" name="versionId" value={versionId} />
      <input type="hidden" name="bakedOn" ref={dateRef} />
      <button
        type="submit"
        className="w-full rounded-xl bg-terracotta py-2.5 text-center text-sm font-medium text-cream active:scale-[0.99]"
      >
        {label}
      </button>
    </form>
  );
}
