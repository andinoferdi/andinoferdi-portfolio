export type PreloadAssetKind = "image" | "audio" | "document" | "other";

export interface PreloadAsset {
  url: string;
  kind: PreloadAssetKind;
  size?: number;
}

export interface PreloadResult {
  url: string;
  kind: PreloadAssetKind;
  success: boolean;
  fromCache: boolean;
  bytesLoaded?: number;
  reason?: string;
}

export interface PreloadProgress {
  total: number;
  completed: number;
  succeeded: number;
  failed: number;
  current: PreloadResult;
}

export interface RunStrictPreloadOptions {
  concurrencyByKind?: Partial<Record<PreloadAssetKind, number>>;
  timeoutByKindMs?: Partial<Record<PreloadAssetKind, number>>;
  onProgress?: (progress: PreloadProgress) => void;
}

export interface RunStrictPreloadResult {
  total: number;
  completed: number;
  succeeded: number;
  failed: number;
  outcomes: PreloadResult[];
}

export interface PreloadAudioOptions {
  crossOrigin?: boolean;
}

export const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
export const IMAGE_SIZES = [16, 32, 48, 64, 96, 128, 256, 384];

const DEFAULT_TIMEOUT_BY_KIND_MS: Record<PreloadAssetKind, number> = {
  image: 60000,
  audio: 120000,
  document: 60000,
  other: 60000,
};

const DEFAULT_CONCURRENCY_BY_KIND: Record<PreloadAssetKind, number> = {
  image: 6,
  audio: 2,
  document: 2,
  other: 2,
};

const preloadedAssets = new Set<string>();
const PRELOAD_COMPLETE_STORAGE_KEY = "initial_preload_complete_v1";

const isBrowser = () => typeof window !== "undefined";

const normalizeUrl = (url: string): string => encodeURI(url);

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  return "unknown_error";
};

const createSuccessResult = (
  url: string,
  kind: PreloadAssetKind,
  fromCache: boolean,
  bytesLoaded?: number
): PreloadResult => ({
  url,
  kind,
  success: true,
  fromCache,
  bytesLoaded,
});

const createFailedResult = (
  url: string,
  kind: PreloadAssetKind,
  reason: string,
  fromCache = false
): PreloadResult => ({
  url,
  kind,
  success: false,
  fromCache,
  reason,
});

const runTaskPool = async <T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> => {
  if (!items.length) return;

  let cursor = 0;
  const workerCount = Math.max(1, Math.min(concurrency, items.length));

  const runners = Array.from({ length: workerCount }, async () => {
    while (true) {
      const currentIndex = cursor++;
      if (currentIndex >= items.length) return;
      await worker(items[currentIndex]!);
    }
  });

  await Promise.all(runners);
};

export const preloadImageStrict = async (
  url: string,
  timeoutMs = DEFAULT_TIMEOUT_BY_KIND_MS.image
): Promise<PreloadResult> => {
  if (!isBrowser()) return createFailedResult(url, "image", "not_in_browser");

  if (preloadedAssets.has(url)) {
    return createSuccessResult(url, "image", true);
  }

  return new Promise<PreloadResult>((resolve) => {
    const img = new Image();
    let settled = false;

    const done = (result: PreloadResult) => {
      if (settled) return;
      settled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
      resolve(result);
    };

    const timeoutId = window.setTimeout(() => {
      done(createFailedResult(url, "image", "timeout"));
    }, timeoutMs);

    img.onload = () => {
      preloadedAssets.add(url);
      done(createSuccessResult(url, "image", false));
    };

    img.onerror = () => {
      done(createFailedResult(url, "image", "image_load_failed"));
    };

    img.src = normalizeUrl(url);
  });
};

