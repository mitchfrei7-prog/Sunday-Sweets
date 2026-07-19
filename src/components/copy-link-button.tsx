"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard unavailable (e.g. http) — select-and-copy fallback
          window.prompt("Copy this link:", url);
        }
      }}
      className="w-full rounded-xl border border-terracotta py-2.5 text-sm font-medium text-terracotta-dark"
    >
      {copied ? "Copied!" : "Copy share link"}
    </button>
  );
}
