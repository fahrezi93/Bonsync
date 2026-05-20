"use client";

import { useActionState, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { setBudget, type BudgetActionState } from "@/actions/budget-actions";

const initialState: BudgetActionState = { success: false, message: "" };

interface SetBudgetFormProps {
  currentLimit?: number;
  monthLabel: string;
}

/** Format angka jadi "1.000.000" (titik = pemisah ribuan Indonesia) */
function formatRibuan(raw: string): string {
  // Hapus semua selain digit
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  // Format dengan titik tiap 3 digit dari kanan
  return Number(digits).toLocaleString("id-ID");
}

/** Strip titik, kembalikan angka murni sebagai string */
function stripFormat(val: string): string {
  return val.replace(/\./g, "").replace(/\D/g, "");
}

function countDigitsBeforeCaret(value: string, caretPos: number): number {
  return value.slice(0, caretPos).replace(/\D/g, "").length;
}

function findCaretFromDigitIndex(value: string, digitIndex: number): number {
  if (digitIndex <= 0) return 0;

  let seenDigits = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (/\d/.test(value[i])) {
      seenDigits += 1;
      if (seenDigits === digitIndex) return i + 1;
    }
  }

  return value.length;
}

function removeDigitAtIndex(digits: string, index: number): string {
  if (index < 0 || index >= digits.length) return digits;
  return `${digits.slice(0, index)}${digits.slice(index + 1)}`;
}

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function SetBudgetForm({ currentLimit, monthLabel }: SetBudgetFormProps) {
  const [state, formAction, pending] = useActionState(setBudget, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretDigitsRef = useRef<number | null>(null);

  // Display value: berformat titik (e.g. "1.000.000")
  const [displayVal, setDisplayVal] = useState<string>(
    currentLimit ? formatRibuan(String(currentLimit)) : "",
  );

  const numericValue = useMemo(() => {
    const rawNumber = stripFormat(displayVal);
    if (!rawNumber) return 0;
    return Number(rawNumber);
  }, [displayVal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const caretPos = e.target.selectionStart ?? e.target.value.length;
    const digitCountBeforeCaret = countDigitsBeforeCaret(e.target.value, caretPos);
    const formatted = formatRibuan(e.target.value);
    pendingCaretDigitsRef.current = digitCountBeforeCaret;
    setDisplayVal(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Backspace" && e.key !== "Delete") return;

    const input = e.currentTarget;
    const liveValue = input.value;
    const selectionStart = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? 0;
    const isCollapsed = selectionStart === selectionEnd;

    if (!isCollapsed) return;

    const digits = stripFormat(liveValue);
    if (!digits) return;

    const digitsBeforeCaret = countDigitsBeforeCaret(liveValue, selectionStart);

    if (e.key === "Backspace") {
      const removeIndex = digitsBeforeCaret - 1;
      if (removeIndex < 0) return;

      e.preventDefault();
      const nextDigits = removeDigitAtIndex(digits, removeIndex);
      pendingCaretDigitsRef.current = removeIndex;
      setDisplayVal(formatRibuan(nextDigits));
      return;
    }

    const removeIndex = digitsBeforeCaret;
    if (removeIndex >= digits.length) return;

    e.preventDefault();
    const nextDigits = removeDigitAtIndex(digits, removeIndex);
    pendingCaretDigitsRef.current = digitsBeforeCaret;
    setDisplayVal(formatRibuan(nextDigits));
  };

  useLayoutEffect(() => {
    const desiredDigitsPos = pendingCaretDigitsRef.current;
    if (desiredDigitsPos === null) return;
    if (!inputRef.current) return;
    if (document.activeElement !== inputRef.current) {
      pendingCaretDigitsRef.current = null;
      return;
    }

    const caretPos = findCaretFromDigitIndex(displayVal, desiredDigitsPos);
    inputRef.current.setSelectionRange(caretPos, caretPos);
    pendingCaretDigitsRef.current = null;
  }, [displayVal]);

  const effectiveLimit =
    state.success && typeof state.submittedLimit === "number"
      ? state.submittedLimit
      : currentLimit;
  const isEditMode = typeof effectiveLimit === "number";

  // Validasi client-side untuk preview
  const isValid = numericValue > 0 && numericValue <= 1_000_000_000;
  const showPreview = displayVal.length > 0 && isValid;

  return (
    <div
      className="flex-1 w-full bg-transparent flex items-center justify-center p-4"
      suppressHydrationWarning
    >
      <div
        className="w-full max-w-md bento-card shadow-[0_8px_32px_rgba(0,0,0,0.05)] border-none"
        suppressHydrationWarning
      >
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 animate-fade-in-up" suppressHydrationWarning>
          <div
            className="rounded-[14px] bg-slate-100 p-2.5"
            suppressHydrationWarning
          >
            <Wallet className="h-5 w-5 text-slate-700" strokeWidth={2.5} />
          </div>
          <div suppressHydrationWarning>
            <h1 className="text-[17px] font-bold tracking-tight text-slate-900">
              {isEditMode ? "Ubah Budget" : "Set Budget Bulan Ini"}
            </h1>
            <p className="text-xs font-semibold text-slate-400">{monthLabel}</p>
          </div>
        </div>

        {/* Info jika belum ada budget */}
        {!isEditMode && (
          <div className="mb-6 rounded-[14px] border border-blue-100/50 bg-blue-50/50 px-4 py-3.5 text-xs font-medium text-blue-800 leading-relaxed animate-fade-in-up">
            Sebelum mulai mencatat pengeluaran, tentukan dulu batas budget bulan ini ya!
          </div>
        )}

        <form action={formAction} className="space-y-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div suppressHydrationWarning>
            <label
              htmlFor="limitAmount-display"
              className="mb-2 block text-[10px] font-bold text-slate-500 uppercase tracking-widest"
            >
              Nominal Budget
            </label>

            {/* Input terlihat (berformat titik) */}
            <div className="relative" suppressHydrationWarning>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">
                Rp
              </span>
              <input
                ref={inputRef}
                id="limitAmount-display"
                name="limitAmount"
                type="text"
                inputMode="numeric"
                value={displayVal}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="0"
                required
                autoComplete="off"
                className="w-full rounded-2xl border border-slate-200/60 bg-slate-50/50 pl-11 pr-4 py-4 text-xl font-extrabold text-slate-900 placeholder:text-slate-300 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all tracking-tight shadow-sm"
              />
            </div>

            {/* Preview formatted */}
            {showPreview ? (
              <p className="mt-2 text-sm font-semibold text-emerald-600">
                = {idr.format(numericValue)}
              </p>
            ) : displayVal.length > 0 && !isValid ? (
              <p className="mt-2 text-xs text-rose-500">
                {numericValue > 1_000_000_000
                  ? "Maksimal Rp 1.000.000.000"
                  : "Masukkan angka yang valid"}
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-400">
                Ketik nominal, titik otomatis muncul - Berlaku untuk {monthLabel}
              </p>
            )}
          </div>

          {/* Feedback dari server */}
          {state.message && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm leading-snug ${
                state.success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              {state.message}
            </div>
          )}

          <button
            type="submit"
            disabled={pending || !isValid}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-4 text-[14px] font-bold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.98]"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : (
              <Wallet className="h-4 w-4 opacity-70" />
            )}
            {pending
              ? "Menyimpan..."
              : isEditMode
                ? "Perbarui Budget"
                : "Simpan Budget"}
          </button>
        </form>
      </div>
    </div>
  );
}

