"use client";

import { useEffect, useState, useCallback } from 'react';
import { clearAllCaches, clearServiceWorkerCache } from '@/lib/cache-utils';

interface CacheStatus {
  totalSize: number;
  cacheCount: number;
  isLoading: boolean;
  error: string | null;
}

export const useCacheStatus = () => {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    totalSize: 0,
    cacheCount: 0,
    isLoading: true,
    error: null,
  });

  const calculateCacheSize = useCallback(async (): Promise<CacheStatus> => {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return {
        totalSize: 0,
        cacheCount: 0,
        isLoading: false,
        error: 'Cache API not supported',
      };
    }

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      let totalCount = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
            totalCount++;
          }
        }
      }

      return {
        totalSize,
        cacheCount: totalCount,
        isLoading: false,
        error: null,
      };
    } catch (error) {
      return {
        totalSize: 0,
        cacheCount: 0,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, []);

  const refreshCacheStatus = useCallback(async () => {
    setCacheStatus(prev => ({ ...prev, isLoading: true }));
    const status = await calculateCacheSize();
    setCacheStatus(status);
  }, [calculateCacheSize]);

  const clearAllCache = useCallback(async () => {
    try {
      await clearAllCaches();
      await refreshCacheStatus();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, [refreshCacheStatus]);

  const clearSWCache = useCallback(async () => {
    try {
      await clearServiceWorkerCache();
      await refreshCacheStatus();
    } catch (error) {
      console.error('Failed to clear SW cache:', error);
    }
  }, [refreshCacheStatus]);

  useEffect(() => {
    refreshCacheStatus();
  }, [refreshCacheStatus]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return {
    ...cacheStatus,
    refreshCacheStatus,
    clearAllCache,
    clearSWCache,
    formatBytes,
  };
};

