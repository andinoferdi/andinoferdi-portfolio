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
  totalBytes: number;
  loadedBytes: number;
  attempt: number;
  retrying: boolean;
  current: PreloadResult;
}

export interface RunStrictPreloadOptions {
  concurrencyByKind?: Partial<Record<PreloadAssetKind, number>>;
  timeoutByKindMs?: Partial<Record<PreloadAssetKind, number>>;
  retryBaseDelayMsByKind?: Partial<Record<PreloadAssetKind, number>>;
  maxRetryAttemptsPerAsset?: number;
  signal?: AbortSignal;
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

const SLOW_CONCURRENCY_BY_KIND: Record<PreloadAssetKind, number> = {
  image: 3,
  audio: 1,
  document: 1,
  other: 1,
};

const VERY_SLOW_CONCURRENCY_BY_KIND: Record<PreloadAssetKind, number> = {
  image: 2,
  audio: 1,
  document: 1,
  other: 1,
};

const DEFAULT_RETRY_BASE_DELAY_BY_KIND_MS: Record<PreloadAssetKind, number> = {
  image: 1200,
  audio: 2000,
  document: 1600,
  other: 1600,
};

const MIN_TIMEOUT_BY_KIND_MS: Record<PreloadAssetKind, number> = {
  image: 12000,
  audio: 20000,
  document: 15000,
  other: 15000,
};

const MAX_TIMEOUT_BY_KIND_MS = 300000;

const preloadedAssets = new Set<string>();
const preloadedAudioObjectUrls = new Map<string, string>();
const preloadedAudioObjectUrlPromises = new Map<string, Promise<string | null>>();
const PRELOAD_COMPLETE_STORAGE_KEY = "initial_preload_complete_v1";

const isBrowser = () => typeof window !== "undefined";

const normalizeUrl = (url: string): string => encodeURI(url);

const toAssetKey = (url: string): string => {
  if (!url) return "";
  if (!isBrowser()) return normalizeUrl(url);

  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return parsed.toString();
  } catch {
    return normalizeUrl(url);
  }
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  return "unknown_error";
};

interface NetworkHints {
  downlinkMbps: number | null;
  rttMs: number | null;
  effectiveType: string | null;
}

interface AdaptiveProfile {
  timeoutByKindMs: Record<PreloadAssetKind, number>;
  concurrencyByKind: Record<PreloadAssetKind, number>;
  retryBaseDelayByKindMs: Record<PreloadAssetKind, number>;
}

const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
};

const toFinitePositive = (value: unknown): number | null => {
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
};

const getNetworkHints = (): NetworkHints => {
  if (!isBrowser()) {
    return {
      downlinkMbps: null,
      rttMs: null,
      effectiveType: null,
    };
  }

  const nav = navigator as Navigator & {
    connection?: {
      downlink?: number;
      rtt?: number;
      effectiveType?: string;
    };
  };

  const conn = nav.connection;
  return {
    downlinkMbps: toFinitePositive(conn?.downlink) ?? null,
    rttMs: toFinitePositive(conn?.rtt) ?? null,
    effectiveType: conn?.effectiveType ?? null,
  };
};

const getFallbackDownlinkMbps = (effectiveType: string | null): number => {
  if (!effectiveType) return 1.2;
  if (effectiveType.includes("slow-2g")) return 0.05;
  if (effectiveType.includes("2g")) return 0.2;
  if (effectiveType.includes("3g")) return 0.7;
  if (effectiveType.includes("4g")) return 2.5;
  return 1.2;
};

