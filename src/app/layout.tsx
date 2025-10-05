import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TitleProvider } from "@/components/providers/title-provider";
import { DemoNavbar } from "@/components/navbar";
import { DemoFooter } from "@/components/footer";
import { MiniPlayer } from "@/components/mini-player";
import { EnhancedGridBackground } from "@/components/enhanced-grid-background";
import ThemeScript from "@/components/ui/theme-script";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  description: "Andino Ferdiansah | Developer",
  icons: {
    icon: "/src/app/favicon.ico",
    shortcut: "/src/app/favicon.ico",
    apple: "/src/app/favicon.ico",
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
            </TitleProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
