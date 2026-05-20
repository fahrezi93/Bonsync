import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Receipt, Tag, Utensils, Car, ShoppingBag, Sparkles, Percent, FileText, Bell, UserCheck } from "lucide-react";
import { requireCurrentUserId } from "@/lib/auth";

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

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: "bg-orange-50 text-orange-600 border-orange-200",
  TRANSPORT: "bg-blue-50 text-blue-600 border-blue-200",
  LIFESTYLE: "bg-purple-50 text-purple-600 border-purple-200",
  HEALTH: "bg-emerald-50 text-emerald-600 border-emerald-200",
  ENTERTAINMENT: "bg-pink-50 text-pink-600 border-pink-200",
  OTHERS: "bg-slate-100 text-slate-600 border-slate-200",
};

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  FOOD: Utensils,
  TRANSPORT: Car,
  LIFESTYLE: ShoppingBag,
  HEALTH: Sparkles,
  ENTERTAINMENT: Sparkles,
  OTHERS: Tag,
};

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
        <strong key={index} className="font-extrabold text-amber-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return (
        <em key={index} className="italic font-bold text-amber-900">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-amber-100/50 border border-amber-200/40 text-amber-950 font-mono text-[12px]">
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

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireCurrentUserId();
  const expense = await getExpenseDetail(id, userId);

  if (!expense) {
    notFound();
  }

  const receipt = expense.receipt;
  const categoryClass = CATEGORY_COLORS[expense.category] ?? CATEGORY_COLORS.OTHERS;
  const CategoryIcon = CATEGORY_ICONS[expense.category] ?? CATEGORY_ICONS.OTHERS;

  // Pisahkan item milik sendiri vs orang lain (untuk split bill)
  const selfItems = receipt?.items.filter((i) => i.ownerType === "SELF") ?? [];
  const otherItems = receipt?.items.filter((i) => i.ownerType === "OTHER") ?? [];
  const hasSplit = receipt?.mode === "SPLIT";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-32 md:pb-16 flex flex-col flex-1 h-full min-h-0 overflow-y-auto hide-scrollbar">
      {/* Back button */}
      <Link
        href="/history"
        className="group mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors p-2 -ml-2 rounded-xl hover:bg-slate-100/80 w-fit"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Kembali ke Riwayat
      </Link>

      {/* Header card */}
      <div className="premium-card p-6 mb-6 space-y-4 animate-fade-in-up">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${categoryClass}`}
              >
                <CategoryIcon className="h-3 w-3" />
                {expense.category}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                <Receipt className="h-3 w-3" />
                {SOURCE_LABELS[expense.source] ?? expense.source}
              </span>
            </div>
            <p className="text-[32px] font-black tracking-tight text-slate-900 leading-none">
              {idr.format(expense.totalAmount)}
            </p>
            {/* Nama pengeluaran */}
            {(expense.description || receipt?.merchantName) && (
              <p className="text-[15px] font-semibold text-slate-700 leading-snug">
                {expense.description?.trim() || receipt?.merchantName}
              </p>
            )}
            <p className="text-[13px] font-medium text-slate-400">
              {dateFormatter.format(new Date(expense.date))}
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
            <Receipt className="h-6 w-6 text-slate-400" />
          </div>
        </div>

        {/* AI Advice */}
        {expense.aiAdvice && (
          <div className="rounded-[16px] border border-amber-200 bg-amber-50/50 p-4 flex gap-3 shadow-sm">
            <div className="shrink-0 rounded-full bg-amber-100 p-1.5 h-fit">
              <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
            </div>
            <p className="text-[13px] leading-relaxed text-amber-900 font-medium italic whitespace-pre-line">
              &ldquo;{parseMarkdown(expense.aiAdvice)}&rdquo;
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 pb-4">
        {/* Receipt detail — hanya tampil kalau ada data receipt */}
        {receipt ? (
          <div className="premium-card overflow-hidden mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {/* Receipt header */}
            <div className="bg-slate-50/60 px-6 py-5 border-b border-dashed border-slate-200 rounded-t-[24px]">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Detail Nota
                  </p>
                  <p className="text-lg font-black text-slate-900 tracking-tight">
                    {receipt.merchantName}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm">
                  {MODE_LABELS[receipt.mode] ?? receipt.mode}
                </span>
              </div>
            </div>

            <div className="px-6 py-4">
              {/* Items milik sendiri */}
              {selfItems.length > 0 && (
                <div className="py-2">
                  {hasSplit && (
                    <div className="pb-2.5 border-b border-slate-100 mb-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5">
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
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
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
                <span className="text-[14px] font-extrabold text-slate-800 tracking-tight">
                  {hasSplit ? "Total nota penuh" : "Total"}
                </span>
                <span className="text-[16px] font-extrabold text-emerald-700 tracking-tight">
                  {idr.format(receipt.totalAmount)}
                </span>
              </div>
              {hasSplit && (
                <div className="flex justify-between px-6 py-5 border-t border-emerald-100 bg-emerald-500/10 rounded-b-[24px]">
                  <span className="text-[14px] font-black text-emerald-800 tracking-tight flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                    Bagianmu
                  </span>
                  <span className="text-[17px] font-black text-emerald-800 tracking-tight">
                    {idr.format(expense.totalAmount)}
                  </span>
                </div>
              )}
            </div>
          </div>
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
