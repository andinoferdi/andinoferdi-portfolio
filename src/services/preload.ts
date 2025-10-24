export interface PreloadImageOptions {
  src: string;
  width?: number;
  quality?: number;
}

export interface PreloadAudioOptions {
  crossOrigin?: boolean;
}

export const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
export const IMAGE_SIZES = [16, 32, 48, 64, 96, 128, 256, 384];

const preloadedAssets = new Set<string>();

// Deprecated: These functions are no longer used for preloading
// Next.js Image Optimization API should only be used for rendering, not preloading

export const preloadImage = (
  src: string
): Promise<void> => {
  const promise = new Promise<void>((resolve) => {
    if (preloadedAssets.has(src)) {
      resolve();
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      preloadedAssets.add(src);
      resolve();
    };
    
    img.onerror = () => {
      preloadedAssets.add(src);
      resolve();
    };

    img.src = src;
  });

  return Promise.race([
    promise,
    new Promise<void>((resolve) =>
        setTimeout(() => {
          preloadedAssets.add(src);
          resolve();
        }, 30000)
    )
  ]);
};

export const preloadImagesBatch = async (
  images: string[],
  batchSize: number = 5
): Promise<void> => {
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    await Promise.all(batch.map(img => preloadImage(img)));
  }
};

// Audio preload should only be used for specific use cases like autoplay
// For user-initiated playback, lazy loading is more appropriate
export const preloadAudio = (
  src: string,
  options: PreloadAudioOptions = {}
): Promise<void> => {
  const promise = new Promise<void>((resolve) => {
    if (preloadedAssets.has(src)) {
      resolve();
      return;
    }

    const audio = new Audio();
    
    audio.preload = 'metadata';
    
    if (options.crossOrigin) {
      audio.crossOrigin = 'anonymous';
    }

    const handleLoad = () => {
      preloadedAssets.add(src);
      cleanup();
      resolve();
    };

    const handleError = () => {
      console.warn(`Failed to preload audio: ${src}`);
      cleanup();
      resolve();
    };

    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', handleLoad);
      audio.removeEventListener('error', handleError);
      audio.src = '';
      audio.load();
    };

    audio.addEventListener('loadedmetadata', handleLoad, { once: true });
    audio.addEventListener('error', handleError, { once: true });
    
    audio.src = src;
    audio.load();
  });

  return Promise.race([
    promise,
    new Promise<void>((resolve) =>
        setTimeout(() => {
          console.warn(`Audio preload timeout: ${src}`);
          resolve();
        }, 30000)
    )
  ]);
};

export const preloadDocument = (url: string): Promise<void> => {
  return new Promise((resolve) => {
    if (preloadedAssets.has(url)) {
      resolve();
      return;
    }

    const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

    fetch(url, { 
      method: 'GET',
      cache: 'force-cache',
      signal: controller.signal
    })
      .then((response) => {
        clearTimeout(timeoutId);
        if (response.ok) {
          preloadedAssets.add(url);
        }
        resolve();
      })
      .catch(() => {
        clearTimeout(timeoutId);
        console.warn(`Failed to preload document: ${url}`);
        resolve();
      });
  });
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

