"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { IconTrash, IconRefresh, IconDatabase, IconX } from '@tabler/icons-react';
import { useCacheStatus } from '@/hooks/use-cache-status';
import { NavbarButton } from '@/components/ui/resizable-navbar';

export const CacheManager = () => {
  const [isOpen, setIsOpen] = useState(false);
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

  // Handle modal close
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handle clear actions
  const handleClearAll = useCallback(async () => {
    if (confirm('Are you sure you want to clear all caches? This will reload the page.')) {
      await clearAllCache();
      handleClose();
    }
  }, [clearAllCache, handleClose]);

  const handleClearSW = useCallback(async () => {
    if (confirm('Are you sure you want to clear Service Worker cache?')) {
      await clearSWCache();
    }
  }, [clearSWCache]);

  // Lock/unlock body scroll with proper cleanup
  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Apply styles to prevent scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      document.body.style.width = '100vw';
      
      // Prevent iOS bounce
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.position = 'fixed';
      document.documentElement.style.width = '100%';
      document.documentElement.style.height = '100%';

      return () => {
        // Restore body styles
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        document.body.style.width = '';
        
        // Restore html styles
        document.documentElement.style.overflow = '';
        document.documentElement.style.position = '';
        document.documentElement.style.width = '';
        document.documentElement.style.height = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleClose]);

  // Cache Manager is now always visible for debugging purposes

  return (
    <>
      {/* Trigger Button */}
      <div className="relative">
        <NavbarButton
          onClick={() => setIsOpen(true)}
          variant="secondary"
          ariaLabel="Cache Manager"
          className="border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 flex items-center justify-center gap-2"
        >
          <IconDatabase size={20} aria-hidden="true" />
          <span className="hidden sm:inline">
            {isLoading ? '...' : formatBytes(totalSize)}
          </span>
        </NavbarButton>
      </div>

      {/* Modal Portal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
          }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          />
          
          {/* Modal Content */}
          <div
            className="relative z-10 w-[min(90vw,400px)] max-h-[80vh] overflow-hidden bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 m-4"
            style={{
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Cache Manager</h3>
              <button
                onClick={handleClose}
                className="text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                aria-label="Close cache manager"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
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
          </div>
        </div>
      )}
    </>
  );
};
