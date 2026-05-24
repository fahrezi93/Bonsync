"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogOut, ChevronDown, Wallet, History, Shield, AlertTriangle, Skull } from "lucide-react";
import { signOut } from "@/actions/auth-actions";

interface ProfileDropdownProps {
  userEmail: string;
  displayName: string;
  avatarUrl: string | null;
  budgetLimit: number;
  spent: number;
  remaining: number;
  survivalScore: number;
}

export function ProfileDropdown({
  userEmail,
  displayName,
  avatarUrl,
  budgetLimit,
  spent,
  remaining,
  survivalScore,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const username = displayName || userEmail.split("@")[0];
  const initial = (username || userEmail || "B")[0].toUpperCase();

  // Format rupiah helper
  const idr = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Dynamic Survival level config
  let survivalLabel = "Status: 🛡️ AMAN BUNG!";
  let survivalColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  let progressFill = "bg-emerald-500";
  let StatusIcon = Shield;

  if (survivalScore < 30) {
    survivalLabel = "Status: 💀 RUNGKAD PARAH!";
    survivalColor = "text-rose-500 bg-rose-500/10 border-rose-500/20";
    progressFill = "bg-rose-500";
    StatusIcon = Skull;
  } else if (survivalScore < 70) {
    survivalLabel = "Status: ⚠️ REM DIKIT BOS!";
    survivalColor = "text-amber-600 bg-amber-500/10 border-amber-500/20";
    progressFill = "bg-amber-500";
    StatusIcon = AlertTriangle;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 p-1 rounded-2xl border transition-all duration-300 select-none cursor-pointer ${
          isOpen
            ? "bg-slate-100 border-slate-300/60 shadow-sm"
            : "bg-slate-100/50 border-slate-200/40 hover:bg-slate-100/80 shadow-[0_2px_8px_rgba(0,0,0,0.005)]"
        }`}
      >
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="size-6 rounded-lg object-cover shadow-sm"
            />
          ) : (
            <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {initial}
            </div>
          )}
          <span className="hidden sm:block text-sm font-semibold text-slate-700 truncate max-w-[100px]">
            {username}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 mr-1.5 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-emerald-500" : ""
          }`}
          strokeWidth={2.5}
        />
      </button>

      {/* Floating Card Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-76 md:w-80 bg-white/95 backdrop-blur-2xl border border-slate-200/60 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.12)] z-50 animate-fade-in-up">
          {/* Header Profile */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="size-12 rounded-xl object-cover shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-lg font-bold text-white shadow-sm">
                {initial}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-800 truncate">
                {username}
              </span>
              <span className="text-[10px] font-medium text-slate-400 truncate">
                {userEmail}
              </span>
            </div>
          </div>

          {/* Survival Score Box */}
          <div className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">
                Survival Score
              </span>
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${survivalColor}`}>
                <StatusIcon className="w-3 h-3" />
                {survivalLabel.split(": ")[1]}
              </span>
            </div>
            
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 shadow-inner">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xl font-bold text-slate-800">
                  {Math.round(survivalScore)} <span className="text-xs text-slate-500 font-medium">hp</span>
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {remaining > 0 ? "Sisa Aman" : "Habis Total"}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressFill}`}
                  style={{ width: `${Math.min(100, Math.max(0, survivalScore))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>{idr(spent)} terpakai</span>
                <span>{idr(budgetLimit)} limit</span>
              </div>
            </div>
          </div>

          {/* Navigation Shortcuts */}
          <div className="flex flex-col gap-1 border-t border-b border-slate-100 py-3 mb-4">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-400" />
                <span>Pengaturan Akun</span>
              </div>
            </Link>

            <Link
              href="/history"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <span>Riwayat Transaksi</span>
              </div>
            </Link>
          </div>

          {/* Logout Action Button */}
          <form action={signOut} className="w-full">
            <button
              type="submit"
              className="group flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 shadow-sm active:scale-95 transition-all duration-300 font-medium text-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
              <span>Keluar dari Akun</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
