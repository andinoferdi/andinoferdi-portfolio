"use client";

import { useEffect } from "react";
import { preloadImage } from "@/services/preload";
import { getGalleryData } from "@/services/gallery";
import { getProjectsData } from "@/services/projects";

/**
 * Component untuk prefetch images dari route lain saat idle
 * Digunakan untuk smooth navigation antar halaman
 */
export const RoutePrefetch = () => {
  useEffect(() => {
    const prefetchImages = () => {
      const galleryData = getGalleryData();
      const projectsData = getProjectsData();
      
      // Prefetch gallery images (first 10 untuk performance)
      const galleryImages = galleryData.items.slice(0, 10).map(item => item.src);
      
      // Prefetch remaining project images
      const projectImages = projectsData.projects.slice(3).map(project => project.image);
      
      // Combine all images to prefetch
      const imagesToPrefetch = [...galleryImages, ...projectImages];
      
      // Prefetch in batches saat idle
      const prefetchBatch = (images: string[], startIndex: number = 0) => {
        const batchSize = 3;
        const batch = images.slice(startIndex, startIndex + batchSize);
        
        if (batch.length === 0) return;
        
        Promise.all(batch.map(img => preloadImage(img))).then(() => {
          // Schedule next batch
          if (startIndex + batchSize < images.length) {
            requestIdleCallback(() => {
              prefetchBatch(images, startIndex + batchSize);
            }, { timeout: 5000 });
          }
        });
      };
      
      // Start prefetching saat idle
      requestIdleCallback(() => {
        prefetchBatch(imagesToPrefetch);
      }, { timeout: 10000 });
    };

    // Start prefetching setelah 2 detik (setelah critical content loaded)
    const timeoutId = setTimeout(prefetchImages, 2000);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Component tidak render apa-apa
  return null;
};
