import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TitleProvider } from "@/components/providers/title-provider";
import { DemoNavbar } from "@/components/navbar";
import { DemoFooter } from "@/components/footer";
import { MiniPlayer } from "@/components/mini-player";
import ThemeAwareAurora from "@/components/theme-aware-aurora";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  description: "Andino Ferdiansah | Developer",
  icons: {
    icon: "/images/Logo.png",
    shortcut: "/images/Logo.png",
    apple: "/images/Logo.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const persistedTheme = localStorage.getItem('next-ui-theme');
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  const theme = persistedTheme || 'system';
                  
                  const root = document.documentElement;
                  root.classList.remove('light', 'dark');
                  
                  if (theme === 'system') {
                    root.classList.add(systemTheme);
                    root.style.colorScheme = systemTheme;
                  } else {
                    root.classList.add(theme);
                    root.style.colorScheme = theme;
                  }
                  
                  // Mark theme as loaded to enable transitions
                  setTimeout(() => {
                    root.classList.add('theme-loaded');
                  }, 0);
                } catch (e) {
                  // Fallback to system theme if localStorage is not available
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  document.documentElement.classList.add(systemTheme);
                  document.documentElement.style.colorScheme = systemTheme;
                  
                  setTimeout(() => {
                    document.documentElement.classList.add('theme-loaded');
                  }, 0);
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${poppins.variable} font-sans antialiased`}
      >
        <ThemeProvider
          defaultTheme="system"
          storageKey="next-ui-theme"
        >
          <TitleProvider>
            <div className="relative flex flex-col min-h-screen">
              <div className="fixed inset-0 z-0">
                <ThemeAwareAurora />
              </div>
              <div className="relative z-10 flex flex-col min-h-screen">
                <DemoNavbar />
                <main className="flex-1">
                  {children}
                </main>
                <DemoFooter />
                <MiniPlayer />
              </div>
            </div>
          </TitleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
