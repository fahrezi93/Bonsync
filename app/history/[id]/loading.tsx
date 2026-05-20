import { ArrowLeft } from "lucide-react";

export default function ExpenseDetailLoading() {
  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-32 animate-pulse">
      <div className="mb-6 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4 text-slate-300" />
        <div className="h-3 w-32 bg-slate-200 rounded-full" />
      </div>

      {/* Header card skeleton */}
      <div className="premium-card p-6 mb-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-slate-200 rounded-full" />
              <div className="h-5 w-20 bg-slate-200 rounded-full" />
            </div>
            <div className="h-9 w-36 bg-slate-200 rounded-full" />
            <div className="h-3 w-28 bg-slate-200 rounded-full" />
          </div>
          <div className="h-12 w-12 bg-slate-100 rounded-2xl" />
        </div>
        <div className="h-14 bg-amber-50 rounded-xl" />
      </div>

      {/* Receipt card skeleton */}
      <div className="premium-card overflow-hidden mb-4">
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 space-y-1">
          <div className="h-3 w-16 bg-slate-200 rounded-full" />
          <div className="h-5 w-32 bg-slate-200 rounded-full" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between px-5 py-3 border-b border-slate-50">
            <div className="h-4 w-32 bg-slate-100 rounded-full" />
            <div className="h-4 w-16 bg-slate-100 rounded-full" />
          </div>
        ))}
        <div className="flex justify-between px-5 py-3 bg-slate-50">
          <div className="h-4 w-12 bg-slate-200 rounded-full" />
          <div className="h-4 w-20 bg-slate-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}
