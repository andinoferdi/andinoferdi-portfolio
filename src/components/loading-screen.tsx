"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HoverBorderGradient } from "@/components/ui/hover-border-button";
import {
  Download,
  FileText,
  Image as ImageIcon,
  Music,
  Play,
  RefreshCw,
} from "lucide-react";
import {
  clearInitialPreloadComplete,
  markInitialPreloadComplete,
  runStrictPreload,
  type PreloadAsset,
  type PreloadAssetKind,
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

const CONCURRENCY_BY_KIND: Record<PreloadAssetKind, number> = {
  image: 6,
  audio: 2,
  document: 2,
  other: 2,
};

const KIND_LABEL: Record<PreloadAssetKind, string> = {
  image: "Images",
  audio: "Audio",
  document: "Documents",
  other: "Other Assets",
};

const KIND_ICON: Record<PreloadAssetKind, ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  audio: Music,
  document: FileText,
  other: Download,
};

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const rounded = unitIndex === 0 ? Math.round(size) : size.toFixed(1);
  return `${rounded} ${units[unitIndex]}`;
};

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showStartButton, setShowStartButton] = useState(false);
  const [currentAsset, setCurrentAsset] = useState("Preparing preload...");
  const [currentKind, setCurrentKind] = useState<PreloadAssetKind>("image");
  const [totalAssets, setTotalAssets] = useState(0);
  const [loadedAssets, setLoadedAssets] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [loadedBytes, setLoadedBytes] = useState(0);
  const [failedAssets, setFailedAssets] = useState<PreloadResult[]>([]);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const failedSummaryText = useMemo(() => {
    if (!failedAssets.length) return "";
    const firstThree = failedAssets.slice(0, 3).map((asset) => asset.url);
    const remaining = failedAssets.length - firstThree.length;
    return remaining > 0
      ? `${firstThree.join(", ")} and ${remaining} more`
      : firstThree.join(", ");
  }, [failedAssets]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const preloadAssets = async () => {
      clearInitialPreloadComplete();
      setIsLoading(true);
      setShowStartButton(false);
      setManifestError(null);
      setFailedAssets([]);
      setProgress(0);
      setTotalAssets(0);
      setLoadedAssets(0);
      setTotalBytes(0);
      setLoadedBytes(0);
      setCurrentAsset("Fetching asset manifest...");
      setCurrentKind("other");

      try {
        const response = await fetch("/api/preload-assets", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`manifest_http_${response.status}`);
        }

        const manifest = (await response.json()) as PreloadManifestResponse;
        if (cancelled) return;

        const assets = manifest.assets ?? [];
        const sizeByUrl = new Map(assets.map((asset) => [asset.url, asset.size ?? 0]));

        setTotalAssets(manifest.totalCount ?? assets.length);
        setTotalBytes(manifest.totalBytes ?? 0);

        if (!assets.length) {
          setProgress(100);
          setIsLoading(false);
          setShowStartButton(true);
          setCurrentAsset("No assets found to preload.");
          markInitialPreloadComplete();
          return;
        }

        let succeededBytes = 0;

        const result = await runStrictPreload(assets, {
          concurrencyByKind: CONCURRENCY_BY_KIND,
          onProgress: (state) => {
            if (cancelled) return;

            if (state.current.success) {
              succeededBytes += sizeByUrl.get(state.current.url) ?? 0;
            }

            setLoadedAssets(state.succeeded);
            setLoadedBytes(succeededBytes);
            setProgress(Math.floor((state.succeeded / state.total) * 100));
            setCurrentAsset(
              `${KIND_LABEL[state.current.kind]}: ${state.current.url}`
            );
            setCurrentKind(state.current.kind);
          },
        });

        if (cancelled) return;

        const failures = result.outcomes.filter((outcome) => !outcome.success);
        setFailedAssets(failures);

        if (!failures.length) {
          setProgress(100);
          setIsLoading(false);
          setShowStartButton(true);
          setCurrentAsset("All assets downloaded successfully.");
          setCurrentKind("other");
          markInitialPreloadComplete();
          return;
        }

        setIsLoading(false);
        setShowStartButton(false);
        setCurrentAsset("Some assets failed to preload.");
        setCurrentKind("other");
      } catch (error) {
        if (cancelled) return;
        setManifestError(
          error instanceof Error ? error.message : "Failed to load manifest"
        );
        setIsLoading(false);
        setShowStartButton(false);
        setCurrentKind("other");
      }
    };

    void preloadAssets();

    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  const handleStart = () => {
    setShowStartButton(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleRetry = () => {
    setRetryToken((prev) => prev + 1);
  };

  const CurrentAssetIcon = KIND_ICON[currentKind];

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
                <div className="mb-4 flex items-center justify-center gap-2">
                  <CurrentAssetIcon className="h-5 w-5 text-primary" />
                  <span className="max-w-[260px] truncate text-sm text-muted-foreground">
                    {currentAsset}
                  </span>
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
                  <div className="flex items-center justify-between">
                    <span>{formatBytes(loadedBytes)} loaded</span>
                    <span>{formatBytes(totalBytes)} total</span>
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
                  : `${failedAssets.length} asset(s) failed to download.`}
              </p>

              {!manifestError && failedSummaryText && (
                <p className="max-w-lg break-words text-xs text-muted-foreground/90">
                  {failedSummaryText}
                </p>
              )}

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
