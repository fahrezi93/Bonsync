"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100">
        <AlertTriangle className="h-8 w-8 text-rose-500" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-800">Ada yang error nih</h2>
        <p className="text-sm text-slate-500">
          {error.message || "Terjadi kesalahan yang tidak terduga."}
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 font-mono">ID: {error.digest}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 active:scale-95 transition-all"
      >
        <RefreshCw className="h-4 w-4" />
        Coba Lagi
      </button>
    </div>
  );
}
