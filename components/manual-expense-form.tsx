"use client";

import { useActionState } from "react";
import { Loader2, PenLine } from "lucide-react";
import { addManualExpense, type ManualExpenseState } from "@/actions/expense-actions";
import { CurrencyInput } from "@/components/currency-input";

const initialState: ManualExpenseState = { success: false, message: "" };

export function ManualExpenseForm() {
  const [state, formAction, pending] = useActionState(addManualExpense, initialState);

  return (
    <div className="premium-card p-6">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-3 text-slate-800">
           <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 border border-slate-100">
             <PenLine className="h-5 w-5 text-slate-500" />
           </div>
           <div>
             <h2 className="text-sm font-bold text-slate-800 tracking-tight">Input Cepat</h2>
             <p className="text-[10px] font-medium text-slate-500 mt-0.5">Catat pengeluaran instan</p>
           </div>
        </div>
      </div>

      <form action={formAction} className="space-y-4 mt-6">
        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-xs font-medium text-slate-600"
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
            className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-white px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="amount"
            className="mb-1.5 block text-xs font-bold text-slate-500"
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
            className={`rounded-xl border px-4 py-3 text-xs font-bold leading-relaxed ${
              state.success
                ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
                : "border-rose-200 bg-rose-50/80 text-rose-800"
            }`}
          >
            {state.message}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full mt-2 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-75 transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin text-emerald-200" />
          ) : (
             <span className="flex-1 text-center">Catat Pengeluaran</span>
          )}
          {!pending && <PenLine className="h-4 w-4 opacity-75" />}
        </button>
      </form>
    </div>
  );
}
