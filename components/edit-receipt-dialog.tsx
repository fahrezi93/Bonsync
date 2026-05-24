"use client";

import { useMemo, useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, ReceiptText, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { CurrencyInput } from "@/components/currency-input";
import { editReceiptExpense } from "@/actions/expense-actions";

type EditableReceiptItem = {
  id: string;
  itemName: string;
  price: number;
  ownerType: "SELF" | "OTHER";
};

type EditReceiptDialogProps = {
  expenseId: string;
  receipt: {
    merchantName: string;
    discountAmount: number;
    taxAmount: number;
    serviceChargeAmount: number;
    mode: "QUICK" | "SPLIT";
    items: EditableReceiptItem[];
  };
};

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function EditReceiptDialog({ expenseId, receipt }: EditReceiptDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [merchantName, setMerchantName] = useState(receipt.merchantName);
  const [discountAmount, setDiscountAmount] = useState(receipt.discountAmount);
  const [taxAmount, setTaxAmount] = useState(receipt.taxAmount);
  const [serviceChargeAmount, setServiceChargeAmount] = useState(receipt.serviceChargeAmount);
  const [items, setItems] = useState<EditableReceiptItem[]>(receipt.items);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const total = Math.max(0, subtotal - discountAmount + taxAmount + serviceChargeAmount);
    const selfSubtotal = items
      .filter((item) => item.ownerType === "SELF")
      .reduce((sum, item) => sum + item.price, 0);
    const ratio = subtotal > 0 ? selfSubtotal / subtotal : 0;
    const selfTotal =
      receipt.mode === "SPLIT"
        ? Math.max(0, selfSubtotal - discountAmount * ratio + taxAmount * ratio + serviceChargeAmount * ratio)
        : total;

    return { subtotal, total, selfTotal };
  }, [discountAmount, items, receipt.mode, serviceChargeAmount, taxAmount]);

  function updateItem(id: string, patch: Partial<EditableReceiptItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function submit() {
    setError("");
    startTransition(async () => {
      const result = await editReceiptExpense({
        expenseId,
        merchantName,
        discountAmount,
        taxAmount,
        serviceChargeAmount,
        items,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition-transform active:scale-[0.96] hover:bg-slate-50"
        >
          <ReceiptText className="size-4" />
          Edit Nota
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[88dvh] w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[24px] bg-white shadow-xl focus:outline-none">
          <div className="border-b border-slate-100 px-6 py-5">
            <Dialog.Title className="text-xl font-bold text-slate-800 text-balance">
              Edit Detail Nota
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm font-medium text-slate-500 text-pretty">
              Koreksi hasil baca AI tanpa perlu scan ulang.
            </Dialog.Description>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
            <div className="space-y-5">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700">Merchant</label>
                <input
                  value={merchantName}
                  onChange={(event) => setMerchantName(event.target.value)}
                  className="w-full rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-3 text-[13px] font-semibold text-slate-800 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-slate-600">
                    Diskon / Potongan
                  </label>
                  <CurrencyInput
                    name="_discount"
                    value={discountAmount}
                    onChange={setDiscountAmount}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-slate-600">
                    PPN / Pajak
                  </label>
                  <CurrencyInput
                    name="_tax"
                    value={taxAmount}
                    onChange={setTaxAmount}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-slate-600">
                    Biaya Layanan
                  </label>
                  <CurrencyInput
                    name="_service"
                    value={serviceChargeAmount}
                    onChange={setServiceChargeAmount}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[13px] font-bold text-slate-700">Item Nota</p>
                {items.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="grid grid-cols-12 gap-2">
                      <input
                        value={item.itemName}
                        onChange={(event) => updateItem(item.id, { itemName: event.target.value })}
                        className="col-span-7 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <CurrencyInput
                        name={`_receipt_item_${item.id}`}
                        value={item.price}
                        onChange={(value) => updateItem(item.id, { price: value })}
                        className="col-span-5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    {receipt.mode === "SPLIT" && (
                      <div className="mt-3 inline-flex rounded-xl border border-slate-200 bg-white p-1">
                        {(["SELF", "OTHER"] as const).map((owner) => (
                          <button
                            key={owner}
                            type="button"
                            onClick={() => updateItem(item.id, { ownerType: owner })}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                              item.ownerType === owner
                                ? "bg-emerald-500 text-white"
                                : "text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                            {owner === "SELF" ? "Milikku" : "Orang lain"}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
                <div className="flex justify-between font-semibold text-slate-500">
                  <span>Subtotal item</span>
                  <span className="font-bold text-slate-800 tabular-nums">{idr.format(totals.subtotal)}</span>
                </div>
                <div className="mt-2 flex justify-between font-semibold text-slate-500">
                  <span>Total nota</span>
                  <span className="font-bold text-slate-800 tabular-nums">{idr.format(totals.total)}</span>
                </div>
                {receipt.mode === "SPLIT" && (
                  <div className="mt-3 border-t border-slate-200 pt-3 flex justify-between font-bold text-emerald-700">
                    <span>Bagianmu</span>
                    <span className="tabular-nums">{idr.format(totals.selfTotal)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <Dialog.Close asChild>
              <button
                type="button"
                className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
              >
                Batal
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              className="inline-flex h-10 min-w-36 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition-transform active:scale-[0.96] hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isPending ? "Menyimpan..." : "Simpan Nota"}
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Tutup"
              className="absolute right-5 top-5 inline-flex size-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="size-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