const estimateTimeoutMs = (
  kind: PreloadAssetKind,
  sizeBytes: number | undefined,
  hints: NetworkHints
): number => {
  const safeSize = Number.isFinite(sizeBytes) && (sizeBytes as number) > 0
    ? (sizeBytes as number)
    : 0;

  if (!safeSize) return DEFAULT_TIMEOUT_BY_KIND_MS[kind];

  const downlinkMbps =
    hints.downlinkMbps ?? getFallbackDownlinkMbps(hints.effectiveType);
  const rttMs = hints.rttMs ?? 300;

  const bitsPerSecond = Math.max(10000, downlinkMbps * 1_000_000);
  const transferMs = (safeSize * 8 * 1000) / bitsPerSecond;

  const multiplierByKind: Record<PreloadAssetKind, number> = {
    image: 1.7,
    audio: 2.2,
    document: 1.9,
    other: 1.9,
  };

  const estimated =
    transferMs * multiplierByKind[kind] + rttMs * 2 + 4500;

  return clamp(
    Math.ceil(estimated),
    MIN_TIMEOUT_BY_KIND_MS[kind],
    MAX_TIMEOUT_BY_KIND_MS
  );
};

const detectAdaptiveProfile = (
  assets: PreloadAsset[]
): AdaptiveProfile => {
  const networkHints = getNetworkHints();

  const slowNetwork =
    (networkHints.effectiveType?.includes("2g") ?? false) ||
    (networkHints.effectiveType?.includes("3g") ?? false) ||
    (networkHints.downlinkMbps != null && networkHints.downlinkMbps < 1.5) ||
    (networkHints.rttMs != null && networkHints.rttMs > 400);

  const verySlowNetwork =
    (networkHints.effectiveType?.includes("slow-2g") ?? false) ||
    (networkHints.downlinkMbps != null && networkHints.downlinkMbps < 0.6) ||
    (networkHints.rttMs != null && networkHints.rttMs > 800);

  const baseConcurrency = verySlowNetwork
    ? VERY_SLOW_CONCURRENCY_BY_KIND
    : slowNetwork
      ? SLOW_CONCURRENCY_BY_KIND
      : DEFAULT_CONCURRENCY_BY_KIND;

  const timeoutByKindMs: Record<PreloadAssetKind, number> = {
    image: DEFAULT_TIMEOUT_BY_KIND_MS.image,
    audio: DEFAULT_TIMEOUT_BY_KIND_MS.audio,
    document: DEFAULT_TIMEOUT_BY_KIND_MS.document,
    other: DEFAULT_TIMEOUT_BY_KIND_MS.other,
  };

  for (const asset of assets) {
    const candidate = estimateTimeoutMs(asset.kind, asset.size, networkHints);
    timeoutByKindMs[asset.kind] = Math.max(timeoutByKindMs[asset.kind], candidate);
  }

  return {
    timeoutByKindMs,
    concurrencyByKind: { ...baseConcurrency },
    retryBaseDelayByKindMs: { ...DEFAULT_RETRY_BASE_DELAY_BY_KIND_MS },
  };
};

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, Math.max(0, ms));

    const onAbort = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }

      signal.addEventListener("abort", onAbort, { once: true });
    }
  });

