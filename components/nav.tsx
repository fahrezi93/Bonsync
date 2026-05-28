import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopNavLinks } from "@/components/desktop-nav-links";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { prisma } from "@/lib/prisma";
import { getProfileMetadata, getSignedAvatarUrl } from "@/lib/profile";

const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "2-digit", year: "numeric" });

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is authenticated, fetch their current budget data and monthly expenses
  let budgetLimit = 0;
  let spent = 0;
  let remaining = 0;
  let survivalScore = 100;
  let displayName = "";
  let avatarUrl: string | null = null;

  if (user) {
    const profile = getProfileMetadata({
      email: user.email,
      user_metadata: user.user_metadata,
    });
    displayName = profile.displayName;
    avatarUrl = await getSignedAvatarUrl(profile.avatarPath);

    const monthKey = monthFormatter.format(new Date());
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [budget, expenses] = await Promise.all([
      prisma.monthlyBudget.findUnique({ where: { userId_month: { userId: user.id, month: monthKey } } }),
      prisma.expense.findMany({
        where: { userId: user.id, date: { gte: monthStart } },
        select: { totalAmount: true },
      }),
    ]);

    budgetLimit = budget?.limitAmount ?? 0;
    spent = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
    remaining = Math.max(0, budgetLimit - spent);
    survivalScore = budgetLimit > 0 ? (remaining / budgetLimit) * 100 : 0;
  }

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-200/40 shadow-[0_2px_20px_rgba(0,0,0,0.015)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-1.5 group select-none">
            <span className="text-[18px] font-black tracking-tight text-slate-800">
              Bon<span className="text-emerald-500 transition-colors group-hover:text-emerald-600">Sync</span>
            </span>
          </Link>

          {user && (
            <div className="flex items-center gap-4">
              <DesktopNavLinks />

              <div className="hidden md:block w-px h-5 bg-slate-200/60" />

              {/* Dynamic Interactive Profile Dropdown Card */}
              <ProfileDropdown
                userEmail={user.email ?? ""}
                displayName={displayName}
                avatarUrl={avatarUrl}
                budgetLimit={budgetLimit}
                spent={spent}
                remaining={remaining}
                survivalScore={survivalScore}
              />
            </div>
          )}
        </div>
      </header>
      
      {/* Show bottom nav only on mobile/tablet */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </>
  );
}


