import { prisma } from "@/lib/prisma";
import { SetBudgetForm } from "@/components/set-budget-form";
import { SurvivalScore } from "@/components/survival-score";
import { CategoryPieChart } from "@/components/category-pie-chart";
import { RoastingCard } from "@/components/roasting-card";
import { ManualExpenseForm } from "@/components/manual-expense-form";
import { getMonthlyRoasting } from "@/lib/roasting";
import { requireCurrentUserId } from "@/lib/auth";
import { Suspense } from "react";
import Link from "next/link";
import { Camera, MessageCircle, Utensils, Car, ShoppingBag, Receipt, Sparkles, Bot, Wallet, ChevronRight } from "lucide-react";

const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "2-digit", year: "numeric" });
const monthLabelFormatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

async function getDashboard() {
  const userId = await requireCurrentUserId();
  const monthKey = monthFormatter.format(new Date());
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [budget, expenses] = await Promise.all([
    prisma.monthlyBudget.findUnique({ where: { userId_month: { userId, month: monthKey } } }),
    prisma.expense.findMany({
      where: { userId, date: { gte: monthStart } },
      orderBy: { date: "desc" },
    }),
  ]);

  if (!budget) {
    return { needsBudget: true, monthKey, monthLabel: monthLabelFormatter.format(new Date()), userId };
  }

  const budgetLimit = budget.limitAmount;
  const spent = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
  const remaining = Math.max(0, budgetLimit - spent);
  const survivalScore = budgetLimit > 0 ? (remaining / budgetLimit) * 100 : 0;

  // Grupkan expenses by category
  const categoryMap = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  
  const recentExpenses = expenses.slice(0, 5);

  // Ambil cached roast dari DB (tidak generate AI disini)
  // getMonthlyRoasting akan generate AI hanya jika latestRoast = null
  const roastText = budget.latestRoast;

  return {
    needsBudget: false,
    monthLabel: monthLabelFormatter.format(new Date()),
    budgetLimit,
    spent,
    remaining,
    survivalScore,
    categoryData,
    recentExpenses,
    userId,
    monthKey,
    roastText, // null jika perlu di-generate, string jika sudah ada
  };
}

function getCategoryStyle(cat: string) {
  const norm = cat.toLowerCase();
  if (norm.includes("makan") || norm.includes("food")) {
    return {
      icon: <Utensils className="h-4.5 w-4.5" />,
      colorClass: "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
    };
  }
  if (norm.includes("transport") || norm.includes("bensin") || norm.includes("parkir") || norm.includes("ojek")) {
    return {
      icon: <Car className="h-4.5 w-4.5" />,
      colorClass: "bg-rose-50 text-rose-600 border border-rose-100/50"
    };
  }
  if (norm.includes("belanja") || norm.includes("shopping") || norm.includes("lifestyle")) {
    return {
      icon: <ShoppingBag className="h-4.5 w-4.5" />,
      colorClass: "bg-amber-50 text-amber-600 border border-amber-100/50"
    };
  }
  return {
    icon: <Receipt className="h-4.5 w-4.5" />,
    colorClass: "bg-slate-50 text-slate-600 border border-slate-100/50"
  };
}

