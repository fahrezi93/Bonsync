const fs = require('fs');

const content = `
export default async function HomePage() {
  const data = await getDashboard();

  if (data.needsBudget) {
    return <SetBudgetForm monthLabel={data.monthLabel!} />;
  }

  const score = data.survivalScore!;
  const danger = score < 30;
  const warning = score < 60 && score >= 30;

  const statusColor = danger
    ? 'text-rose-600'
    : warning
      ? 'text-amber-600'
      : 'text-emerald-600';

  const statusLabel = danger
    ? '?? Kritis! Dompet hampir kosong'
    : warning
      ? '?? Waspada, mulai hemat'
      : '? Aman, budget masih terkontrol';

  return (
    <div className="mx-auto w-full max-w-md md:max-w-5xl px-4 py-8 pb-32">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

        {/* Left Column */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="premium-card p-6 text-center space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Sisa Uang Jajan — {data.monthLabel}
            </p>
            <p className="text-4xl font-bold text-slate-900 tracking-tight">
              {idr.format(data.remaining!)}
            </p>
            <p className="text-sm text-slate-500">
              dari total {idr.format(data.budgetLimit!)}
            </p>
            <p className="{ \	ext-sm font-semibold mt-1 \ animate-pulse\ }">
              {statusLabel}
            </p>
          </div>

          <SurvivalScore score={score} />

          <div className="premium-card p-4 flex justify-between text-sm text-slate-500 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <span>Sudah dipakai</span>
            <span className="font-semibold text-slate-700">{idr.format(data.spent!)}</span>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-7 flex flex-col gap-6">
          <Suspense fallback={
            <div className="premium-card p-6 shadow-sm animate-pulse flex flex-col gap-3">
               <div className="flex items-center gap-2 text-slate-400">
                  <Bot className="h-5 w-5" />
                  <span className="text-sm font-bold">Menyiapkan Roasting AI...</span>
               </div>
               <div className="h-20 bg-slate-100 rounded-xl w-full"></div>
            </div>
          }>
            <MonthlyRoastingSection />
          </Suspense>

          <div className="premium-card p-6 min-h-[220px] flex flex-col justify-center items-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <h3 className="text-sm font-bold text-slate-800 self-start w-full mb-2">Sebaran Kategori</h3>
            <div className="h-40 w-full">
              <CategoryPieChart data={data.categoryData!} />
            </div>
          </div>

          {data.recentExpenses && data.recentExpenses.length > 0 && (
            <div className="premium-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800">5 Transaksi Terakhir</h3>
                <Link href="/history" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Lihat Semua ?
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                 {data.recentExpenses.map((exp) => (
                    <div key={exp.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-full">
                           {getCategoryIcon(exp.category)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{exp.category}</p>
                          <p className="text-xs text-slate-500">
                            {new Intl.DateTimeFormat('id-ID', { dateStyle: 'short' }).format(exp.date)} 
                            {exp.source === 'QUICK_RECEIPT' && ' • Nota'}
                            {exp.source === 'SPLIT_BILL' && ' • Split'}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-700">{idr.format(exp.totalAmount)}</span>
                    </div>
                 ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
`;

fs.appendFileSync('app/page.tsx', '\n' + content);
