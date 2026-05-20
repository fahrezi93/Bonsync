"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

const CATEGORIES = ["FOOD", "TRANSPORT", "LIFESTYLE", "HEALTH", "ENTERTAINMENT", "OTHERS"] as const;

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "🍜 Makan",
  TRANSPORT: "🚗 Transport",
  LIFESTYLE: "🛍 Lifestyle",
  HEALTH: "💊 Kesehatan",
  ENTERTAINMENT: "🎮 Hiburan",
  OTHERS: "📦 Lainnya",
};

/** Generate last N months as { value: "MM/YYYY", label: "Mei 2026" } */
function getMonthOptions(count = 6) {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  const mmFormatter = new Intl.DateTimeFormat("id-ID", { month: "2-digit", year: "numeric" });
  const labelFormatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });

  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({ value: mmFormatter.format(d), label: labelFormatter.format(d) });
  }
  return options;
}

export function HistoryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") ?? "";
  const activeMonth = searchParams.get("month") ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset ke halaman 1 saat filter berubah
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const monthOptions = getMonthOptions(6);

  return (
    <div className="mb-6 space-y-3">
      {/* Filter bulan */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        <button
          type="button"
          onClick={() => updateParam("month", "")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            !activeMonth
              ? "bg-slate-800 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          Semua Bulan
        </button>
        {monthOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => updateParam("month", opt.value)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeMonth === opt.value
                ? "bg-slate-800 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Filter kategori */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        <button
          type="button"
          onClick={() => updateParam("category", "")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            !activeCategory
              ? "bg-emerald-500 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
          }`}
        >
          Semua Kategori
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => updateParam("category", activeCategory === cat ? "" : cat)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeCategory === cat
                ? "bg-emerald-500 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>
    </div>
  );
}
