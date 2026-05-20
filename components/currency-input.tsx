"use client";

/**
 * CurrencyInput — input angka rupiah dengan format titik otomatis.
 *
 * Fitur:
 * - Ketik angka → otomatis format 1.000.000 (titik ribuan)
 * - Tidak ada spinner arrow (appearance: none)
 * - Backspace / Delete tetap akurat meski ada titik
 * - Kirim nilai numerik murni (tanpa titik) ke hidden input untuk form action
 * - Support controlled (value + onChange) ATAU uncontrolled (defaultValue)
 */

import {
  useLayoutEffect,
  useRef,
  useState,
} from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRibuan(raw: string | number): string {
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

function stripFormat(val: string): string {
  return val.replace(/\./g, "").replace(/\D/g, "");
}

function countDigitsBeforeCaret(value: string, caretPos: number): number {
  return value.slice(0, caretPos).replace(/\D/g, "").length;
}

function findCaretFromDigitIndex(value: string, digitIndex: number): number {
  if (digitIndex <= 0) return 0;
  let seenDigits = 0;
  for (let i = 0; i < value.length; i++) {
    if (/\d/.test(value[i])) {
      seenDigits++;
      if (seenDigits === digitIndex) return i + 1;
    }
  }
  return value.length;
}

function removeDigitAtIndex(digits: string, index: number): string {
  if (index < 0 || index >= digits.length) return digits;
  return `${digits.slice(0, index)}${digits.slice(index + 1)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CurrencyInputProps {
  /** Name untuk hidden input yang dikirim ke form action */
  name: string;
  /** Nilai numerik yang dikontrol dari luar. Jika undefined → uncontrolled */
  value?: number;
  /** Dipanggil dengan nilai numerik murni (angka) setiap kali berubah */
  onChange?: (numericValue: number) => void;
  /** Nilai awal untuk mode uncontrolled */
  defaultValue?: number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  autoComplete?: string;
}

export function CurrencyInput({
  name,
  value,
  onChange,
  defaultValue,
  placeholder = "0",
  required,
  disabled,
  className = "",
  id,
  autoComplete = "off",
}: CurrencyInputProps) {
  const isControlled = value !== undefined;

  // initialDisplay: formatted string berdasarkan value atau defaultValue
  const [displayVal, setDisplayVal] = useState<string>(() => {
    const init = isControlled ? value : defaultValue;
    return init != null && init > 0 ? formatRibuan(String(init)) : "";
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretDigitsRef = useRef<number | null>(null);

  // Sync jika value dari luar berubah (controlled)
  const prevValueRef = useRef<number | undefined>(value);
  if (isControlled && value !== prevValueRef.current) {
    prevValueRef.current = value;
    const formatted = value != null && value > 0 ? formatRibuan(String(value)) : "";
    // Hanya update display jika sedang tidak fokus, untuk menghindari gangguan saat mengetik
    if (document.activeElement !== inputRef.current) {
      setDisplayVal(formatted);
    }
  }

  const numericValue = (() => {
    const raw = stripFormat(displayVal);
    return raw ? Number(raw) : 0;
  })();

  // Hidden input untuk form action — kirim nilai murni
  const hiddenValue = numericValue > 0 ? String(numericValue) : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const caretPos = e.target.selectionStart ?? e.target.value.length;
    const digitCountBeforeCaret = countDigitsBeforeCaret(e.target.value, caretPos);
    const formatted = formatRibuan(e.target.value);
    pendingCaretDigitsRef.current = digitCountBeforeCaret;
    setDisplayVal(formatted);
    const num = Number(stripFormat(formatted));
    onChange?.(Number.isFinite(num) ? num : 0);
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
      const formatted = formatRibuan(nextDigits);
      pendingCaretDigitsRef.current = removeIndex;
      setDisplayVal(formatted);
      onChange?.(Number(nextDigits) || 0);
      return;
    }

    // Delete key
    const removeIndex = digitsBeforeCaret;
    if (removeIndex >= digits.length) return;
    e.preventDefault();
    const nextDigits = removeDigitAtIndex(digits, removeIndex);
    const formatted = formatRibuan(nextDigits);
    pendingCaretDigitsRef.current = digitsBeforeCaret;
    setDisplayVal(formatted);
    onChange?.(Number(nextDigits) || 0);
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

  const baseClass =
    "no-spinner w-full rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-3 text-[13px] font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-medium focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all font-mono shadow-sm";

  return (
    <>
      {/* Hidden input → dikirim ke server action */}
      <input type="hidden" name={name} value={hiddenValue} />

      {/* Visible formatted input */}
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        value={displayVal}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`${baseClass} ${className}`}
        aria-label={id}
      />
    </>
  );
}
