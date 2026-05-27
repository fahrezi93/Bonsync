import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { ConditionalNavWrapper } from "@/components/conditional-nav-wrapper";
import { MainLayoutWrapper } from "@/components/main-layout-wrapper";
import { getCurrentUserId } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BonSync — Expense Tracker dengan AI",
  description:
    "Catat pengeluaran, split bill, dan dapatkan roasting dari AI tentang kebiasaan belanjamu.",
  keywords: ["expense tracker", "split bill", "AI", "keuangan", "BonSync"],
  icons: {
    icon: [
      { url: "/Bonsyncicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/Bonsyncicon.png", type: "image/png" },
    ],
    shortcut: "/Bonsyncicon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BonSync",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10b981",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getCurrentUserId();
  const isAuthenticated = !!userId;

  return (
    <html
      lang="id"
      className={`${inter.variable}`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body
        className="antialiased font-sans bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white"
        suppressHydrationWarning
      >
        <ConditionalNavWrapper isAuthenticated={isAuthenticated}>
          <Nav />
        </ConditionalNavWrapper>
        <MainLayoutWrapper isAuthenticated={isAuthenticated}>
          {children}
        </MainLayoutWrapper>
      </body>
    </html>
  );
}

