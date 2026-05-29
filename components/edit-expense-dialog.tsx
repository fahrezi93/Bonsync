"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Edit3, X, Loader2 } from "lucide-react";
import { editExpense } from "@/actions/expense-actions";
import { CurrencyInput } from "@/components/currency-input";
import { useRouter } from "next/navigation";

import { PREDEFINED_CATEGORIES } from "@/lib/categories";
interface EditExpenseDialogProps {
  expense: {
    id: string;
    description: string | null;
    totalAmount: number;
    category: string;
  };
  trigger?: React.ReactNode;
  customCategories?: Array<{ id: string; name: string }>;
}

const EMPTY_CUSTOM_CATEGORIES: Array<{ id: string; name: string }> = [];

export function EditExpenseDialog({ expense, trigger, customCategories = EMPTY_CUSTOM_CATEGORIES }: EditExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const { refresh } = useRouter();

  async function onSubmit(formData: FormData) {
    setError("");
    const description = formData.get("description") as string;
    const amount = Number(formData.get("amount"));
    const category = formData.get("category") as string;

    startTransition(async () => {
      const res = await editExpense({
        id: expense.id,
        description,
        totalAmount: amount,
        category,
      });

      if (res.success) {
        setOpen(false);
        refresh();
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {trigger || (
          <button 
            type="button" 
            title="Edit pengeluaran"
            className="shrink-0 rounded-full p-2 text-slate-400 opacity-100 transition-all hover:bg-slate-100 hover:text-slate-600 focus:opacity-100 md:text-slate-300 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
          >
            <Edit3 className="size-4" />
          </button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-fade-in-up" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-[24px] p-6 shadow-xl z-50 animate-fade-in-up focus:outline-none">
          <Dialog.Title className="text-xl font-bold text-slate-800 tracking-tight mb-1">
            Edit Pengeluaran
          </Dialog.Title>
          <Dialog.Description className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
            Ubah detail transaksi. AI akan me-roasting ulang otomatis jika nominal berubah.
          </Dialog.Description>

          <form action={onSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-[13px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="edit-expense-amount" className="text-[13px] font-bold text-slate-700">
                Nominal (Rp)
              </label>
              <CurrencyInput
                id="edit-expense-amount"
                name="amount"
                defaultValue={expense.totalAmount}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-expense-description" className="text-[13px] font-bold text-slate-700">
                Deskripsi
              </label>
              <input
                id="edit-expense-description"
                type="text"
                name="description"
                defaultValue={expense.description || ""}
                required
                aria-label="Deskripsi"
                className="w-full rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-3 text-[13px] font-semibold text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2 relative">
              <label htmlFor="edit-expense-category" className="text-[13px] font-bold text-slate-700">
                Kategori
              </label>
              <select
                id="edit-expense-category"
                name="category"
                defaultValue={expense.category}
                required
                className="w-full rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-3 text-[13px] font-semibold text-slate-800 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all shadow-sm appearance-none"
              >
                <optgroup label="Bawaan">
                  {PREDEFINED_CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.label} ({cat.name})
                    </option>
                  ))}
                </optgroup>
                {customCategories.length > 0 && (
                  <optgroup label="Kustom">
                    {customCategories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="mt-8 pt-6 flex items-center justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed min-w-[140px]"
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {isPending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute top-5 right-5 size-8 inline-flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none"
              aria-label="Tutup"
            >
              <X className="size-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
