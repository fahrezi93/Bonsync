"use client";

import { useRouter } from "next/navigation";
import { SetBudgetForm } from "@/components/set-budget-form";
import { CalendarDays } from "lucide-react";
import { useState, useTransition } from "react";
import { skipBudgetSetup } from "@/actions/budget-actions";

export function NewMonthFlow({ monthLabel }: { monthLabel: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSaved() {
    // Beri sedikit jeda supaya user sempat membaca pesan sukses
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 800);
  }

  function handleSkip() {
    startTransition(async () => {
      await skipBudgetSetup();
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 flex flex-col gap-6 animate-fade-in-up">
      <div className="flex flex-col items-center text-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Yeay! Bulan Baru Telah Tiba!
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Yuk set budget {monthLabel} supaya pengeluaranmu tetap terkontrol. Pengaturan AI-mu akan otomatis disalin dari bulan lalu.
          </p>
        </div>
      </div>

      <div className="premium-card p-6 border-emerald-100">
        <SetBudgetForm
          monthLabel={monthLabel}
          onSaved={handleSaved}
          hideHeader={true}
          hideCard={true}
        />

        <div className="mt-6 border-t border-slate-100 pt-6 text-center">
          <p className="text-sm font-medium text-slate-500 mb-3">Belum gajian?</p>
          <button
            onClick={handleSkip}
            disabled={isPending}
            className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            {isPending ? "Melewati..." : "Lewati sementara"}
          </button>
        </div>
      </div>
    </div>
  );
}
