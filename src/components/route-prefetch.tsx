"use client";

import { useEffect } from "react";
import { isInitialPreloadComplete, preloadImage } from "@/services/preload";
import { getGalleryData } from "@/services/gallery";
import { getProjectsData } from "@/services/projects";

type IdleWindow = Omit<Window, "requestIdleCallback" | "cancelIdleCallback"> & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout?: number }
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const scheduleIdle = (callback: () => void, timeout: number) => {
  const idleWindow = window as IdleWindow;

  if (idleWindow.requestIdleCallback) {
    return idleWindow.requestIdleCallback(callback, { timeout });
  }

  return idleWindow.setTimeout(callback, Math.min(timeout, 1000));
};

const cancelIdle = (handle: number) => {
  const idleWindow = window as IdleWindow;

  if (idleWindow.cancelIdleCallback) {
    idleWindow.cancelIdleCallback(handle);
    return;
  }

  idleWindow.clearTimeout(handle);
};

/**
 * Component untuk prefetch images dari route lain saat idle
 * Digunakan untuk smooth navigation antar halaman
 */
export const RoutePrefetch = () => {
  useEffect(() => {
    const idleHandles: number[] = [];

    // Skip route prefetch when strict preload has already loaded all assets.
    if (isInitialPreloadComplete()) {
      return;
    }

    // Skip on very slow connections
    const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
    if (conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g") {
      return;
    }

    const isMobile = window.innerWidth < 768;

    const prefetchImages = () => {
      const galleryData = getGalleryData();
      const projectsData = getProjectsData();

      // Prefetch fewer gallery images on mobile
      const galleryImages = galleryData.items
        .slice(0, isMobile ? 4 : 10)
        .map((item) => item.src);

      // Prefetch remaining project images
      const projectImages = projectsData.projects
        .slice(3)
        .map((project) => project.image);

      // Combine all images to prefetch
      const imagesToPrefetch = [...galleryImages, ...projectImages];

      // Prefetch in batches saat idle
      const prefetchBatch = (images: string[], startIndex: number = 0) => {
        const batchSize = isMobile ? 2 : 3;
        const batch = images.slice(startIndex, startIndex + batchSize);

        if (batch.length === 0) return;

        Promise.all(batch.map((img) => preloadImage(img))).then(() => {
          // Schedule next batch
          if (startIndex + batchSize < images.length) {
            const idleHandle = scheduleIdle(
              () => {
                prefetchBatch(images, startIndex + batchSize);
              },
              5000
            );
            idleHandles.push(idleHandle);
          }
        });
      };

      // Start prefetching saat idle
      const idleHandle = scheduleIdle(
        () => {
          prefetchBatch(imagesToPrefetch);
        },
        10000
      );
      idleHandles.push(idleHandle);
    };

    // Longer delay on mobile to let critical content settle
    const timeoutId = setTimeout(prefetchImages, isMobile ? 5000 : 2000);

    return () => {
      clearTimeout(timeoutId);
      idleHandles.forEach(cancelIdle);
    };
  }, []);

  // Component tidak render apa-apa
  return null;
};
