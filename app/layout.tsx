import type { Metadata, Viewport } from "next";
import { Inter, DM_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { ConditionalNavWrapper } from "@/components/conditional-nav-wrapper";
import { MainLayoutWrapper } from "@/components/main-layout-wrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BonSync — Expense Tracker dengan AI",
  description:
    "Catat pengeluaran, split bill, dan dapatkan roasting dari AI tentang kebiasaan belanjamu.",
  keywords: ["expense tracker", "split bill", "AI", "keuangan", "BonSync"],
  manifest: "/manifest.webmanifest",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${dmMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="antialiased font-sans bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white"
        suppressHydrationWarning
      >
        <ConditionalNavWrapper>
          <Nav />
        </ConditionalNavWrapper>
        <MainLayoutWrapper>
          {children}
        </MainLayoutWrapper>
      </body>
    </html>
  );
}
