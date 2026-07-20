/**
 * Whether Vercel Blob is wired up (a store created + BLOB_READ_WRITE_TOKEN set).
 * Photo upload degrades gracefully when it isn't. Server-only — the token is
 * never exposed to the client.
 */
export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}
