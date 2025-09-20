'use client';

import { useServiceWorker } from '@/hooks/use-service-worker';

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

export const ServiceWorkerProvider = ({ children }: ServiceWorkerProviderProps) => {
  useServiceWorker();
  
  return <>{children}</>;
};
