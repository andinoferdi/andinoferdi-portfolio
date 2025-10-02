import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TitleProvider } from "@/components/providers/title-provider";
import { DemoNavbar } from "@/components/navbar";
import { DemoFooter } from "@/components/footer";
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
                function getInitialTheme() {
                  const persistedTheme = window.localStorage.getItem('next-ui-theme');
                  const hasPersistedTheme = typeof persistedTheme === 'string';
                  
                  if (hasPersistedTheme) {
                    return persistedTheme;
                  }
                  
                  const mql = window.matchMedia('(prefers-color-scheme: dark)');
                  const hasMediaQueryPreference = typeof mql.matches === 'boolean';
                  
                  if (hasMediaQueryPreference) {
                    return mql.matches ? 'dark' : 'light';
                  }
                  
                  return 'dark';
                }
                
                const theme = getInitialTheme();
                const root = document.documentElement;
                root.classList.remove('light', 'dark');
                root.classList.add(theme);
                root.style.colorScheme = theme;
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${poppins.variable} font-sans antialiased`}
      >
        <ThemeProvider
          defaultTheme="dark"
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
              </div>
            </div>
          </TitleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
