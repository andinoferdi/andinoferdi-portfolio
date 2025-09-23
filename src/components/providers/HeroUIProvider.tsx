'use client';

import { HeroUIProvider as NextHeroUIProvider } from '@heroui/react';

export function HeroUIProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextHeroUIProvider>
      {children}
    </NextHeroUIProvider>
  );
}
