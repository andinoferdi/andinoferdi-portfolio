"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HoverBorderGradient } from "@/components/ui/hover-border-button";
import { Play, RefreshCw } from "lucide-react";
import {
  clearInitialPreloadComplete,
  markInitialPreloadComplete,
  runStrictPreload,
  type PreloadAsset,
  type PreloadResult,
} from "@/services/preload";

interface LoadingScreenProps {
  onComplete: () => void;
}

interface PreloadManifestResponse {
  assets: PreloadAsset[];
  totalCount: number;
  totalBytes: number;
}

let preloadManifestPromise: Promise<PreloadManifestResponse> | null = null;

const fetchPreloadManifest = async (): Promise<PreloadManifestResponse> => {
  const response = await fetch("/api/preload-assets", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`manifest_http_${response.status}`);
  }

  return (await response.json()) as PreloadManifestResponse;
};

const getPreloadManifest = (): Promise<PreloadManifestResponse> => {
  if (!preloadManifestPromise) {
    preloadManifestPromise = fetchPreloadManifest().catch((error) => {
      preloadManifestPromise = null;
      throw error;
    });
  }

  return preloadManifestPromise;
};

const resetPreloadManifestPromise = (): void => {
  preloadManifestPromise = null;
};

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showStartButton, setShowStartButton] = useState(false);
  const [statusText, setStatusText] = useState("Preparing your experience...");
  const [totalAssets, setTotalAssets] = useState(0);
  const [loadedAssets, setLoadedAssets] = useState(0);
  const [failedAssets, setFailedAssets] = useState<PreloadResult[]>([]);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const preloadController = new AbortController();

    const preloadAssets = async () => {
      clearInitialPreloadComplete();
      setIsLoading(true);
      setShowStartButton(false);
      setManifestError(null);
      setFailedAssets([]);
      setProgress(0);
      setTotalAssets(0);
      setLoadedAssets(0);
      setStatusText("Fetching preload manifest...");

      try {
        const manifest = await getPreloadManifest();
        if (cancelled) return;

        const assets = manifest.assets ?? [];

        setTotalAssets(manifest.totalCount ?? assets.length);
        setStatusText("Downloading all assets...");

        if (!assets.length) {
          setProgress(100);
          setIsLoading(false);
          setShowStartButton(true);
          markInitialPreloadComplete();
          return;
        }

        const result = await runStrictPreload(assets, {
          signal: preloadController.signal,
          onProgress: (state) => {
            if (cancelled) return;

            setLoadedAssets(state.succeeded);
            const progressByBytes =
              state.totalBytes > 0
                ? Math.floor((state.loadedBytes / state.totalBytes) * 100)
                : Math.floor((state.succeeded / state.total) * 100);

            setProgress(Math.min(100, Math.max(0, progressByBytes)));
            setStatusText(
              state.retrying
                ? "Retrying failed downloads..."
                : "Downloading all assets..."
            );
          },
        });

        if (cancelled) return;

        const failures = result.outcomes.filter((outcome) => !outcome.success);
        setFailedAssets(failures);

        if (!failures.length) {
          setProgress(100);
          setIsLoading(false);
          setShowStartButton(true);
          setStatusText("All assets loaded successfully.");
          markInitialPreloadComplete();
          return;
        }

        setIsLoading(false);
        setShowStartButton(false);
        setStatusText("Some assets failed to preload.");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setManifestError(
          error instanceof Error ? error.message : "Failed to load manifest"
        );
        setIsLoading(false);
        setShowStartButton(false);
      }
    };

    void preloadAssets();

    return () => {
      cancelled = true;
      preloadController.abort();
    };
  }, [retryToken]);

  const handleStart = () => {
    setShowStartButton(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleRetry = () => {
    resetPreloadManifestPromise();
    setRetryToken((prev) => prev + 1);
  };

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background"
        >
          <div className="relative z-10 mx-auto max-w-md px-6 text-center">
            <div className="flex flex-col items-center justify-center space-y-8">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-center"
              >
                <h1 className="mb-2 text-4xl font-bold text-foreground md:text-6xl">
                  Loading
                </h1>
                <p className="text-lg text-muted-foreground">
                  Downloading all assets from public directory...
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="w-full max-w-sm"
              >
                <div className="mb-4 text-sm text-muted-foreground">
                  {statusText}
                </div>

                <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-linear-to-r from-primary to-primary/80"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>{progress}%</span>
                    <span>
                      {loadedAssets}/{totalAssets} assets
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {!isLoading && !showStartButton && (failedAssets.length > 0 || manifestError) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background"
        >
          <div className="relative z-10 mx-auto max-w-xl px-6 text-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center justify-center space-y-5"
            >
              <h1 className="text-3xl font-bold text-foreground md:text-5xl">
                Preload Failed
              </h1>

              <p className="max-w-lg text-sm text-muted-foreground md:text-base">
                {manifestError
                  ? `Manifest error: ${manifestError}`
                  : `${failedAssets.length} asset(s) failed to download. Please retry.`}
              </p>

              <HoverBorderGradient
                as="button"
                onClick={handleRetry}
                containerClassName="rounded-full"
                className="flex items-center justify-center gap-2 px-8 py-3 text-lg font-medium"
              >
                <RefreshCw className="h-5 w-5" />
                Retry Failed
              </HoverBorderGradient>
            </motion.div>
          </div>
        </motion.div>
      )}

      {showStartButton && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background"
        >
          <div className="relative z-10 mx-auto max-w-md px-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center justify-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-r from-primary to-primary/80"
              >
                <Play className="ml-1 h-8 w-8 text-primary-foreground" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                className="text-center text-4xl font-bold text-foreground md:text-6xl"
              >
                Ready!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
                className="text-center text-lg text-muted-foreground"
              >
                All assets loaded successfully
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
                className="flex justify-center"
              >
                <HoverBorderGradient
                  as="button"
                  onClick={handleStart}
                  containerClassName="rounded-full"
                  className="flex items-center justify-center gap-2 px-8 py-3 text-lg font-medium"
                >
                  <Play className="h-5 w-5" />
                  Start Experience
                </HoverBorderGradient>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
