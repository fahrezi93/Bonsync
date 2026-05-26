"use client";

import { useActionState, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { setBudget, type BudgetActionState } from "@/actions/budget-actions";

const initialState: BudgetActionState = { success: false, message: "" };

interface SetBudgetFormProps {
  currentLimit?: number;
  monthLabel: string;
  /** Optional callback fired once after a successful save. */
  onSaved?: () => void;
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

export function SetBudgetForm({ currentLimit, monthLabel, onSaved }: SetBudgetFormProps) {
  const [state, formAction, pending] = useActionState(setBudget, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretDigitsRef = useRef<number | null>(null);
  const onSavedFiredRef = useRef(false);

  // Fire onSaved callback once after a successful save.
  useEffect(() => {
    if (state.success && onSaved && !onSavedFiredRef.current) {
      onSavedFiredRef.current = true;
      onSaved();
    }
  }, [state.success, onSaved]);

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
      className="w-full premium-card p-6 md:p-8 relative overflow-hidden transition-all duration-300"
      suppressHydrationWarning
    >

      {/* Header */}
      <div className="mb-6 flex flex-col gap-1 animate-fade-in-up" suppressHydrationWarning>
        <div suppressHydrationWarning>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">
            {isEditMode ? "Budget Bulanan" : "Set Budget Bulan Ini"}
          </h1>
          <p className="text-sm font-medium text-slate-500">{monthLabel}</p>
        </div>
      </div>

      {/* Info jika belum ada budget */}
      {!isEditMode && (
        <div className="mb-6 rounded-[16px] border border-emerald-100 bg-emerald-50/50 px-4 py-3.5 text-xs font-semibold text-emerald-800 leading-relaxed animate-fade-in-up">
          Sebelum mulai mencatat pengeluaran, tentukan dulu batas budget bulan ini ya!
        </div>
      )}

      <form action={formAction} className="space-y-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div suppressHydrationWarning>
          <label
            htmlFor="limitAmount-display"
            className="mb-2 block text-sm font-semibold text-slate-700 pl-1"
          >
            Batas Pengeluaran
          </label>

          {/* Input terlihat (berformat titik) */}
          <div className="relative group" suppressHydrationWarning>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-slate-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors">
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
              className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-lg font-bold text-slate-800 placeholder:text-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-sm transition-all"
            />
          </div>

          {/* Preview formatted */}
          {showPreview ? (
            <p className="mt-2 text-sm font-bold text-emerald-600 pl-1">
              = {idr.format(numericValue)}
            </p>
          ) : displayVal.length > 0 && !isValid ? (
            <p className="mt-2 text-xs text-rose-500 font-semibold pl-1">
              {numericValue > 1_000_000_000
                ? "Maksimal Rp 1.000.000.000"
                : "Masukkan angka yang valid"}
            </p>
          ) : null}
        </div>

        {/* Feedback dari server */}
        {state.message && (
          <div
            className={`rounded-2xl border px-5 py-4 text-sm font-medium animate-fade-in-up ${
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
          disabled={pending || (!isValid && displayVal.length > 0)}
          className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 px-6 text-[15px] font-bold text-white transition-all active:scale-[0.96] hover:bg-emerald-500 hover:shadow-[0_8px_20px_rgba(16,185,129,0.25)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none"
        >
          {pending && <Loader2 className="size-[18px] animate-spin" />}
          {!pending && <Wallet className="size-[18px]" />}
          {pending
            ? "Menyimpan..."
            : isEditMode
              ? "Perbarui Budget"
              : "Simpan Budget"}
        </button>
      </form>
    </div>
  );
}

