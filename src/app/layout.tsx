import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import PortfolioNavbar from "@/components/Navbar";
import { Spotlight } from "@/components/ui/spotlight-main-background";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Portfolio | Your Name",
  description: "A modern portfolio showcasing my work and skills",
  keywords: ["portfolio", "developer", "designer", "web development"],
  authors: [{ name: "Your Name" }],
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
      <body className={`${poppins.variable} antialiased bg-background relative overflow-x-hidden`}>
        <ThemeProvider>
          <div className="fixed inset-0 z-0">
            <Spotlight 
              gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 85%, .08) 0, hsla(210, 100%, 55%, .02) 50%, hsla(210, 100%, 45%, 0) 80%)"
              gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .06) 0, hsla(210, 100%, 55%, .02) 80%, transparent 100%)"
              gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .04) 0, hsla(210, 100%, 45%, .02) 80%, transparent 100%)"
            />
          </div>
          <div className="relative z-10">
            <PortfolioNavbar />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
