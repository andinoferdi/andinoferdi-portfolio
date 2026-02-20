"use client";

import { getFooterConfig } from "@/stores/footer-menu";

export const MainFooter = () => {
  const footerConfig = getFooterConfig();

  return (
    <footer className="relative z-40 w-full">
      <div className="relative z-60 mx-auto w-full max-w-7xl bg-transparent px-4 py-8 dark:bg-transparent">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            {footerConfig.copyright}
          </p>
          <p className="max-w-3xl text-xs text-muted-foreground/90">
            {footerConfig.privacyNotice}
          </p>
        </div>
      </div>
    </footer>
  );
};
