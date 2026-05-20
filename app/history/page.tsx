import { prisma } from "@/lib/prisma";
import { deleteExpense } from "@/actions/expense-actions";
import { Trash2, ReceiptText, ChevronRight, Utensils, Car, ShoppingBag, Heart, Gamepad2, Receipt, Package, ScanLine, Users } from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";
import { HistoryFilters } from "@/components/history-filters";
import { HistoryPagination } from "@/components/history-pagination";
import { requireCurrentUserId } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const CATEGORY_CONFIG: Record<string, { color: string; label: string }> = {
  FOOD:          { color: "bg-orange-50 text-orange-600 border-orange-200",    label: "Makanan" },
  TRANSPORT:     { color: "bg-blue-50 text-blue-600 border-blue-200",          label: "Transport" },
  LIFESTYLE:     { color: "bg-purple-50 text-purple-600 border-purple-200",    label: "Lifestyle" },
  HEALTH:        { color: "bg-emerald-50 text-emerald-600 border-emerald-200", label: "Kesehatan" },
  ENTERTAINMENT: { color: "bg-pink-50 text-pink-600 border-pink-200",          label: "Hiburan" },
  OTHERS:        { color: "bg-slate-100 text-slate-600 border-slate-200",      label: "Lainnya" },
};

const SOURCE_CONFIG: Record<string, { label: string; className: string }> = {
  MANUAL:        { label: "Manual",    className: "border-amber-200 bg-amber-50 text-amber-700" },
  QUICK_RECEIPT: { label: "Foto Nota", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  SPLIT_BILL:    { label: "Split",     className: "border-cyan-200 bg-cyan-50 text-cyan-700" },
};

function CategoryIcon({ category }: { category: string }) {
  const cls = "h-4 w-4";
  switch (category) {
    case "FOOD":          return <Utensils className={cls} />;
    case "TRANSPORT":     return <Car className={cls} />;
    case "LIFESTYLE":     return <ShoppingBag className={cls} />;
    case "HEALTH":        return <Heart className={cls} />;
    case "ENTERTAINMENT": return <Gamepad2 className={cls} />;
    default:              return <Package className={cls} />;
  }
}

function SourceIcon({ source }: { source: string }) {
  const cls = "h-3 w-3";
  switch (source) {
    case "QUICK_RECEIPT": return <ScanLine className={cls} />;
    case "SPLIT_BILL":    return <Users className={cls} />;
    default:              return <Receipt className={cls} />;
  }
}

const PAGE_SIZE = 12;

function parseMonthRange(monthKey: string): { gte: Date; lt: Date } | null {
  const match = monthKey.match(/^(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const month = parseInt(match[1], 10) - 1;
  const year = parseInt(match[2], 10);
  return { gte: new Date(year, month, 1), lt: new Date(year, month + 1, 1) };
}

async function getHistory(params: { page: number; category: string; month: string }) {
  const userId = await requireCurrentUserId();
  const { page, category, month } = params;
  const skip = (page - 1) * PAGE_SIZE;

  const where: Prisma.ExpenseWhereInput = { userId };
  if (category) where.category = category;
  const dateRange = month ? parseMonthRange(month) : null;
  if (dateRange) where.date = dateRange;

  const [expenses, totalCount] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: PAGE_SIZE,
      include: { receipt: { select: { merchantName: true } } },
    }),
    prisma.expense.count({ where }),
  ]);

  return {
    expenses,
    totalCount,
    totalPages: Math.ceil(totalCount / PAGE_SIZE),
    totalAmount: expenses.reduce((sum, e) => sum + e.totalAmount, 0),
  };
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(String(params.page ?? "1"), 10));
  const category = String(params.category ?? "");
  const month = String(params.month ?? "");

  const { expenses, totalCount, totalPages, totalAmount } = await getHistory({ page, category, month });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 pb-32 md:pb-16 flex flex-col flex-1 h-full min-h-0 overflow-y-auto hide-scrollbar">

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in-up shrink-0">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">Riwayat Transaksi</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {totalCount} transaksi
            {(category || month) && " (difilter)"}
            {" — total "}
            <span className="font-bold text-slate-800">{idr.format(totalAmount)}</span>
          </p>
        </div>
        <div className="hidden md:block">
          <a
            href="/api/export"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            Export ke CSV
          </a>
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="mb-6 h-[72px] animate-pulse rounded-[20px] bg-slate-100" />}>
        <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <HistoryFilters />
        </div>
      </Suspense>

      {/* Empty state */}
      {expenses.length === 0 ? (
        <div className="bento-card border-dashed bg-transparent p-12 mt-4 text-center shadow-none animate-fade-in-up flex flex-col items-center justify-center">
          <div className="bg-slate-50 p-4 rounded-3xl mb-4">
            <ReceiptText className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-[15px] font-bold text-slate-800">Belum ada catatan</p>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {category || month
              ? "Coba ubah filter atau bulan pencarian."
              : "Scan struk atau input manual di halaman utama."}
          </p>
        </div>
      ) : (
        <>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up"
            style={{ animationDelay: "150ms" }}
          >
            {expenses.map((expense) => {
              const catConfig = CATEGORY_CONFIG[expense.category] ?? CATEGORY_CONFIG.OTHERS;
              const srcConfig = SOURCE_CONFIG[expense.source] ?? {
                label: expense.source,
                className: "border-slate-200 bg-slate-50 text-slate-600",
              };

              // Nama tampilan: description (manual/chat) → merchantName (nota) → null
              const displayName =
                expense.description?.trim() ||
                expense.receipt?.merchantName?.trim() ||
                null;

              return (
                <div
                  key={expense.id}
                  className="bento-card p-0 overflow-hidden group flex flex-col hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300"
                >
                  {/* ── Top: icon + nama + hapus ── */}
                  <div className="p-4 pb-3 flex items-start gap-3">
                    {/* Category icon bubble */}
                    <div
                      className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-[14px] border shadow-sm ${catConfig.color}`}
                    >
                      <CategoryIcon category={expense.category} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Nama pengeluaran */}
                      {displayName ? (
                        <p className="text-[14px] font-bold text-slate-800 leading-snug truncate">
                          {displayName}
                        </p>
                      ) : (
                        <p className="text-[13px] font-semibold text-slate-400 italic leading-snug">
                          Tidak ada nama
                        </p>
                      )}
                      {/* Sub-label kategori */}
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                        {catConfig.label}
                      </p>
                    </div>

                    {/* Hapus */}
                    <form
                      action={async () => {
                        "use server";
                        await deleteExpense(expense.id);
                      }}
                    >
                      <button
                        type="submit"
                        title="Hapus pengeluaran"
                        className="shrink-0 rounded-xl p-1.5 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 transition-all focus:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>

                  {/* Divider tipis */}
                  <div className="mx-4 border-t border-slate-100" />

                  {/* ── Tengah: nominal + source badge ── */}
                  <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
                    <p className="text-[22px] font-extrabold tracking-tight text-slate-900 leading-none">
                      {idr.format(expense.totalAmount)}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold shrink-0 ${srcConfig.className}`}
                    >
                      <SourceIcon source={expense.source} />
                      {srcConfig.label}
                    </span>
                  </div>

                  {/* ── AI Advice ── */}
                  {expense.aiAdvice && (
                    <div className="mx-4 mb-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                      <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500 italic">
                        &ldquo;{expense.aiAdvice}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* ── Footer: tanggal + detail ── */}
                  <div className="mt-auto px-4 py-2.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
                    <p className="text-[11px] font-medium text-slate-400">
                      {dateFormatter.format(new Date(expense.date))}
                    </p>
                    <Link
                      href={`/history/${expense.id}`}
                      className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Detail <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <Suspense fallback={null}>
            <HistoryPagination currentPage={page} totalPages={totalPages} />
          </Suspense>
        </>
      )}

      {/* Export button — mobile only */}
      <div className="mt-6 flex md:hidden justify-end">
        <a
          href="/api/export"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          Export ke CSV
        </a>
      </div>
    </div>
  );
}
