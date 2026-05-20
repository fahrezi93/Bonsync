"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Plus, ReceiptText, Save, Trash2 } from "lucide-react";
import { extractReceiptDraft, saveQuickReceiptExpense } from "@/actions/expense-actions";
import { computeReceiptTotals, type ReceiptDraft } from "@/lib/receipt-utils";
import { useRouter } from "next/navigation";
import { CurrencyInput } from "@/components/currency-input";

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function QuickReceiptZone() {
  const router = useRouter();
  const [draft, setDraft] = useState<ReceiptDraft | null>(null);
  const [status, setStatus] = useState<string>("");
  const [extracting, startExtract] = useTransition();
  const [saving, startSave] = useTransition();

  const totals = useMemo(
    () => (draft ? computeReceiptTotals(draft) : { subtotal: 0, discount: 0, extraCharges: 0, total: 0 }),
    [draft],
  );

  const handleExtract = (formData: FormData) => {
    setStatus("");
    startExtract(async () => {
      const result = await extractReceiptDraft(formData);
      if (!result.success || !result.data) {
        setStatus(result.message ?? "Gagal ekstrak nota.");
        return;
      }
      setDraft(result.data);
      setStatus(result.message ?? "Nota terbaca. Cek/ubah data dulu sebelum simpan.");
    });
  };

  const updateMerchant = (value: string) => {
    setDraft((prev) => (prev ? { ...prev, merchantName: value } : prev));
  };

  const updateTax = (num: number) => {
    setDraft((prev) => (prev ? { ...prev, tax: Math.max(0, num) } : prev));
  };

  const updateDiscount = (num: number) => {
    setDraft((prev) => (prev ? { ...prev, discount: Math.max(0, num) } : prev));
  };

  const updateService = (num: number) => {
    setDraft((prev) =>
      prev ? { ...prev, serviceCharge: Math.max(0, num) } : prev,
    );
  };

  const updateItemName = (index: number, value: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const items = [...prev.items];
      items[index] = { ...items[index], itemName: value };
      return { ...prev, items };
    });
  };

  const updateItemPrice = (index: number, num: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const items = [...prev.items];
      items[index] = { ...items[index], price: Math.max(0, num) };
      return { ...prev, items };
    });
  };

  const removeItem = (index: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const items = prev.items.filter((_, idx) => idx !== index);
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, items: [...prev.items, { itemName: "Item baru", price: 0 }] };
    });
  };

  const saveQuickReceipt = () => {
    if (!draft) return;
    startSave(async () => {
      const result = await saveQuickReceiptExpense(draft);
      if (!result.success) {
        setStatus(result.message);
        return;
      }
      setStatus(result.aiAdvice ? `${result.message} | Roast: ${result.aiAdvice}` : result.message);
      router.refresh();
      setDraft(null);
    });
  };

  return (
    <div className="premium-card p-6">
      <div className="mb-1 flex items-center gap-2 text-slate-800">
        <ReceiptText className="h-5 w-5 text-emerald-500" />
        <h2 className="text-lg font-semibold">Foto Nota Cepat</h2>
      </div>
      <p className="mb-5 text-sm text-slate-500">Simpan semua item ke pengeluaran saya.</p>

      <form action={handleExtract} className="space-y-4">
        <input
          name="receipt"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors"
          required
        />
        <button
          type="submit"
          disabled={extracting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-white px-4 py-2.5 text-sm font-semibold hover:bg-emerald-600 disabled:opacity-70 transition-colors shadow-sm"
        >
          {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ReceiptText className="h-4 w-4" />}
          {extracting ? "Membaca nota..." : "Scan Nota Cepat"}
        </button>
      </form>

      {draft ? (
        <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              value={draft.merchantName}
              onChange={(e) => updateMerchant(e.target.value)}
              className="sm:col-span-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              placeholder="Nama merchant"
            />
            <CurrencyInput
              name="_discount"
              value={draft.discount}
              onChange={(num) => updateDiscount(num)}
              placeholder="Potongan"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <CurrencyInput
              name="_tax"
              value={draft.tax}
              onChange={(num) => updateTax(num)}
              placeholder="Tax"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <CurrencyInput
              name="_service"
              value={draft.serviceCharge}
              onChange={(num) => updateService(num)}
              placeholder="Service"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm sm:col-span-3"
            >
              <Plus className="h-4 w-4" /> Item
            </button>
          </div>

          <div className="max-h-56 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            {draft.items.map((item, idx) => (
              <div key={`${idx}-${item.itemName}`} className="grid grid-cols-12 gap-2">
                <input
                  value={item.itemName}
                  onChange={(e) => updateItemName(idx, e.target.value)}
                  className="col-span-7 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <CurrencyInput
                  name={`_item_price_${idx}`}
                  value={item.price}
                  onChange={(num) => updateItemPrice(idx, num)}
                  className="col-span-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="col-span-1 inline-flex items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                  title="Hapus item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal item:</span>
              <span className="font-medium text-slate-800">{idr.format(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Potongan:</span>
              <span className="font-medium text-slate-800">-{idr.format(totals.discount)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Tax + Service:</span>
              <span className="font-medium text-slate-800">{idr.format(totals.extraCharges)}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center text-base font-semibold text-slate-900">
              <span>Total tersimpan:</span>
              <span className="text-emerald-600">{idr.format(totals.total)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={saveQuickReceipt}
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-70 transition-colors shadow-sm"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Menyimpan..." : "Simpan Semua ke Pengeluaran Saya"}
          </button>
        </div>
      ) : null}

      {status ? (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 leading-relaxed">
          {status}
        </div>
      ) : null}
    </div>
  );
}
