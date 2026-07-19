/**
 * Auto-fetch current humidity/temp from Open-Meteo (free, no API key).
 * GF baking is humidity-sensitive; this is captured silently per bake —
 * Emma never enters it. Requires BAKE_LAT / BAKE_LON env vars; returns
 * null (and the bake saves fine without weather) when unset or on failure.
 */
export async function fetchCurrentWeather(): Promise<{
  humidity?: number;
  tempF?: number;
} | null> {
  const lat = process.env.BAKE_LAT;
  const lon = process.env.BAKE_LON;
  if (!lat || !lon) return null;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=relative_humidity_2m,temperature_2m&temperature_unit=fahrenheit`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      humidity: data.current?.relative_humidity_2m,
      tempF: data.current?.temperature_2m,
    };
  } catch {
    return null;
  }
}
