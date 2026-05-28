import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Receipt, Tag, Utensils, Car, ShoppingBag, Sparkles, Percent, FileText, Bell, UserCheck } from "lucide-react";
import { requireOnboarding } from "@/lib/auth";
import { EditExpenseDialog } from "@/components/edit-expense-dialog";
import { EditReceiptDialog } from "@/components/edit-receipt-dialog";
import { getUserCategories } from "@/actions/category-actions";
import { getCategoryStyle } from "@/lib/categories";
import { createClient } from "@/utils/supabase/server";

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});



const SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Input Manual",
  QUICK_RECEIPT: "Foto Nota",
  SPLIT_BILL: "Split Bill",
};

const MODE_LABELS: Record<string, string> = {
  QUICK: "Nota Penuh",
  SPLIT: "Split Bill",
};

function parseMarkdown(text: string): React.ReactNode {
  if (!text) return "";
  
  const regex = /(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return (
        <strong key={index} className="font-bold text-slate-800">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return (
        <em key={index} className="italic text-slate-700">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[12px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

async function getExpenseDetail(id: string, userId: string) {
  const expense = await prisma.expense.findFirst({
    where: { id, userId },
    include: {
      receipt: {
        include: {
          items: true,
        },
      },
    },
  });
  return expense;
}

async function getReceiptImageSrc(imagePath: string | null | undefined) {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("receipts")
    .createSignedUrl(imagePath, 60 * 10);

  if (error) {
    console.error("[receipt-image] signed URL failed:", error.message);
    return null;
  }

  return data.signedUrl;
}

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireOnboarding();
  const expense = await getExpenseDetail(id, userId);

  if (!expense) {
    notFound();
  }

  const receipt = expense.receipt;
  const receiptImageSrc = await getReceiptImageSrc(receipt?.imageUrl);
  const customCategories = await getUserCategories();
  const catStyle = getCategoryStyle(expense.category, customCategories);
  const CategoryIcon = catStyle.Icon;

  // Pisahkan item milik sendiri vs orang lain (untuk split bill)
  const selfItems = receipt?.items.filter((i) => i.ownerType === "SELF") ?? [];
  const otherItems = receipt?.items.filter((i) => i.ownerType === "OTHER") ?? [];
  const hasSplit = receipt?.mode === "SPLIT";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-32 md:pb-16 flex flex-col flex-1 h-full min-h-0 overflow-y-auto hide-scrollbar">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/history"
          className="group inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors p-2 -ml-2 rounded-xl hover:bg-slate-100/80 w-fit"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Kembali ke Riwayat
        </Link>
        
        <EditExpenseDialog 
          expense={{
            id: expense.id,
            description: expense.description,
            totalAmount: expense.totalAmount,
            category: expense.category
          }}
          customCategories={customCategories}
          trigger={
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 text-xs font-bold transition-all">
              Edit Data
            </button>
          }
        />
      </div>

      {/* Header card */}
      <div className="premium-card p-6 mb-6 space-y-4 animate-fade-in-up">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${catStyle.color}`}
              >
                <CategoryIcon className="h-4 w-4" />
                {catStyle.label}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                <Receipt className="h-4 w-4" />
                {SOURCE_LABELS[expense.source] ?? expense.source}
              </span>
            </div>
            <p className="text-3xl font-bold tracking-tight text-slate-900 leading-none">
              {idr.format(expense.totalAmount)}
            </p>
            {/* Nama pengeluaran */}
            {(expense.description || receipt?.merchantName) && (
              <p className="text-[15px] font-semibold text-slate-700 leading-snug">
                {expense.description?.trim() || receipt?.merchantName}
              </p>
            )}
            <p className="text-sm font-medium text-slate-500">
              {dateFormatter.format(new Date(expense.date))}
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
            <Receipt className="h-6 w-6 text-slate-400" />
          </div>
        </div>

        {/* AI Advice */}
        {expense.aiAdvice && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 flex gap-3 mt-4">
            <div className="shrink-0 rounded-full bg-slate-200/50 p-1.5 h-fit text-slate-500">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="text-sm leading-relaxed text-slate-600 font-medium whitespace-pre-line">
              {parseMarkdown(expense.aiAdvice)}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 pb-4">
        {/* Receipt detail — hanya tampil kalau ada data receipt */}
        {receipt ? (
          <>
          <div className="premium-card overflow-hidden mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {/* Receipt header */}
            <div className="bg-slate-50/60 px-6 py-5 border-b border-dashed border-slate-200 rounded-t-[24px]">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">
                    Detail Nota
                  </p>
                  <p className="text-lg font-bold text-slate-800 tracking-tight">
                    {receipt.merchantName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                    {MODE_LABELS[receipt.mode] ?? receipt.mode}
                  </span>
                  <EditReceiptDialog
                    expenseId={expense.id}
                    receipt={{
                      merchantName: receipt.merchantName,
                      discountAmount: receipt.discountAmount,
                      taxAmount: receipt.taxAmount,
                      serviceChargeAmount: receipt.serviceChargeAmount,
                      mode: receipt.mode,
                      items: receipt.items.map((item) => ({
                        id: item.id,
                        itemName: item.itemName,
                        price: item.price,
                        ownerType: item.ownerType,
                      })),
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              {/* Items milik sendiri */}
              {selfItems.length > 0 && (
                <div className="py-2">
                  {hasSplit && (
                    <div className="pb-2.5 border-b border-slate-100 mb-3">
                      <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        Item Milikmu
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {selfItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 py-1"
                      >
                        <span className="text-[13px] font-medium text-slate-800 leading-relaxed max-w-[75%]">
                          {item.itemName}
                        </span>
                        <span className="text-[13px] font-bold text-slate-900 whitespace-nowrap pt-0.5">
                          {idr.format(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items milik orang lain (split bill) */}
              {hasSplit && otherItems.length > 0 && (
                <div className="py-2 mt-4 pt-4 border-t border-dashed border-slate-200">
                  <div className="pb-2.5 border-b border-slate-100 mb-3">
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                      Item Orang Lain
                    </p>
                  </div>
                  <div className="space-y-2">
                    {otherItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 py-1 opacity-60"
                      >
                        <span className="text-[13px] font-medium text-slate-600 leading-relaxed max-w-[75%]">
                          {item.itemName}
                        </span>
                        <span className="text-[13px] font-medium text-slate-700 whitespace-nowrap pt-0.5">
                          {idr.format(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Breakdown total */}
            <div className="border-t border-dashed border-slate-200 bg-slate-50/40">
              {receipt.discountAmount > 0 && (
                <div className="flex justify-between px-6 py-3 border-b border-dashed border-slate-200/80">
                  <span className="text-[13px] font-medium text-slate-500">Subtotal item</span>
                  <span className="text-[13px] font-semibold text-slate-700">
                    {idr.format(receipt.subtotalAmount)}
                  </span>
                </div>
              )}
              {receipt.discountAmount > 0 && (
                <div className="flex justify-between px-6 py-3 border-b border-dashed border-slate-200/80 bg-rose-500/[0.03]">
                  <span className="text-[13px] font-bold text-rose-600 flex items-center gap-1.5">
                    <Percent className="h-3.5 w-3.5 text-rose-500" />
                    Diskon
                  </span>
                  <span className="text-[13px] font-bold text-rose-600">
                    − {idr.format(receipt.discountAmount)}
                  </span>
                </div>
              )}
              {receipt.taxAmount > 0 && (
                <div className="flex justify-between px-6 py-3 border-b border-dashed border-slate-200/80 bg-amber-500/[0.03]">
                  <span className="text-[13px] font-bold text-amber-700 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-amber-600" />
                    Pajak
                  </span>
                  <span className="text-[13px] font-bold text-amber-700">
                    + {idr.format(receipt.taxAmount)}
                  </span>
                </div>
              )}
              {receipt.serviceChargeAmount > 0 && (
                <div className="flex justify-between px-6 py-3 border-b border-dashed border-slate-200/80 bg-sky-500/[0.03]">
                  <span className="text-[13px] font-bold text-sky-700 flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-sky-600" />
                    Biaya layanan
                  </span>
                  <span className="text-[13px] font-bold text-sky-700">
                    + {idr.format(receipt.serviceChargeAmount)}
                  </span>
                </div>
              )}
              <div className={`flex justify-between px-6 py-4.5 bg-slate-50/60 ${!hasSplit ? "rounded-b-[24px]" : ""}`}>
                <span className="text-sm font-bold text-slate-800 tracking-tight">
                  {hasSplit ? "Total nota penuh" : "Total"}
                </span>
                <span className="text-base font-bold text-emerald-700 tracking-tight">
                  {idr.format(receipt.totalAmount)}
                </span>
              </div>
              {hasSplit && (
                <div className="flex justify-between px-6 py-5 border-t border-emerald-100 bg-emerald-500/10 rounded-b-[24px]">
                  <span className="text-sm font-bold text-emerald-800 tracking-tight flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                    Bagianmu
                  </span>
                  <span className="text-base font-bold text-emerald-800 tracking-tight">
                    {idr.format(expense.totalAmount)}
                  </span>
                </div>
              )}
            </div>
          </div>
           
          {/* Foto Nota */}
          {receiptImageSrc && (
            <div className="premium-card overflow-hidden mb-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between bg-slate-50/60 px-6 py-5 list-none">
                  <span className="text-sm font-semibold text-slate-800">Lihat Foto Nota</span>
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24" className="text-slate-500"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="p-4 border-t border-dashed border-slate-200 flex justify-center bg-white">
                  <img src={receiptImageSrc} alt="Foto Nota" className="max-w-full rounded-xl shadow-sm max-h-[60vh] object-contain border border-slate-100" />
                </div>
              </details>
            </div>
          )}
          </>
        ) : (
          /* Expense manual — tidak ada receipt */
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-[24px] bg-slate-50/20 w-full animate-fade-in-up flex flex-col items-center mb-6" style={{ animationDelay: '100ms' }}>
            <div className="bg-slate-100/60 p-4 rounded-2xl mb-4 border border-slate-200/40">
              <Tag className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-[14px] font-bold text-slate-700">Dicatat Secara Manual</p>
            <p className="mt-1 text-xs font-semibold text-slate-400 text-center max-w-[280px] leading-relaxed">
              Pengeluaran ini tidak memiliki struk belanja karena diinput secara manual oleh kamu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
