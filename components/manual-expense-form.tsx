"use client";

import { useActionState } from "react";
import { Loader2, PenLine } from "lucide-react";
import { addManualExpense, type ManualExpenseState } from "@/actions/expense-actions";
import { CurrencyInput } from "@/components/currency-input";

const initialState: ManualExpenseState = { success: false, message: "" };

export function ManualExpenseForm() {
  const [state, formAction, pending] = useActionState(addManualExpense, initialState);

  return (
    <div className="bento-card">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900">
           <div className="bg-slate-100 p-2 rounded-xl">
             <PenLine className="h-4 w-4 text-slate-700" />
           </div>
           <h2 className="text-sm font-bold tracking-tight">Input Cepat</h2>
        </div>
      </div>
      <p className="mb-5 text-[11px] font-medium text-slate-400">Catat pengeluaran instan (tanpa bon).</p>

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-[10px] font-bold text-slate-500 uppercase tracking-widest"
          >
            Keterangan
          </label>
          <input
            id="description"
            name="description"
            type="text"
            placeholder="Makan siang warteg..."
            maxLength={200}
            required
            className="w-full rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-3 text-[13px] font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-medium focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all shadow-sm"
          />
        </div>

        <div>
          <label
            htmlFor="amount"
            className="mb-1.5 block text-[10px] font-bold text-slate-500 uppercase tracking-widest"
          >
            Nominal (Rp)
          </label>
          <CurrencyInput
            id="amount"
            name="amount"
            placeholder="25.000"
            required
          />
        </div>

        {state.message && (
          <div
            className={`rounded-xl border px-3 py-2.5 text-[11px] font-semibold leading-snug ${
              state.success
                ? "border-emerald-200/60 bg-emerald-50/50 text-emerald-700"
                : "border-rose-200/60 bg-rose-50/50 text-rose-700"
            }`}
          >
            {state.message}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full mt-2 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-[13px] font-bold text-white hover:bg-slate-800 disabled:opacity-70 transition-all shadow-md active:scale-[0.98]"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
             <span className="flex-1 text-center">Catat Pengeluaran</span>
          )}
          {!pending && <PenLine className="h-4 w-4 opacity-50" />}
        </button>
      </form>
    </div>
  );
}
