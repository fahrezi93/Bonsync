export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-md px-4 py-8 animate-pulse">
      <div className="premium-card p-6 space-y-5">
        <div className="space-y-2">
          <div className="h-5 w-40 bg-slate-200 rounded-full" />
          <div className="h-3 w-56 bg-slate-200 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-20 bg-slate-200 rounded-full" />
          <div className="h-11 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-11 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}
