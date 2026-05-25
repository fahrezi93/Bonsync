import { prisma } from "@/lib/prisma";
import { deleteExpense } from "@/actions/expense-actions";
import { Trash2, ReceiptText, ChevronRight, Receipt, ScanLine, Users } from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";
import { HistoryFilters } from "@/components/history-filters";
import { HistoryPagination } from "@/components/history-pagination";
import { EditExpenseDialog } from "@/components/edit-expense-dialog";
import { requireCurrentUserId } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import { getUserCategories } from "@/actions/category-actions";
import { getCategoryStyle } from "@/lib/categories";
import { ExportButtons } from "@/components/export-buttons";

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

const SOURCE_CONFIG: Record<string, { label: string; className: string }> = {
  MANUAL:        { label: "Manual",    className: "border-slate-200/60 bg-[#fbfbfb] text-slate-500" },
  QUICK_RECEIPT: { label: "Foto Nota", className: "border-emerald-100 bg-emerald-50/80 text-emerald-700" },
  SPLIT_BILL:    { label: "Split",     className: "border-emerald-100/40 bg-emerald-50/40 text-emerald-600" },
};

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
  const customCategories = await getUserCategories();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 pb-32 md:pb-16 flex flex-col flex-1 h-full min-h-0 overflow-y-auto hide-scrollbar">

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in-up shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Riwayat Transaksi</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {totalCount} transaksi
            {(category || month) && " (difilter)"}
            {" — total "}
            <span className="font-bold text-slate-800">{idr.format(totalAmount)}</span>
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <ExportButtons />
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
        <div className="premium-card border-dashed bg-transparent p-12 mt-4 text-center animate-fade-in-up flex flex-col items-center justify-center">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-full mb-4">
            <ReceiptText className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-800">Belum ada catatan</p>
          <p className="mt-1 text-xs font-medium text-slate-500">
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
              const catStyle = getCategoryStyle(expense.category, customCategories);
              const srcConfig = SOURCE_CONFIG[expense.source] ?? {
                label: expense.source,
                className: "border-slate-200 bg-slate-50 text-slate-600",
              };

              // Nama tampilan: description (manual/chat) → merchantName (nota) → null
              const displayName =
                expense.description?.trim() ||
                expense.receipt?.merchantName?.trim() ||
                null;

              const Icon = catStyle.Icon;

              return (
                <div
                  key={expense.id}
                  className="premium-card p-0 flex flex-col overflow-hidden group"
                >
                  {/* ── Top: icon + nama + hapus ── */}
                  <div className="p-4 pb-3.5 flex items-start gap-3.5">
                    {/* Category icon bubble */}
                    <div
                      className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-full border transition-all ${catStyle.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Nama pengeluaran */}
                      {displayName ? (
                        <p className="text-sm font-bold text-slate-800 leading-snug truncate group-hover:text-slate-900 transition-colors">
                          {displayName}
                        </p>
                      ) : (
                        <p className="text-xs font-semibold text-slate-400 italic leading-snug">
                          Tidak ada nama
                        </p>
                      )}
                      {/* Sub-label kategori */}
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        {catStyle.label}
                      </p>
                    </div>

                    {/* Edit & Hapus */}
                    <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all">
                      <EditExpenseDialog 
                        expense={{
                          id: expense.id,
                          description: expense.description,
                          totalAmount: expense.totalAmount,
                          category: expense.category
                        }} 
                        customCategories={customCategories}
                      />
                      <form
                        action={async () => {
                          "use server";
                          await deleteExpense(expense.id);
                        }}
                      >
                        <button
                          type="submit"
                          title="Hapus pengeluaran"
                          className="shrink-0 rounded-full p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Divider tipis */}
                  <div className="mx-4 border-t border-slate-100" />

                  {/* ── Tengah: nominal + source badge ── */}
                  <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between gap-2">
                    <p className="text-xl font-bold tracking-tight text-slate-800 leading-none">
                      {idr.format(expense.totalAmount)}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-semibold shrink-0 ${srcConfig.className}`}
                    >
                      <SourceIcon source={expense.source} />
                      {srcConfig.label}
                    </span>
                  </div>

                  {/* ── AI Advice ── */}
                  {expense.aiAdvice && (
                    <div className="mx-4 mb-4 rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <p className="line-clamp-2 text-xs font-medium text-slate-500">
                        {expense.aiAdvice}
                      </p>
                    </div>
                  )}

                  {/* ── Footer: tanggal + detail ── */}
                  <div className="mt-auto px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <p className="text-xs font-medium text-slate-500">
                      {dateFormatter.format(new Date(expense.date))}
                    </p>
                    <Link
                      href={`/history/${expense.id}`}
                      className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Detail <ChevronRight className="h-4 w-4" />
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
      <div className="mt-6 md:hidden">
        <ExportButtons className="w-full grid grid-cols-2" />
      </div>
    </div>
  );
}
