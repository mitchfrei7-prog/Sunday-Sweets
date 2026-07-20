/**
 * Whether Vercel Blob is wired up. Two auth models are supported:
 *  - Static token: BLOB_READ_WRITE_TOKEN (set when the store is created).
 *  - OIDC "connect to project" (Vercel's default): the SDK pairs BLOB_STORE_ID
 *    with the auto-rotated VERCEL_OIDC_TOKEN, so no static token exists.
 * Either one means uploads can authenticate. Server-only — no secret is exposed
 * to the client. On Vercel, VERCEL_OIDC_TOKEN is injected at deploy time; for
 * local dev with the OIDC model, run `vercel env pull` to fetch one.
 */
export function isBlobConfigured(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID,
  );
}
