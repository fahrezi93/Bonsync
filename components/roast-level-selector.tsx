"use client";

import { useState, useTransition } from "react";
import { setRoastLevel, type RoastLevel } from "@/actions/roast-level-actions";
import { Leaf, Flame, Skull, CheckCircle } from "lucide-react";

interface RoastLevelSelectorProps {
  currentLevel: RoastLevel;
}

const levels: {
  value: RoastLevel;
  label: string;
  description: string;
  emoji: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  borderActive: string;
  bgActive: string;
  bgInactive: string;
  textActive: string;
  textDesc: string;
  glowColor: string;
  badgeStyle: string;
}[] = [
  {
    value: "MILD",
    label: "Sopan",
    description: "Evaluasi ramah & membangun. Cocok buat yang butuh semangat.",
    emoji: "🥦",
    icon: <Leaf className="w-5 h-5" />,
    gradientFrom: "from-emerald-400",
    gradientTo: "to-teal-500",
    borderActive: "border-emerald-300",
    bgActive: "bg-emerald-50",
    bgInactive: "bg-white hover:bg-emerald-50/50",
    textActive: "text-emerald-700",
    textDesc: "text-emerald-600/70",
    glowColor: "shadow-emerald-100",
    badgeStyle: "bg-emerald-100 text-emerald-700",
  },
  {
    value: "MEDIUM",
    label: "Pedas Sedang",
    description: "Sarkastik & gaul. Nusuk tapi masih bisa ketawa.",
    emoji: "🔥",
    icon: <Flame className="w-5 h-5" />,
    gradientFrom: "from-amber-400",
    gradientTo: "to-orange-500",
    borderActive: "border-amber-300",
    bgActive: "bg-amber-50",
    bgInactive: "bg-white hover:bg-amber-50/50",
    textActive: "text-amber-700",
    textDesc: "text-amber-600/70",
    glowColor: "shadow-amber-100",
    badgeStyle: "bg-amber-100 text-amber-700",
  },
  {
    value: "NUCLEAR",
    label: "Nuklir",
    description: "Blak-blakan total. Tidak ada ampun, tidak ada basa-basi.",
    emoji: "💀",
    icon: <Skull className="w-5 h-5" />,
    gradientFrom: "from-rose-500",
    gradientTo: "to-red-700",
    borderActive: "border-rose-400",
    bgActive: "bg-rose-50",
    bgInactive: "bg-white hover:bg-rose-50/50",
    textActive: "text-rose-700",
    textDesc: "text-rose-600/70",
    glowColor: "shadow-rose-100",
    badgeStyle: "bg-rose-100 text-rose-700",
  },
];

export function RoastLevelSelector({ currentLevel }: RoastLevelSelectorProps) {
  const [selected, setSelected] = useState<RoastLevel>(currentLevel);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null);

  function handleSelect(level: RoastLevel) {
    if (level === selected || isPending) return;

    setSelected(level);
    startTransition(async () => {
      const result = await setRoastLevel(level);
      setToast(result);
      setTimeout(() => setToast(null), 3000);
    });
  }

  return (
    <div className="w-full premium-card p-6 md:p-8 relative overflow-hidden transition-all duration-300">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-1">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">
          Level Roasting AI
        </h2>
        <p className="text-sm font-medium text-slate-500">
          Pilih seberapa blak-blakan AI akan menegur gaya hidup Anda.
        </p>
      </div>

      {/* Level Cards */}
      <div className="flex flex-col gap-3.5">
        {levels.map((lvl) => {
          const isActive = selected === lvl.value;
          return (
            <button
              key={lvl.value}
              id={`roast-level-${lvl.value.toLowerCase()}`}
              onClick={() => handleSelect(lvl.value)}
              disabled={isPending}
              className={`
                w-full text-left rounded-2xl border p-4 transition-all duration-300 cursor-pointer
                ${isActive
                  ? `${lvl.borderActive} ${lvl.bgActive} shadow-sm border-2 ring-4 ring-white/50 ring-inset`
                  : `border-slate-200 ${lvl.bgInactive} shadow-none`
                }
                ${isPending ? "opacity-60 cursor-not-allowed" : "active:scale-95"}
              `}
            >
              <div className="flex items-center gap-3.5">
                {/* Icon gradient bubble */}
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-lg text-white shrink-0
                    bg-gradient-to-br ${lvl.gradientFrom} ${lvl.gradientTo}
                    shadow-sm
                    transition-all duration-300
                    ${isActive ? "scale-105" : "opacity-70"}
                  `}
                >
                  {lvl.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`text-sm font-bold transition-colors ${
                        isActive ? lvl.textActive : "text-slate-700"
                      }`}
                    >
                      {lvl.emoji} {lvl.label}
                    </span>
                    {isActive && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lvl.badgeStyle}`}
                      >
                        Aktif
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs font-medium leading-snug transition-colors ${
                      isActive ? lvl.textDesc : "text-slate-400"
                    }`}
                  >
                    {lvl.description}
                  </p>
                </div>

                {/* Checkmark */}
                {isActive && (
                  <CheckCircle
                    className={`w-5 h-5 shrink-0 ${lvl.textActive}`}
                    strokeWidth={2.5}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`
            mt-4 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-medium
            transition-all duration-300 animate-fade-in-up
            ${toast.success
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-rose-50 border border-rose-200 text-rose-700"
            }
          `}
        >
          <span>{toast.success ? "✅" : "❌"}</span>
          {toast.message}
        </div>
      )}

      {/* Pending indicator */}
      {isPending && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-[32px] flex items-center justify-center">
          <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500">
            <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
            Menyimpan...
          </div>
        </div>
      )}
    </div>
  );
}