const waitUntilOnline = async (signal?: AbortSignal): Promise<void> => {
  if (!isBrowser()) return;
  if (typeof navigator === "undefined" || navigator.onLine) return;

  await new Promise<void>((resolve, reject) => {
    const onOnline = () => {
      cleanup();
      resolve();
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };

    const cleanup = () => {
      window.removeEventListener("online", onOnline);
      signal?.removeEventListener("abort", onAbort);
    };

    window.addEventListener("online", onOnline, { once: true });

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
};

const getRetryDelayMs = (
  kind: PreloadAssetKind,
  attempt: number,
  retryBaseDelayMsByKind: Record<PreloadAssetKind, number>
): number => {
  const base = retryBaseDelayMsByKind[kind];
  const exponential = base * Math.pow(1.6, Math.max(0, attempt - 1));
  const jitter = 0.85 + Math.random() * 0.3;
  return Math.min(30000, Math.round(exponential * jitter));
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

const consumeResponseStream = async (
  response: Response,
  signal?: AbortSignal
): Promise<number> => {
  if (!response.body) {
    const fallback = await response.arrayBuffer();
    return fallback.byteLength;
  }

  const reader = response.body.getReader();
  let total = 0;

  try {
    while (true) {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const { done, value } = await reader.read();
      if (done) break;
      total += value?.byteLength ?? 0;
    }
  } finally {
    reader.releaseLock();
  }

  return total;
};

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
  timeoutMs = DEFAULT_TIMEOUT_BY_KIND_MS.image,
  signal?: AbortSignal
): Promise<PreloadResult> => {
  if (!isBrowser()) return createFailedResult(url, "image", "not_in_browser");
  const assetKey = toAssetKey(url);

  if (preloadedAssets.has(assetKey)) {
    return createSuccessResult(url, "image", true);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();

  if (signal) {
    if (signal.aborted) {
      window.clearTimeout(timeoutId);
      return createFailedResult(url, "image", "aborted");
    }
    signal.addEventListener("abort", onAbort, { once: true });
  }

  try {
    const response = await fetch(normalizeUrl(url), {
      method: "GET",
      cache: "force-cache",
      signal: controller.signal,
    });

    if (!response.ok) {
      return createFailedResult(url, "image", `http_${response.status}`);
    }

    let bytesLoaded = await consumeResponseStream(response, controller.signal);
    if (bytesLoaded <= 0) {
      const contentLength = Number.parseInt(
        response.headers.get("content-length") ?? "",
        10
      );
      if (Number.isFinite(contentLength) && contentLength > 0) {
        bytesLoaded = contentLength;
      }
    }

    preloadedAssets.add(assetKey);
    return createSuccessResult(url, "image", false, bytesLoaded);
  } catch (error) {
    if (controller.signal.aborted) {
      return createFailedResult(url, "image", signal?.aborted ? "aborted" : "timeout");
    }
    return createFailedResult(url, "image", getErrorMessage(error));
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onAbort);
  }
};

export const preloadBinaryStrict = async (
  url: string,
  kind: Exclude<PreloadAssetKind, "image">,
  timeoutMs = DEFAULT_TIMEOUT_BY_KIND_MS[kind],
  signal?: AbortSignal
): Promise<PreloadResult> => {
  if (!isBrowser()) return createFailedResult(url, kind, "not_in_browser");
  const assetKey = toAssetKey(url);

  if (preloadedAssets.has(assetKey)) {
    return createSuccessResult(url, kind, true);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();

  if (signal) {
    if (signal.aborted) {
      window.clearTimeout(timeoutId);
      return createFailedResult(url, kind, "aborted");
    }
    signal.addEventListener("abort", onAbort, { once: true });
  }

  try {
    const response = await fetch(normalizeUrl(url), {
      method: "GET",
      cache: "force-cache",
      signal: controller.signal,
    });

    if (!response.ok) {
      return createFailedResult(url, kind, `http_${response.status}`);
    }

    let bytesLoaded = await consumeResponseStream(response, controller.signal);
    if (bytesLoaded <= 0) {
      const contentLength = Number.parseInt(
        response.headers.get("content-length") ?? "",
        10
      );
      if (Number.isFinite(contentLength) && contentLength > 0) {
        bytesLoaded = contentLength;
      }
    }
    preloadedAssets.add(assetKey);

    return createSuccessResult(url, kind, false, bytesLoaded);
  } catch (error) {
    if (controller.signal.aborted) {
      return createFailedResult(url, kind, signal?.aborted ? "aborted" : "timeout");
    }
    return createFailedResult(url, kind, getErrorMessage(error));
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onAbort);
  }
};

export const preloadAssetStrict = async (
  asset: PreloadAsset,
  timeoutByKindMs: Partial<Record<PreloadAssetKind, number>> = {},
  signal?: AbortSignal
): Promise<PreloadResult> => {
  const timeoutMs =
    timeoutByKindMs[asset.kind] ?? DEFAULT_TIMEOUT_BY_KIND_MS[asset.kind];

  if (asset.kind === "image") {
    return preloadImageStrict(asset.url, timeoutMs, signal);
  }

  return preloadBinaryStrict(asset.url, asset.kind, timeoutMs, signal);
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

  const adaptiveProfile = detectAdaptiveProfile(uniqueAssets);

  const concurrencyByKind = {
    ...adaptiveProfile.concurrencyByKind,
    ...options.concurrencyByKind,
  };

  const timeoutByKindMs = {
    ...adaptiveProfile.timeoutByKindMs,
    ...options.timeoutByKindMs,
  };

  const retryBaseDelayMsByKind = {
    ...adaptiveProfile.retryBaseDelayByKindMs,
    ...options.retryBaseDelayMsByKind,
  };

  const maxRetryAttemptsPerAsset =
    options.maxRetryAttemptsPerAsset ?? Number.POSITIVE_INFINITY;

  const outcomes: PreloadResult[] = [];
  let completed = 0;
  let succeeded = 0;
  let failed = 0;
  const totalBytes = uniqueAssets.reduce(
    (sum, asset) => sum + (asset.size ?? 0),
    0
  );
  let loadedBytes = 0;

  const pushOutcome = (
    outcome: PreloadResult,
    attempt: number,
    retrying: boolean,
    assetSize: number,
    isFinal: boolean
  ) => {
    if (isFinal) {
      outcomes.push(outcome);
      completed += 1;
      if (outcome.success) {
        succeeded += 1;
        loadedBytes += assetSize > 0 ? assetSize : outcome.bytesLoaded ?? 0;
      } else {
        failed += 1;
      }
    }

    options.onProgress?.({
      total: uniqueAssets.length,
      completed,
      succeeded,
      failed,
      totalBytes,
      loadedBytes,
      attempt,
      retrying,
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
        let attempt = 0;

        while (true) {
          if (options.signal?.aborted) {
            throw new DOMException("Aborted", "AbortError");
          }

          attempt += 1;
          const outcome = await preloadAssetStrict(
            asset,
            timeoutByKindMs,
            options.signal
          );

          if (outcome.success) {
            pushOutcome(outcome, attempt, false, asset.size ?? 0, true);
            return;
          }

          const shouldRetry = attempt < maxRetryAttemptsPerAsset;
          if (!shouldRetry) {
            pushOutcome(outcome, attempt, false, asset.size ?? 0, true);
            return;
          }

          pushOutcome(outcome, attempt, true, asset.size ?? 0, false);

          if (isBrowser() && typeof navigator !== "undefined" && !navigator.onLine) {
            await waitUntilOnline(options.signal);
          }

          const delay = getRetryDelayMs(kind, attempt, retryBaseDelayMsByKind);
          await sleep(delay, options.signal);
        }
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
  return preloadedAssets.has(toAssetKey(src));
};

export const getPreloadedAudioObjectUrl = (src: string): string | null => {
  if (!isBrowser()) return null;
  return preloadedAudioObjectUrls.get(toAssetKey(src)) ?? null;
};

export const ensurePreloadedAudioObjectUrl = async (
  src: string
): Promise<string | null> => {
  if (!isBrowser()) return null;
  const assetKey = toAssetKey(src);

  const existing = preloadedAudioObjectUrls.get(assetKey);
  if (existing) return existing;

  if (preloadedAudioObjectUrlPromises.has(assetKey)) {
    return preloadedAudioObjectUrlPromises.get(assetKey)!;
  }

  const promise = (async () => {
    try {
      if (!preloadedAssets.has(assetKey)) {
        const preloadResult = await preloadBinaryStrict(src, "audio");
        if (!preloadResult.success) return null;
      }

      const response = await fetch(normalizeUrl(src), {
        method: "GET",
        cache: "force-cache",
      });
      if (!response.ok) return null;

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      preloadedAudioObjectUrls.set(assetKey, objectUrl);
      return objectUrl;
    } catch {
      return null;
    } finally {
      preloadedAudioObjectUrlPromises.delete(assetKey);
    }
  })();

  preloadedAudioObjectUrlPromises.set(assetKey, promise);
  return promise;
};

export const clearPreloadCache = (): void => {
  if (isBrowser()) {
    for (const objectUrl of preloadedAudioObjectUrls.values()) {
      URL.revokeObjectURL(objectUrl);
    }
  }
  preloadedAudioObjectUrlPromises.clear();
  preloadedAudioObjectUrls.clear();
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