export const preloadBinaryStrict = async (
  url: string,
  kind: Exclude<PreloadAssetKind, "image">,
  timeoutMs = DEFAULT_TIMEOUT_BY_KIND_MS[kind]
): Promise<PreloadResult> => {
  if (!isBrowser()) return createFailedResult(url, kind, "not_in_browser");

  if (preloadedAssets.has(url)) {
    return createSuccessResult(url, kind, true);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(normalizeUrl(url), {
      method: "GET",
      cache: "force-cache",
      signal: controller.signal,
    });

    if (!response.ok) {
      return createFailedResult(url, kind, `http_${response.status}`);
    }

    const bytesLoaded = (await response.arrayBuffer()).byteLength;
    preloadedAssets.add(url);
    return createSuccessResult(url, kind, false, bytesLoaded);
  } catch (error) {
    return createFailedResult(url, kind, getErrorMessage(error));
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const preloadAssetStrict = async (
  asset: PreloadAsset,
  timeoutByKindMs: Partial<Record<PreloadAssetKind, number>> = {}
): Promise<PreloadResult> => {
  const timeoutMs =
    timeoutByKindMs[asset.kind] ?? DEFAULT_TIMEOUT_BY_KIND_MS[asset.kind];

  if (asset.kind === "image") {
    return preloadImageStrict(asset.url, timeoutMs);
  }

  return preloadBinaryStrict(asset.url, asset.kind, timeoutMs);
};

export const runStrictPreload = async (
  assets: PreloadAsset[],
  options: RunStrictPreloadOptions = {}
): Promise<RunStrictPreloadResult> => {
  const uniqueAssets = Array.from(
    new Map(assets.map((asset) => [asset.url, asset])).values()
  );

  if (!uniqueAssets.length) {
    return {
      total: 0,
      completed: 0,
      succeeded: 0,
      failed: 0,
      outcomes: [],
    };
  }

  const concurrencyByKind = {
    ...DEFAULT_CONCURRENCY_BY_KIND,
    ...options.concurrencyByKind,
  };

  const outcomes: PreloadResult[] = [];
  let completed = 0;
  let succeeded = 0;
  let failed = 0;

  const pushOutcome = (outcome: PreloadResult) => {
    outcomes.push(outcome);
    completed += 1;
    if (outcome.success) succeeded += 1;
    else failed += 1;

    options.onProgress?.({
      total: uniqueAssets.length,
      completed,
      succeeded,
      failed,
      current: outcome,
    });
  };

  const assetsByKind: Record<PreloadAssetKind, PreloadAsset[]> = {
    image: [],
    audio: [],
    document: [],
    other: [],
  };

  for (const asset of uniqueAssets) {
    assetsByKind[asset.kind].push(asset);
  }

  await Promise.all(
    (Object.keys(assetsByKind) as PreloadAssetKind[]).map(async (kind) => {
      const queue = assetsByKind[kind];
      if (!queue.length) return;

      await runTaskPool(queue, concurrencyByKind[kind], async (asset) => {
        const outcome = await preloadAssetStrict(asset, options.timeoutByKindMs);
        pushOutcome(outcome);
      });
    })
  );

  return {
    total: uniqueAssets.length,
    completed,
    succeeded,
    failed,
    outcomes,
  };
};

export const preloadImage = async (src: string): Promise<void> => {
  const result = await preloadImageStrict(src);
  if (!result.success) {
    console.warn(`Failed to preload image: ${src} (${result.reason ?? "error"})`);
  }
};

export const preloadImagesBatch = async (
  images: string[],
  batchSize = 5
): Promise<void> => {
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    await Promise.all(batch.map((img) => preloadImage(img)));
  }
};

export const preloadAudio = async (
  src: string,
  options: PreloadAudioOptions = {}
): Promise<void> => {
  if (options.crossOrigin) {
    // Reserved for parity with previous API shape.
  }

  const result = await preloadBinaryStrict(src, "audio");
  if (!result.success) {
    console.warn(`Failed to preload audio: ${src} (${result.reason ?? "error"})`);
  }
};

export const preloadDocument = async (url: string): Promise<void> => {
  const result = await preloadBinaryStrict(url, "document");
  if (!result.success) {
    console.warn(
      `Failed to preload document: ${url} (${result.reason ?? "error"})`
    );
  }
};

export const isAssetPreloaded = (src: string): boolean => {
  return preloadedAssets.has(src);
};

export const clearPreloadCache = (): void => {
  preloadedAssets.clear();
};

export const getPreloadedAssetsCount = (): number => {
  return preloadedAssets.size;
};

export const markInitialPreloadComplete = (): void => {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(PRELOAD_COMPLETE_STORAGE_KEY, "1");
};

export const clearInitialPreloadComplete = (): void => {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(PRELOAD_COMPLETE_STORAGE_KEY);
};

export const isInitialPreloadComplete = (): boolean => {
  if (!isBrowser()) return false;
  return window.sessionStorage.getItem(PRELOAD_COMPLETE_STORAGE_KEY) === "1";
};
