"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteExpense } from "@/actions/expense-actions";

interface DeleteExpenseDialogProps {
  expenseId: string;
  expenseName?: string | null;
}

export function DeleteExpenseDialog({ expenseId, expenseName }: DeleteExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { refresh } = useRouter();
  const label = expenseName?.trim() || "pengeluaran ini";

  function handleDelete() {
    setError("");
    startTransition(async () => {
      const result = await deleteExpense(expenseId);

      if (result.success) {
        setOpen(false);
        refresh();
        return;
      }

      setError(result.message);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          title="Hapus pengeluaran"
          className="shrink-0 rounded-full p-2 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-500 md:text-slate-300 cursor-pointer"
        >
          <Trash2 className="size-4" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm animate-fade-in-up" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[24px] bg-white p-6 shadow-xl animate-fade-in-up focus:outline-none">
          <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <Trash2 className="size-5" />
          </div>
          <Dialog.Title className="text-lg font-bold tracking-tight text-slate-800">
            Hapus pengeluaran?
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
            Data <span className="font-bold text-slate-700">{label}</span> akan dihapus permanen dari riwayat.
          </Dialog.Description>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
              >
                Batal
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isPending ? "Menghapus..." : "Hapus"}
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute right-5 top-5 inline-flex size-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
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
