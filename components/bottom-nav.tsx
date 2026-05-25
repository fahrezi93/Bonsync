"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, UserRound, MessageCircle, Camera } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-5 left-4 right-4 z-50 mx-auto max-w-md bg-white/80 border border-slate-200/50 rounded-[24px] shadow-[0_15px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl h-16 flex items-center justify-between px-5">
      <Link
        href="/"
        className={`flex flex-col items-center gap-1.5 p-1 transition-all duration-300 relative group ${pathname === "/" ? "text-emerald-600 scale-105" : "text-slate-400 hover:text-slate-600"}`}
      >
        <LayoutDashboard className={`h-[20px] w-[20px] ${pathname === "/" ? "fill-emerald-100/55" : ""}`} strokeWidth={pathname === "/" ? 2.5 : 1.75} />
        <span className="text-[10px] font-medium">Home</span>
        {pathname === "/" && (
          <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
        )}
      </Link>

      <Link
        href="/history"
        className={`flex flex-col items-center gap-1.5 p-1 transition-all duration-300 relative group ${pathname.startsWith("/history") ? "text-emerald-600 scale-105" : "text-slate-400 hover:text-slate-600"}`}
      >
        <History className={`h-[20px] w-[20px]`} strokeWidth={pathname.startsWith("/history") ? 2.5 : 1.75} />
        <span className="text-[10px] font-medium">Riwayat</span>
        {pathname.startsWith("/history") && (
          <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
        )}
      </Link>

      {/* Floating Action Button for SCAN */}
      <div className="relative -top-3.5">
        <Link
          href="/scan"
          className="flex items-center justify-center w-12 h-12 rounded-[18px] bg-emerald-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.35)] active:scale-90 transition-all hover:bg-emerald-500 hover:shadow-[0_8px_25px_rgba(16,185,129,0.45)] group cursor-pointer"
        >
          <Camera className="h-[21px] w-[21px] transition-transform duration-300 group-hover:rotate-6" strokeWidth={2.25} />
        </Link>
      </div>

      <Link
        href="/chat"
        className={`flex flex-col items-center gap-1.5 p-1 transition-all duration-300 relative group ${pathname === "/chat" ? "text-emerald-600 scale-105" : "text-slate-400 hover:text-slate-600"}`}
      >
        <MessageCircle className={`h-[20px] w-[20px] ${pathname === "/chat" ? "fill-emerald-100/55" : ""}`} strokeWidth={pathname === "/chat" ? 2.5 : 1.75} />
        <span className="text-[10px] font-medium">AI Chat</span>
        {pathname === "/chat" && (
          <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
        )}
      </Link>

      <Link
        href="/settings"
        className={`flex flex-col items-center gap-1.5 p-1 transition-all duration-300 relative group ${pathname === "/settings" ? "text-emerald-600 scale-105" : "text-slate-400 hover:text-slate-600"}`}
      >
        <UserRound className={`h-[20px] w-[20px] ${pathname === "/settings" ? "fill-emerald-100/55" : ""}`} strokeWidth={pathname === "/settings" ? 2.5 : 1.75} />
        <span className="text-[10px] font-medium">Profil</span>
        {pathname === "/settings" && (
          <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
        )}
      </Link>
    </nav>
  );
}
