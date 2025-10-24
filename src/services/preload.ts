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

export const generateNextImageUrl = (
  src: string,
  width: number,
  quality: number = 75
): string => {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  const params = new URLSearchParams({
    url: src,
    w: width.toString(),
    q: quality.toString(),
  });

  return `/_next/image?${params.toString()}`;
};

export const generateNextImageUrls = (
  src: string,
  quality: number = 75
): string[] => {
  const sizes = DEVICE_SIZES;
  return sizes.map(size => generateNextImageUrl(src, size, quality));
};

export const preloadImage = (
  src: string,
  options: { width?: number; quality?: number } = {}
): Promise<void> => {
  const promise = new Promise<void>((resolve) => {
    if (preloadedAssets.has(src)) {
      resolve();
      return;
    }

    const width = options.width || 1920;
    const quality = options.quality || 75;

    const imageUrl = generateNextImageUrl(src, width, quality);

    const img = new Image();
    
    img.onload = () => {
      preloadedAssets.add(src);
      resolve();
    };
    
    img.onerror = () => {
      console.warn(`Failed to preload image: ${src}`);
      resolve();
    };

    img.src = imageUrl;
  });

  return Promise.race([
    promise,
    new Promise<void>((resolve) =>
        setTimeout(() => {
          console.warn(`Image preload timeout: ${src}`);
          resolve();
        }, 15000)
    )
  ]);
};

export const preloadMultipleImageSizes = (
  src: string,
  sizes: number[] = DEVICE_SIZES,
  quality: number = 75
): Promise<void[]> => {
  const promises = sizes.map(size => {
    return new Promise<void>((resolve) => {
      const imageUrl = generateNextImageUrl(src, size, quality);
      const img = new Image();
      
      img.onload = () => resolve();
      img.onerror = () => resolve();
      
      img.src = imageUrl;
    });
  });

  return Promise.all(promises);
};

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
        }, 20000)
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
        const timeoutId = setTimeout(() => controller.abort(), 20000);

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

