"use client";

import { useState, useTransition } from "react";
import { setRoastLevel, type RoastLevel } from "@/actions/roast-level-actions";
import { Leaf, Flame, Skull } from "lucide-react";

interface RoastLevelSelectorProps {
  currentLevel: RoastLevel;
}

const levels: {
  value: RoastLevel;
  label: string;
  description: string;
  emoji: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "MILD",
    label: "Sopan",
    description: "Evaluasi ramah & membangun. Cocok buat yang butuh semangat.",
    emoji: "🥦",
    icon: <Leaf className="w-5 h-5" />,
  },
  {
    value: "MEDIUM",
    label: "Pedas Sedang",
    description: "Sarkastik & gaul. Nusuk tapi masih bisa ketawa.",
    emoji: "🔥",
    icon: <Flame className="w-5 h-5" />,
  },
  {
    value: "NUCLEAR",
    label: "Nuklir",
    description: "Blak-blakan total. Tidak ada ampun, tidak ada basa-basi.",
    emoji: "💀",
    icon: <Skull className="w-5 h-5" />,
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
      <div className="mb-8 flex flex-col gap-2">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
          Level Roasting AI
        </h2>
        <p className="text-sm text-slate-500">
          Pilih seberapa blak-blakan AI akan menegur gaya hidup Anda.
        </p>
      </div>

      {/* Level Cards */}
      <div className="grid grid-cols-1 gap-4">
        {levels.map((lvl) => {
          const isActive = selected === lvl.value;
          return (
            <button
              key={lvl.value}
              id={`roast-level-${lvl.value.toLowerCase()}`}
              onClick={() => handleSelect(lvl.value)}
              disabled={isPending}
              className={`
                group w-full text-left rounded-2xl p-5 transition-all duration-300 cursor-pointer border
                ${isActive
                  ? "border-slate-900 bg-white ring-1 ring-slate-900 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                }
                ${isPending ? "opacity-60 cursor-not-allowed" : "active:scale-[0.99]"}
              `}
            >
              <div className="flex items-start gap-4 md:gap-5">
                {/* Icon */}
                <div
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 text-white transition-all
                    ${isActive ? "bg-slate-900 scale-105" : "bg-slate-800 opacity-90 group-hover:opacity-100 group-hover:scale-105"}
                  `}
                >
                  {lvl.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-base font-semibold ${
                          isActive ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900"
                        }`}
                      >
                        {lvl.emoji} {lvl.label}
                      </span>
                      {isActive && (
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-900 text-white"
                        >
                          Aktif
                        </span>
                      )}
                    </div>
                    {/* Checkmark */}
                    <div className={`
                      w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0
                      ${isActive ? "border-slate-900 bg-slate-900" : "border-slate-300 group-hover:border-slate-400"}
                    `}>
                      {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p
                    className="text-sm text-slate-500 leading-snug"
                  >
                    {lvl.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`
            mt-5 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium
            transition-all duration-300 animate-fade-in-up
            ${toast.success
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
            }
          `}
        >
          <span>{toast.success ? "✅" : "❌"}</span>
          {toast.message}
        </div>
      )}

      {/* Pending indicator */}
      {isPending && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] rounded-[24px] flex items-center justify-center z-10">
          <div className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200 text-sm font-medium text-slate-600">
            <span className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin" />
            Menyimpan...
          </div>
        </div>
      )}
    </div>
  );
}
