"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, Scan, MessageCircle, Wallet } from "lucide-react";

export function DesktopNavLinks() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: LayoutDashboard,
      activePattern: /^\/$/,
      hoverClass: "group-hover:scale-110 group-hover:text-emerald-500",
      activeIconClass: "text-emerald-600 scale-105",
    },
    {
      href: "/history",
      label: "Riwayat",
      icon: History,
      activePattern: /^\/history/,
      hoverClass: "group-hover:rotate-[-25deg] group-hover:text-emerald-500",
      activeIconClass: "text-emerald-600 rotate-[-12deg]",
    },
    {
      href: "/scan",
      label: "Scan",
      icon: Scan,
      activePattern: /^\/scan/,
      hoverClass: "group-hover:scale-115 group-hover:text-emerald-500 group-hover:animate-pulse",
      activeIconClass: "text-emerald-600 scale-110 animate-pulse",
    },
    {
      href: "/chat",
      label: "AI Chat",
      icon: MessageCircle,
      activePattern: /^\/chat/,
      hoverClass: "group-hover:translate-y-[-2px] group-hover:text-emerald-500",
      activeIconClass: "text-emerald-600 translate-y-[-1px]",
    },
    {
      href: "/settings",
      label: "Budget",
      icon: Wallet,
      activePattern: /^\/settings/,
      hoverClass: "group-hover:rotate-12 group-hover:scale-105 group-hover:text-emerald-500",
      activeIconClass: "text-emerald-600 rotate-6",
    },
  ];

  return (
    <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 border border-slate-200/40 rounded-2xl p-1 shadow-[0_2px_8px_rgba(0,0,0,0.005)] select-none">
      {navItems.map((item) => {
        const isActive = item.activePattern.test(pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              isActive
                ? "bg-slate-100 text-slate-900 border border-slate-200"
                : "text-slate-500 hover:text-slate-800 border border-transparent hover:bg-slate-50"
            }`}
          >
            <Icon
              className={`w-4 h-4 transition-all duration-300 ${
                isActive ? item.activeIconClass : `text-slate-400 ${item.hoverClass}`
              }`}
            />
            <span>{item.label}</span>

          </Link>
        );
      })}
    </nav>
  );
}
