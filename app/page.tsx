import { prisma } from "@/lib/prisma";
import { getCategoryStyle } from "@/lib/categories";
import { SurvivalScore } from "@/components/survival-score";
import { CategoryPieChart } from "@/components/category-pie-chart";
import { RoastingCard } from "@/components/roasting-card";
import { ManualExpenseForm } from "@/components/manual-expense-form";
import { getMonthlyRoasting } from "@/lib/roasting";
import { getCurrentUserId } from "@/lib/auth";
import { getProfileMetadata } from "@/lib/profile";
import { createClient } from "@/utils/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Utensils, Car, ShoppingBag, Receipt, ChevronRight, Wallet } from "lucide-react";

const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "2-digit", year: "numeric" });
const monthLabelFormatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });
const shortDateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "short" });

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

async function getDashboard() {
  const userId = await getCurrentUserId();

  // Unauthenticated: show landing page
  if (!userId) {
    return { showLanding: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = getProfileMetadata({
    email: user?.email,
    user_metadata: user?.user_metadata,
  });

  const monthKey = monthFormatter.format(new Date());
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [budget, expenses, customCategories] = await Promise.all([
    prisma.monthlyBudget.findUnique({ where: { userId_month: { userId, month: monthKey } } }),
    prisma.expense.findMany({
      where: { userId, date: { gte: monthStart } },
      orderBy: { date: "desc" },
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!budget) {
    return {
      needsBudget: true,
      monthKey,
      monthLabel: monthLabelFormatter.format(new Date()),
      userId,
      displayName: profile.displayName,
    };
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
    displayName: profile.displayName,
    customCategories,
  };
}



async function MonthlyRoastingSection({
  userId,
  monthKey,
  survivalScore,
  remaining,
  budgetLimit,
  monthLabel,
  displayName,
}: {
  userId: string;
  monthKey: string;
  survivalScore: number;
  remaining: number;
  budgetLimit: number;
  monthLabel: string;
  displayName?: string;
}) {
  const roasting = await getMonthlyRoasting(userId, monthKey);
  return (
    <RoastingCard
      advice={roasting.text}
      level={roasting.level}
      persona={roasting.persona}
      survivalScore={survivalScore}
      remaining={remaining}
      budgetLimit={budgetLimit}
      monthLabel={monthLabel}
      displayName={displayName}
    />
  );
}

export default async function HomePage() {
  const data = await getDashboard();

  // Show landing page for unauthenticated users
  if (data.showLanding) {
    return <LandingPage />;
  }

  if (data.needsBudget) {
    // Belum onboarding → redirect ke route onboarding terpisah supaya
    // server action di tiap step bisa revalidate tanpa unmount client component.
    redirect("/onboarding");
  }

  const score = data.survivalScore!;
  const danger = score < 30;
  const warning = score < 60 && score >= 30;

  const statusLabel = danger
    ? '🚨 Kritis! Dompet hampir kosong'
    : warning
      ? '⚠️ Waspada, mulai hemat'
      : '✅ Aman, budget masih terkontrol';

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 pb-32 md:pb-16 flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto hide-scrollbar">

      <div className="hidden md:flex flex-col gap-1 mb-2 animate-fade-in-up">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 font-medium">Pantau keuanganmu bulan ini dengan mudah.</p>
      </div>

      {/* Budget alert banner */}
      {danger && (
        <div className="premium-card p-4 md:p-5 flex items-center gap-4 border-rose-200 bg-rose-50/50 animate-fade-in-up">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <Wallet className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-rose-800">Budget Kritis!</p>
            <p className="text-xs font-medium text-rose-700 mt-0.5">
              Sisa {idr.format(data.remaining!)} dari {idr.format(data.budgetLimit!)}.
            </p>
          </div>
          <Link href="/settings" className="shrink-0 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors">
            Topup
          </Link>
        </div>
      )}
      {warning && !danger && (
        <div className="premium-card p-4 md:p-5 flex items-center gap-4 border-amber-200 bg-amber-50/50 animate-fade-in-up">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Wallet className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">Mulai Hemat</p>
            <p className="text-xs font-medium text-amber-700 mt-0.5">
              Telah terpakai {Math.round(100 - score)}%. Sisa {idr.format(data.remaining!)}.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Left Column */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="premium-card p-6 flex flex-col justify-between min-h-[225px] animate-fade-in-up">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                 <p className="text-sm font-bold text-slate-500">
                   Sisa Uang Jajan
                 </p>
                 <span className="text-sm font-semibold text-emerald-600">
                   {data.monthLabel}
                 </span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-400">
                <Wallet className="size-5" />
              </div>
            </div>
            
            <div className="mt-8 mb-4">
               <p className="text-4xl font-bold tracking-tight text-slate-800 mb-2">
                 {idr.format(data.remaining!)}
               </p>
               <p className="text-xs font-medium text-slate-400">
                 dari limit {idr.format(data.budgetLimit!)}
               </p>
            </div>
            
            <div className={`mt-auto pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold tracking-wide ${danger ? 'text-rose-600' : warning ? 'text-amber-600' : 'text-emerald-600'}`}>
              <div className={`h-2 w-2 rounded-full ${danger ? 'bg-rose-500 animate-pulse' : warning ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
              {statusLabel}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
             <div className="premium-card p-6 flex flex-col justify-between min-h-[150px]">
                <div>
                   <span className="text-sm font-bold text-slate-500 mb-1 block">Survival Score</span>
                </div>
                <div className="flex justify-center items-center flex-1 mt-1">
                   <SurvivalScore score={score} />
                </div>
             </div>
             
             <div className="premium-card p-6 flex flex-col justify-between min-h-[150px]">
               <div>
                  <span className="text-sm font-bold text-slate-500 mb-1 block">Total Kepake</span>
                  <span className="text-xl font-bold text-slate-800 tracking-tight">{idr.format(data.spent!)}</span>
               </div>
               <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden border border-slate-200/50">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, Math.round(100 - score))}%` }} />
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
            <div className="premium-card p-6 animate-pulse flex flex-col gap-4">
               <div className="flex items-center gap-3">
                  <div className="size-8 bg-slate-100 rounded-full" />
                  <div className="bg-slate-100 h-4 w-32 rounded" />
               </div>
               <div className="h-20 bg-slate-50 rounded-2xl w-full mt-2"></div>
            </div>
          }>
            <div className="animate-fade-in-up">
              <MonthlyRoastingSection
                userId={data.userId!}
                monthKey={data.monthKey!}
                survivalScore={score}
                remaining={data.remaining!}
                budgetLimit={data.budgetLimit!}
                monthLabel={data.monthLabel!}
                displayName={data.displayName}
              />
            </div>
          </Suspense>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-6">
              <div className="premium-card p-6 flex flex-col justify-center items-center animate-fade-in-up h-[320px] sm:h-auto min-h-[300px]" style={{ animationDelay: '200ms' }}>
                <div className="flex w-full items-center justify-between mb-4">
                   <h3 className="text-sm font-bold text-slate-700">Sebaran Pengeluaran</h3>
                   <div className="flex size-8 items-center justify-center bg-slate-50 border border-slate-100 rounded-full">
                     <Utensils className="size-4 text-slate-400" />
                   </div>
                </div>
                <div className="w-full flex-1 flex items-center justify-center min-h-[200px]">
                  <CategoryPieChart data={data.categoryData!} />
                </div>
              </div>

            {data.recentExpenses && data.recentExpenses.length > 0 && (
              <div className="premium-card overflow-hidden animate-fade-in-up flex flex-col h-[320px] sm:h-[300px] relative" style={{ animationDelay: '250ms' }}>
                <div className="bg-white p-5 flex justify-between items-center z-20 border-b border-slate-100 shrink-0">
                  <h3 className="text-sm font-bold text-slate-700">
                    Riwayat Terakhir
                  </h3>
                  <Link 
                    href="/history" 
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Lihat Semua
                  </Link>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1 pb-4">
                  {data.recentExpenses.map((exp) => {
                    const catStyle = getCategoryStyle(exp.category, data.customCategories);
                    const Icon = catStyle.Icon;
                    return (
                      <Link
                        key={exp.id}
                        href={`/history/${exp.id}`}
                        className="flex justify-between items-center px-4 py-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100/50 transition-colors group"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${catStyle.color}`}>
                            <Icon className="size-4.5" />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1 gap-1">
                            <p className="text-sm font-bold text-slate-800 leading-none truncate">
                              {catStyle.label}
                            </p>
                            <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                              <span className="whitespace-nowrap">{shortDateFormatter.format(exp.date)}</span>
                              {exp.source === 'QUICK_RECEIPT' && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full whitespace-nowrap">Nota</span>}
                              {exp.source === 'SPLIT_BILL' && <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">Split</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="text-sm font-bold text-slate-800 leading-none">
                            {idr.format(exp.totalAmount)}
                          </span>
                          <ChevronRight className="size-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
