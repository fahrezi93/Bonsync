export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-md md:max-w-5xl px-4 py-8 pb-32">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-pulse">
        {/* Left column skeleton */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="premium-card p-6 space-y-3">
            <div className="h-3 w-32 bg-slate-200 rounded-full mx-auto" />
            <div className="h-10 w-48 bg-slate-200 rounded-full mx-auto" />
            <div className="h-3 w-24 bg-slate-200 rounded-full mx-auto" />
          </div>
          <div className="premium-card p-6 h-32 bg-slate-100" />
          <div className="premium-card p-4 h-12 bg-slate-100" />
          <div className="premium-card p-6 h-40 bg-slate-100" />
        </div>
        {/* Right column skeleton */}
        <div className="md:col-span-7 flex flex-col gap-6">
          <div className="premium-card p-6 h-32 bg-slate-100" />
          <div className="premium-card p-6 h-52 bg-slate-100" />
          <div className="premium-card p-6 h-64 bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
