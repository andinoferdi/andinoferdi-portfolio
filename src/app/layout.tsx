"use client";

import { Poppins } from "next/font/google";
import { useState } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TitleProvider } from "@/components/providers/title-provider";
import { DemoNavbar } from "@/components/navbar";
import { DemoFooter } from "@/components/footer";
import { MiniPlayer } from "@/components/mini-player";
import { EnhancedGridBackground } from "@/components/enhanced-grid-background";
import { LoadingScreen } from "@/components/loading-screen";
import ThemeScript from "@/components/ui/theme-script";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <ThemeScript />
      </head>
      <body
        className={`${poppins.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="theme"
          enableColorScheme={false}
        >
          <TitleProvider>
            {!isLoaded && <LoadingScreen onComplete={() => setIsLoaded(true)} />}
            {isLoaded && (
              <div className="relative flex flex-col min-h-screen">
                <EnhancedGridBackground />
                <div className="relative z-10 flex flex-col min-h-screen">
                  <DemoNavbar />
                  <main className="flex-1">
                    {children}
                  </main>
                  <DemoFooter />
                  <MiniPlayer />
                </div>
              </div>
            )}
          </TitleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
