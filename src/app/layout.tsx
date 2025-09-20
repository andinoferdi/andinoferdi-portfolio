import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { MainNavbar } from "@/components/Navbar";
import { Spotlight } from "@/components/ui/spotlight-new";
import { ServiceWorkerProvider } from "@/components/providers/ServiceWorkerProvider";
import "@/lib/cache-utils";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Andino Ferdiansah | Developer",
  description: "A modern portfolio showcasing my work and skills",
  keywords: ["portfolio", "developer", "designer", "web development"],
  authors: [{ name: "Andino Ferdiansah" }],
  icons: {
    icon: '/images/Logo.png',
    shortcut: '/images/Logo.png',
    apple: '/images/Logo.png',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} antialiased bg-black/[0.96] relative overflow-x-hidden bg-grid-white/[0.02]`}>
        <ServiceWorkerProvider>
          <ThemeProvider>
            <div className="fixed inset-0 z-0">
              <Spotlight />
            </div>
            <div className="relative z-10">
              <MainNavbar />
              <div className="pt-16">
                {children}
              </div>
            </div>
          </ThemeProvider>
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
