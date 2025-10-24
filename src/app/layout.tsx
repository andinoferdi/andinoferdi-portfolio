"use client";

import { Poppins } from "next/font/google";
import { useState } from "react";
import "./globals.css";
import "aos/dist/aos.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TitleProvider } from "@/components/providers/title-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { DemoNavbar } from "@/components/navbar";
import { DemoFooter } from "@/components/footer";
import { MiniPlayer } from "@/components/mini-player";
import { MusicPlayerErrorBoundary } from "@/components/error-boundary";
import { LoadingScreen } from "@/components/loading-screen";
import ThemeScript from "@/components/ui/theme-script";
import { Spotlight } from "@/components/ui/spotlight-new";

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
        <ThemeScript />
        <link rel="preload" href="/images/self/1.jpg" as="image" type="image/jpeg" />
        <link rel="preload" href="/images/self/2.jpg" as="image" type="image/jpeg" />
        <link rel="preload" href="/images/self/3.jpg" as="image" type="image/jpeg" />
        <link rel="preload" href="/images/self/4.jpg" as="image" type="image/jpeg" />
        <link rel="dns-prefetch" href="https://openrouter.ai" />
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
          <ToastProvider />
          <TitleProvider>
            {!isLoaded && <LoadingScreen onComplete={() => setIsLoaded(true)} />}
            {isLoaded && (
              <div className="relative flex flex-col min-h-screen">
                <div className="fixed inset-0 z-0">
                  <div className="absolute inset-0 opacity-60 dark:opacity-40 [background-size:40px_40px] [background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]" />
                  <Spotlight
                    gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 85%, .12) 0, hsla(210, 100%, 55%, .06) 50%, hsla(210, 100%, 45%, 0) 80%)"
                    gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .08) 0, hsla(210, 100%, 55%, .04) 80%, transparent 100%)"
                    gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .06) 0, hsla(210, 100%, 45%, .03) 80%, transparent 100%)"
                    translateY={-350}
                    width={560}
                    height={1380}
                    smallWidth={240}
                    duration={7}
                    xOffset={100}
                  />
                </div>
                <div className="relative z-10 flex flex-col min-h-screen">
                  <DemoNavbar />
                  <main className="flex-1">
                    {children}
                  </main>
                  <DemoFooter />
                  <MusicPlayerErrorBoundary>
                    <MiniPlayer />
                  </MusicPlayerErrorBoundary>
                </div>
              </div>
            )}
          </TitleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
