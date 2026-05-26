"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import type { RoastLevel, RoastPersona } from "@/lib/roasting";
import { ShareRoastButton } from "@/components/share-roast-button";

interface RoastingCardProps {
  advice: string;
  level?: RoastLevel;
  persona?: RoastPersona;
  /** Survival score 0-100 */
  survivalScore?: number;
  /** Sisa rupiah dari budget */
  remaining?: number;
  /** Total budget bulan ini */
  budgetLimit?: number;
  /** Bulan dalam format "Mei 2026" misal */
  monthLabel?: string;
  /** Display name user (opsional) */
  displayName?: string;
}

const levelConfig: Record<
  RoastLevel,
  { label: string; textStyle: string; indicatorStyle: string }
> = {
  MILD: {
    label: "Sopan",
    textStyle: "text-emerald-700",
    indicatorStyle: "bg-emerald-500",
  },
  MEDIUM: {
    label: "Pedas",
    textStyle: "text-amber-700",
    indicatorStyle: "bg-amber-500",
  },
  NUCLEAR: {
    label: "Kritis",
    textStyle: "text-rose-700",
    indicatorStyle: "bg-rose-500",
  },
};

const personaLabel: Record<RoastPersona, { emoji: string; label: string }> = {
  DEFAULT: { emoji: "✨", label: "Default" },
  MAMA: { emoji: "🧕", label: "Mama" },
  SULTAN: { emoji: "💸", label: "Sultan" },
  TETANGGA: { emoji: "🏘️", label: "Tetangga" },
  DOSEN: { emoji: "👨‍🏫", label: "Dosen" },
};

function parseMarkdown(text: string): React.ReactNode {
  if (!text) return "";

  const regex = /(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return (
        <strong key={index} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return (
        <em key={index} className="italic font-medium text-slate-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-rose-600 font-mono text-[12px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function RoastingCard({
  advice,
  level = "MEDIUM",
  persona = "DEFAULT",
  survivalScore,
  remaining,
  budgetLimit,
  monthLabel,
  displayName,
}: RoastingCardProps) {
  const [displayedText, setDisplayedText] = useState("");
  const cfg = levelConfig[level];
  const personaCfg = personaLabel[persona];

  // Tampilkan tombol Share kalau data lengkap
  const canShare =
    typeof survivalScore === "number" &&
    typeof remaining === "number" &&
    typeof budgetLimit === "number" &&
    typeof monthLabel === "string";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(advice.substring(0, i + 1));
      i++;
      if (i >= advice.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [advice]);

  return (
    <div className="premium-card p-5 md:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 border border-slate-200">
            <Sparkles className="h-4 w-4 text-slate-500" />
          </div>
          <span className="text-sm font-bold text-slate-700">Evaluasi AI</span>
          {persona !== "DEFAULT" && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600">
              <span>{personaCfg.emoji}</span>
              {personaCfg.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
            <div className={`h-2 w-2 rounded-full ${cfg.indicatorStyle} animate-pulse`} />
            <span className={`text-xs font-bold ${cfg.textStyle}`}>
              Level: {cfg.label}
            </span>
          </div>
          {canShare && advice && (
            <ShareRoastButton
              advice={advice}
              level={level}
              persona={persona}
              survivalScore={survivalScore!}
              remaining={remaining!}
              budgetLimit={budgetLimit!}
              monthLabel={monthLabel!}
              displayName={displayName}
            />
          )}
        </div>
      </div>

      <div className="text-[13px] font-medium leading-relaxed text-slate-700 min-h-[80px] whitespace-pre-line bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
        {parseMarkdown(displayedText)}
        <span className="inline-block w-1.5 h-4 bg-slate-400 rounded-sm animate-pulse ml-1 align-middle" />
      </div>
    </div>
  );
}
