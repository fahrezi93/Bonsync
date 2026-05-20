"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, Wallet, MessageCircle, Camera } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 w-full z-50 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 pb-safe">
      <div className="mx-auto max-w-md px-6 h-16 flex items-center justify-between">

        <Link
          href="/"
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname === "/" ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          <LayoutDashboard className={`h-[22px] w-[22px] ${pathname === "/" ? "fill-emerald-100/50" : ""}`} strokeWidth={pathname === "/" ? 2.5 : 1.5} />
          <span className="text-[10px] font-semibold tracking-wide">Home</span>
        </Link>

        <Link
          href="/history"
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname.startsWith("/history") ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          <History className={`h-[22px] w-[22px]`} strokeWidth={pathname.startsWith("/history") ? 2.5 : 1.5} />
          <span className="text-[10px] font-semibold tracking-wide">Riwayat</span>
        </Link>

        {/* Floating Action Button for SCAN */}
        <div className="relative -top-3">
          <Link
            href="/scan"
            className="flex items-center justify-center w-12 h-12 rounded-[18px] bg-slate-900 text-white shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
          >
            <Camera className="h-[22px] w-[22px]" strokeWidth={2} />
          </Link>
        </div>

        <Link
          href="/chat"
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname === "/chat" ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          <MessageCircle className={`h-[22px] w-[22px] ${pathname === "/chat" ? "fill-emerald-100/50" : ""}`} strokeWidth={pathname === "/chat" ? 2.5 : 1.5} />
          <span className="text-[10px] font-semibold tracking-wide">AI Chat</span>
        </Link>

        <Link
          href="/settings"
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname === "/settings" ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          <Wallet className={`h-[22px] w-[22px] ${pathname === "/settings" ? "fill-emerald-100/50" : ""}`} strokeWidth={pathname === "/settings" ? 2.5 : 1.5} />
          <span className="text-[10px] font-semibold tracking-wide">Budget</span>
        </Link>

      </div>
    </nav>
  );
}
