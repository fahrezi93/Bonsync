import { Loader2 } from "lucide-react";

export default function ScanLoading() {
  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="size-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <Loader2 className="size-8 text-emerald-500 animate-spin" />
        </div>
        <p className="text-lg font-bold text-slate-800">Memuat halaman scan…</p>
      </div>
    </div>
  );
}
