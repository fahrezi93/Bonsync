export default function HistoryLoading() {
  return (
    <div className="mx-auto w-full max-w-md md:max-w-5xl px-4 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-slate-200 rounded-full" />
          <div className="h-3 w-36 bg-slate-200 rounded-full" />
        </div>
        <div className="h-8 w-28 bg-slate-200 rounded-xl hidden md:block" />
      </div>

      {/* Filter bar skeleton */}
      <div className="mb-6 flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 bg-slate-200 rounded-full shrink-0" />
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="premium-card p-5 space-y-4">
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-slate-200 rounded-full" />
              <div className="h-5 w-20 bg-slate-200 rounded-full" />
            </div>
            <div className="h-8 w-32 bg-slate-200 rounded-full" />
            <div className="h-12 bg-slate-100 rounded-lg" />
            <div className="h-3 w-28 bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
