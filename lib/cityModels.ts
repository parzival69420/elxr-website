import { cityJourney } from "./city";

export const CITY_MODEL_FILES = [
  "architecture-kit",
  "street-kit",
  "one-times-square",
  "empire-state",
  "one-world-trade",
  "one-vanderbilt",
  "hudson-yards-edge",
] as const;

export const cityModelUrl = (file: string) => `/models/city/${file}.glb`;

/** Starts the model downloads from an inline script, before any bundle has loaded.
 *  The fetches are picked up by `prefetchCityModels` once the page's JS runs. */
export const cityModelsInlineScript = `window.__elxrCityFetches=${JSON.stringify(
  Object.fromEntries(CITY_MODEL_FILES.map((file) => [file, cityModelUrl(file)])),
)};for(var k in window.__elxrCityFetches)window.__elxrCityFetches[k]=fetch(window.__elxrCityFetches[k]).catch(function(){});`;

declare global {
  interface Window {
    __elxrCityFetches?: Record<string, Promise<Response | undefined>>;
  }
}

/** Downloaded share of the loading bar; the rest fills as the scene parses and compiles. */
const DOWNLOAD_SHARE = 0.8;

let pending: Promise<Map<string, ArrayBuffer>> | null = null;

/** Every city model's bytes, keyed by URL, streamed during the loading screen with real
 *  progress written to `cityJourney.load`. Never rejects: a file that fails is left out and
 *  the scene fetches it itself. */
export function prefetchCityModels() {
  if (pending) return pending;
  const received = new Map<string, number>();
  const sizes = new Map<string, number>();
  const done = new Set<string>();
  const report = () => {
    // Byte progress when every size is known; otherwise count finished files.
    const total = Array.from(sizes.values()).reduce((a, b) => a + b, 0);
    const fraction =
      sizes.size === CITY_MODEL_FILES.length && total
        ? Array.from(received.values()).reduce((a, b) => a + b, 0) / total
        : done.size / CITY_MODEL_FILES.length;
    cityJourney.load = Math.max(cityJourney.load, Math.min(1, fraction) * DOWNLOAD_SHARE);
  };
  const load = async (file: string): Promise<[string, ArrayBuffer] | null> => {
    const url = cityModelUrl(file);
    try {
      const response = await (window.__elxrCityFetches?.[file] ?? fetch(url));
      if (!response?.ok) return null;
      const length = Number(response.headers.get("content-length"));
      // A compressed response reports its compressed length, which the body won't match.
      if (length && !response.headers.get("content-encoding")) sizes.set(file, length);
      if (!response.body) return [url, await response.arrayBuffer()];
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let bytes = 0;
      for (;;) {
        const { done: finished, value } = await reader.read();
        if (finished) break;
        chunks.push(value);
        bytes += value.byteLength;
        received.set(file, bytes);
        report();
      }
      const buffer = new Uint8Array(bytes);
      let offset = 0;
      for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return [url, buffer.buffer];
    } catch {
      return null;
    } finally {
      done.add(file);
      report();
    }
  };
  pending = Promise.all(CITY_MODEL_FILES.map(load)).then(
    (entries) => new Map(entries.filter((entry) => entry !== null)),
  );
  return pending;
}
