/**
 * Human-facing name for a version. Uses Emma's custom label ("½ flour ½ oats")
 * when she set one, otherwise falls back to the auto number.
 * `short` gives "v3" for tight spots; default gives "Version 3".
 */
export function versionName(
  v: { label?: string | null; versionNumber: number },
  opts?: { short?: boolean },
): string {
  const custom = v.label?.trim();
  if (custom) return custom;
  return opts?.short ? `v${v.versionNumber}` : `Version ${v.versionNumber}`;
}