async function MonthlyRoastingSection({ userId, monthKey }: { userId: string; monthKey: string }) {
  // getMonthlyRoasting pakai React.cache() + DB cache:
  // - Jika latestRoast ada di DB → langsung return (NO AI call)
  // - Jika null (ada perubahan expense) → generate AI 1x lalu simpan ke DB
  const roasting = await getMonthlyRoasting(userId, monthKey);
  return <RoastingCard advice={roasting} />;
}

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
    ? '🚨 Kritis! Dompet hampir kosong'
    : warning
      ? '⚠️ Waspada, mulai hemat'
      : '✅ Aman, budget masih terkontrol';

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 pb-32 md:pb-16 flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto hide-scrollbar">

      <div className="hidden md:flex flex-col gap-1 mb-2 animate-fade-in-up">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 font-medium">Pantau keuanganmu bulan ini biar nggak rungkad.</p>
      </div>

      {/* Budget alert banner */}
      {danger && (
        <div className="flex items-center gap-4 rounded-3xl border border-rose-200/60 bg-rose-50/50 p-4 animate-fade-in-up">
          <div className="bg-white/80 p-2.5 rounded-2xl shadow-sm">
            <span className="text-xl">🚨</span>
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-rose-800 tracking-tight">Budget kritis!</p>
            <p className="text-xs text-rose-600/90 mt-0.5 font-medium">
              Sisa {idr.format(data.remaining!)} dari {idr.format(data.budgetLimit!)}.
            </p>
          </div>
          <Link href="/settings" className="shrink-0 rounded-[14px] bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-md">
            Topup Budget
          </Link>
        </div>
      )}
      {warning && !danger && (
        <div className="flex items-center gap-4 rounded-3xl border border-amber-200/60 bg-amber-50/50 p-4 animate-fade-in-up">
          <div className="bg-white/80 p-2.5 rounded-2xl shadow-sm">
             <span className="text-xl">⚠️</span>
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-amber-800 tracking-tight">Mulai rem dikit</p>
            <p className="text-xs text-amber-700/80 mt-0.5 font-medium">
              Udah kepake {Math.round(100 - score)}%. Sisa {idr.format(data.remaining!)}.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Left Column */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="bento-card flex flex-col justify-between min-h-[220px] bg-emerald-50 text-slate-900 animate-fade-in-up border-emerald-100 shadow-[0_8px_32px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.1)] transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-0.5">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                   Sisa Uang Jajan
                 </p>
                 <span className="text-[11px] font-medium text-emerald-700">
                   {data.monthLabel}
                 </span>
              </div>
              <div className="p-2 bg-emerald-500 rounded-xl shadow-sm">
                <Wallet className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <div className="mt-8 mb-4">
               <p className="text-[40px] leading-tight font-extrabold tracking-tighter text-emerald-700 mb-1">
                 {idr.format(data.remaining!)}
               </p>
               <p className="text-[13px] font-medium text-slate-500">
                 dari limit {idr.format(data.budgetLimit!)}
               </p>
            </div>
            
            <div className={`mt-auto pt-4 border-t border-emerald-200/50 flex items-center gap-2.5 text-xs font-bold ${danger ? 'text-rose-600' : warning ? 'text-amber-600' : 'text-emerald-700'}`}>
              <div className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${danger ? 'bg-rose-400' : warning ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${danger ? 'bg-rose-500' : warning ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              </div>
              {statusLabel}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
             <div className="bento-card flex flex-col items-center justify-center p-5 group min-h-[140px]">
                <SurvivalScore score={score} />
             </div>
             
             <div className="bento-card flex flex-col justify-between p-5 min-h-[140px] bg-emerald-500/5 border-emerald-500/10">
               <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70 mb-1 block">Total Kepake</span>
                  <span className="text-xl font-extrabold text-slate-900 tracking-tight">{idr.format(data.spent!)}</span>
               </div>
               <div className="w-full bg-slate-200/50 h-2 rounded-full mt-4 overflow-hidden relative">
                  <div className="absolute top-0 left-0 bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, Math.round(100 - score))}%` }} />
               </div>
             </div>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
             <ManualExpenseForm />
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-7 flex flex-col gap-6">
          <Suspense fallback={
            <div className="bento-card shadow-sm animate-pulse flex flex-col gap-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-[14px]" />
                  <div className="bg-slate-100 h-5 w-40 rounded-md" />
               </div>
               <div className="h-24 bg-slate-100 rounded-[18px] w-full mt-2"></div>
            </div>
          }>
            <div className="animate-fade-in-up">
              <MonthlyRoastingSection userId={data.userId!} monthKey={data.monthKey!} />
            </div>
          </Suspense>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bento-card flex flex-col justify-center items-center animate-fade-in-up h-[320px] sm:h-auto" style={{ animationDelay: '200ms' }}>
              <div className="flex w-full items-center justify-between mb-6">
                 <h3 className="text-sm font-bold tracking-tight text-slate-800">Sebaran Pengeluaran</h3>
                 <div className="p-2 bg-slate-50 rounded-xl">
                   <Utensils className="w-3.5 h-3.5 text-slate-400" />
                 </div>
              </div>
              <div className="h-44 w-full flex-1 align-middle">
                <CategoryPieChart data={data.categoryData!} />
              </div>
            </div>

            {data.recentExpenses && data.recentExpenses.length > 0 && (
              <div className="bg-white border border-slate-200/50 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden animate-fade-in-up flex flex-col h-[320px] sm:h-[280px] relative" style={{ animationDelay: '250ms' }}>
                <div className="bg-white/95 backdrop-blur-md p-4 flex justify-between items-center z-20 border-b border-slate-100/50 shrink-0">
                  <h3 className="text-xs font-extrabold tracking-tight text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                    Riwayat Terakhir
                  </h3>
                  <Link 
                    href="/history" 
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-all bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-full border border-slate-100 hover:border-slate-200 shadow-sm shrink-0"
                  >
                    Lihat Semua
                  </Link>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2.5 flex flex-col gap-2 pb-8">
                  {data.recentExpenses.map((exp) => {
                    const { icon, colorClass } = getCategoryStyle(exp.category);
                    return (
                      <Link
                        key={exp.id}
                        href={`/history/${exp.id}`}
                        className="flex justify-between items-center px-3 py-2.5 rounded-2xl hover:bg-slate-50/80 active:bg-slate-100/50 transition-all duration-200 border border-transparent hover:border-slate-100/50 group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className={`w-9 h-9 rounded-xl transition-all duration-300 flex items-center justify-center shrink-0 shadow-sm ${colorClass}`}>
                            {icon}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <p className="text-[13px] font-bold text-slate-800 leading-tight group-hover:text-slate-950 transition-colors capitalize truncate">
                              {exp.category.toLowerCase()}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400 mt-1 whitespace-nowrap flex items-center gap-1.5">
                              <span>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'short' }).format(exp.date)}</span>
                              {exp.source === 'QUICK_RECEIPT' && <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md font-extrabold">Nota</span>}
                              {exp.source === 'SPLIT_BILL' && <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-extrabold">Split</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-3">
                          <span className="text-[13px] font-extrabold text-slate-900 leading-none">
                            {idr.format(exp.totalAmount)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Fixed bottom fade gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
