/**
 * Vercel Blob's read-write token. Vercel names it <PREFIX>_READ_WRITE_TOKEN —
 * default prefix BLOB, but this project's store uses PUB. The @vercel/blob SDK
 * only auto-reads the default name, so we resolve the token ourselves (any
 * prefix) and pass it to put()/del() explicitly. Server-only — never exposed to
 * the client.
 */
export function getBlobToken(): string | undefined {
  return (
    process.env.BLOB_READ_WRITE_TOKEN ??
    process.env.PUB_READ_WRITE_TOKEN ??
    Object.entries(process.env).find(([k]) =>
      k.endsWith("_READ_WRITE_TOKEN"),
    )?.[1]
  );
}

/** Whether Blob uploads can authenticate (a read-write token is available). */
export function isBlobConfigured(): boolean {
  return Boolean(getBlobToken());
}
