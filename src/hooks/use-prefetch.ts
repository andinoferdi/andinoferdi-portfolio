import { useEffect } from 'react';

interface PrefetchOptions {
  delay?: number;
  priority?: 'high' | 'low';
  as?: 'document' | 'image' | 'script' | 'style';
}

export const usePrefetch = (href: string, options: PrefetchOptions = {}) => {
  const { delay = 0, priority = 'low', as = 'document' } = options;

  useEffect(() => {
    if (!href || typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      const existingLink = document.querySelector(`link[href="${href}"]`);
      if (existingLink) return;

      const prefetchLink = document.createElement('link');
      prefetchLink.rel = 'prefetch';
      prefetchLink.href = href;
      prefetchLink.as = as;
      if (priority === 'high') {
        prefetchLink.setAttribute('importance', 'high');
      }
      
      document.head.appendChild(prefetchLink);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [href, delay, priority, as]);
};

export const usePreloadImages = (imageUrls: string[], delay: number = 100) => {
  useEffect(() => {
    if (!imageUrls.length || typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      imageUrls.forEach(url => {
        const existingLink = document.querySelector(`link[href="${url}"]`);
        if (existingLink) return;

        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.href = url;
        preloadLink.as = 'image';
        document.head.appendChild(preloadLink);
      });
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [imageUrls, delay]);
};

export const usePrefetchOnHover = () => {
  const prefetchOnHover = (href: string) => {
    if (!href || typeof window === 'undefined') return;

    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) return;

    const prefetchLink = document.createElement('link');
    prefetchLink.rel = 'prefetch';
    prefetchLink.href = href;
    document.head.appendChild(prefetchLink);
  };

  return { prefetchOnHover };
};
