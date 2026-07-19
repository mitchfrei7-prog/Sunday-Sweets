"use client";

import { useId, useState } from "react";

/**
 * Half-star precision rating input (0.5–5.0). Tap the left half of a star
 * for the half value, the right half for the full value. Submits via a
 * hidden input so it works inside plain server-action forms.
 */
export function StarRatingInput({
  name,
  label,
  defaultValue = 0,
}: {
  name: string;
  label: string;
  defaultValue?: number;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          <input type="hidden" name={name} value={value > 0 ? value : ""} />
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="relative inline-block size-9">
              <Star
                fill={value >= i ? "full" : value >= i - 0.5 ? "half" : "none"}
              />
              <button
                type="button"
                aria-label={`${label}: ${i - 0.5} stars`}
                className="absolute inset-y-0 left-0 w-1/2"
                onClick={() => setValue(i - 0.5)}
              />
              <button
                type="button"
                aria-label={`${label}: ${i} stars`}
                className="absolute inset-y-0 right-0 w-1/2"
                onClick={() => setValue(i)}
              />
            </span>
          ))}
        </div>
        <span className="w-8 text-right text-sm tabular-nums text-latte">
          {value > 0 ? value.toFixed(1) : "—"}
        </span>
      </div>
    </div>
  );
}

function Star({ fill }: { fill: "full" | "half" | "none" }) {
  const id = useId();
  const path =
    "M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5L2.6 9.3l6.5-.9z";
  return (
    <svg viewBox="0 0 24 24" className="size-9" aria-hidden="true">
      {fill === "half" && (
        <defs>
          <linearGradient id={id}>
            <stop offset="50%" stopColor="#d9962e" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
      )}
      <path
        d={path}
        fill={
          fill === "full" ? "#d9962e" : fill === "half" ? `url(#${id})` : "none"
        }
        stroke="#d9962e"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
