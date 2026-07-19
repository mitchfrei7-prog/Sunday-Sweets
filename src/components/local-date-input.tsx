"use client";

import { useEffect, useRef } from "react";

/**
 * Date input that defaults to the user's local "today". A server-rendered
 * default would use UTC, which flips to tomorrow during evening bakes.
 */
export function LocalDateInput({
  id,
  name,
  className,
}: {
  id: string;
  name: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current && !ref.current.value) {
      const now = new Date();
      const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
      ref.current.value = local.toISOString().slice(0, 10);
    }
  }, []);

  return (
    <input ref={ref} id={id} name={name} type="date" required className={className} />
  );
}
