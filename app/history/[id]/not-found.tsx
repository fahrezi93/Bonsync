import Link from "next/link";
import { ReceiptText } from "lucide-react";

export default function ExpenseNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200">
        <ReceiptText className="size-8 text-slate-400" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-800">Pengeluaran tidak ditemukan</h2>
        <p className="text-sm text-slate-500">
          Data ini mungkin sudah dihapus atau ID-nya tidak valid.
        </p>
      </div>
      <Link
        href="/history"
        className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 active:scale-95 transition-all"
      >
        Kembali ke Riwayat
      </Link>
    </div>
  );
}
