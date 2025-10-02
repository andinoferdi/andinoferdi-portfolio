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
                  const theme = localStorage.getItem('theme') || 'system';
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  const finalTheme = theme === 'system' ? systemTheme : theme;
                  
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(finalTheme);
                  document.documentElement.style.colorScheme = finalTheme;
                } catch (e) {
                  console.warn('Theme initialization failed:', e);
                }
              })();
            `,
          }}
        />
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
