"use client";

import React from 'react';
import { IconTrash, IconRefresh, IconDatabase, IconX } from '@tabler/icons-react';
import { useCacheStatus } from '@/hooks/use-cache-status';

export const CacheManager = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (open: boolean) => void }) => {
  const { 
    totalSize, 
    cacheCount, 
    isLoading, 
    error, 
    clearAllCache, 
    clearSWCache, 
    formatBytes,
    refreshCacheStatus 
  } = useCacheStatus();

  const PanelContent = () => (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Cache Manager</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
          aria-label="Close cache manager"
        >
          <IconX className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-5">
        {/* Cache Status */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <IconDatabase className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm font-semibold text-white">Cache Status</span>
          </div>
          {isLoading ? (
            <div className="text-sm text-neutral-400 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              Loading...
            </div>
          ) : error ? (
            <div className="text-sm text-red-400 bg-red-500/10 rounded-lg p-2 border border-red-500/20">
              {error}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-300">Size:</span>
                <span className="text-sm font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">
                  {formatBytes(totalSize)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-300">Files:</span>
                <span className="text-sm font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">
                  {cacheCount}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={refreshCacheStatus}
            disabled={isLoading}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-blue-500/25 disabled:shadow-none"
          >
            <IconRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>

          <button
            onClick={handleClearSW}
            disabled={isLoading}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-orange-500/25 disabled:shadow-none"
          >
            <IconTrash className="w-4 h-4" />
            Clear SW Cache
          </button>

          <button
            onClick={handleClearAll}
            disabled={isLoading}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-red-500/25 disabled:shadow-none"
          >
            <IconTrash className="w-4 h-4" />
            Clear All Caches
          </button>
        </div>
      </div>
    </div>
  );

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all caches? This will reload the page.')) {
      await clearAllCache();
    }
  };

  const handleClearSW = async () => {
    if (confirm('Are you sure you want to clear Service Worker cache?')) {
      await clearSWCache();
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <>
      {isOpen && (
        <>
          {/* Mobile: centered modal with backdrop */}
          <div className="fixed inset-0 z-50 sm:hidden flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
              aria-label="Close overlay"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
            />
            <div className="relative w-[min(92vw,22rem)] max-h-[70vh] overflow-y-auto bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 -translate-y-2">
              <PanelContent />
            </div>
          </div>

          {/* Desktop: dropdown from trigger */}
          <div className="absolute right-0 top-full mt-2 hidden sm:block w-80 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
            <PanelContent />
          </div>
        </>
      )}
    </>
  );
};
