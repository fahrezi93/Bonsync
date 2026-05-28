"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HistoryPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function HistoryPagination({ currentPage, totalPages }: HistoryPaginationProps) {
  const { push } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    push(`${pathname}?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft className="size-4" />
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          const isActive = page === currentPage;
          // Tampilkan: halaman pertama, terakhir, aktif, dan ±1 dari aktif
          const show =
            page === 1 ||
            page === totalPages ||
            Math.abs(page - currentPage) <= 1;

          if (!show) {
            // Tampilkan ellipsis hanya sekali di tiap gap
            const prevShown =
              page - 1 === 1 ||
              page - 1 === totalPages ||
              Math.abs(page - 1 - currentPage) <= 1;
            if (prevShown) {
              return (
                <span key={`ellipsis-${page}`} className="px-1 text-xs text-slate-400">
                  …
                </span>
              );
            }
            return null;
          }

          return (
            <button
              key={page}
              type="button"
              onClick={() => goToPage(page)}
              className={`h-9 min-w-[2.25rem] rounded-xl px-2 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Halaman berikutnya"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
