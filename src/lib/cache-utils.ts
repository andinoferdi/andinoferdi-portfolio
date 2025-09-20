export const clearAllCaches = async (): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    // Clear Service Worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('✅ All caches cleared');
    }

    // Clear localStorage
    localStorage.clear();
    console.log('✅ LocalStorage cleared');

    // Clear sessionStorage
    sessionStorage.clear();
    console.log('✅ SessionStorage cleared');

    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      console.log('✅ Service Workers unregistered');
    }

    // Reload page
    window.location.reload();
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
  }
};

export const clearServiceWorkerCache = async (): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('✅ Service Worker caches cleared');
    }
  } catch (error) {
    console.error('❌ Error clearing Service Worker cache:', error);
  }
};

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const windowWithUtils = window as unknown as Window & {
    clearAllCaches: typeof clearAllCaches;
    clearServiceWorkerCache: typeof clearServiceWorkerCache;
  };
  
  windowWithUtils.clearAllCaches = clearAllCaches;
  windowWithUtils.clearServiceWorkerCache = clearServiceWorkerCache;
  
  console.log('🛠️ Development helpers available:');
  console.log('- window.clearAllCaches() - Clear all caches and reload');
  console.log('- window.clearServiceWorkerCache() - Clear only SW cache');
}
