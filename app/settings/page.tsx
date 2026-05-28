import { prisma } from "@/lib/prisma";
import { SetBudgetForm } from "@/components/set-budget-form";
import { RoastLevelSelector } from "@/components/roast-level-selector";
import { RoastPersonaSelector } from "@/components/roast-persona-selector";
import { requireOnboarding } from "@/lib/auth";
import type { RoastLevel, RoastPersona } from "@/lib/roasting";
import { createClient } from "@/utils/supabase/server";
import { getProfileMetadata, getSignedAvatarUrl } from "@/lib/profile";
import { ProfileSettingsForm } from "@/components/profile-settings-form";

import { CustomCategoryManager } from "@/components/custom-category-manager";
import { getUserCategories } from "@/actions/category-actions";

const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "2-digit", year: "numeric" });
const monthLabelFormatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });

export default async function SettingsPage() {
  const userId = await requireOnboarding();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const monthKey = monthFormatter.format(new Date());
  const monthLabel = monthLabelFormatter.format(new Date());
  const profile = getProfileMetadata({
    email: user?.email,
    user_metadata: user?.user_metadata,
  });
  const avatarUrl = await getSignedAvatarUrl(profile.avatarPath);

  const [budget, categories] = await Promise.all([
    prisma.monthlyBudget.findUnique({
      where: { userId_month: { userId, month: monthKey } },
      select: { limitAmount: true, roastLevel: true, roastPersona: true },
    }),
    getUserCategories(),
  ]);

  const currentRoastLevel: RoastLevel = (budget?.roastLevel as RoastLevel) ?? "MEDIUM";
  const currentRoastPersona: RoastPersona = (budget?.roastPersona as RoastPersona) ?? "DEFAULT";

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 pb-32 md:pb-16 flex flex-col gap-8 flex-1 min-h-0 overflow-y-auto hide-scrollbar animate-fade-in-up">
      {/* Page Header */}
      <div className="border-b border-slate-200/50 pb-5">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">
          Profil Saya
        </h1>
        <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">
          Kelola informasi profil, preferensi budget, kategori kustom, dan AI BonSync.
        </p>
      </div>

      <ProfileSettingsForm
        userId={userId}
        email={user?.email ?? ""}
        displayName={profile.displayName}
        avatarPath={profile.avatarPath}
        avatarUrl={avatarUrl}
      />

      {/* Grid Layout: Side-by-Side on Desktop, Stacked on Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Budget Setting Card */}
        <div className="w-full flex flex-col animate-fade-in-up" style={{ animationDelay: "50ms" }}>
          <SetBudgetForm
            currentLimit={budget?.limitAmount}
            monthLabel={monthLabel}
          />
        </div>

        {/* Roast Level Setting Card */}
        <div className="w-full flex flex-col animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <RoastLevelSelector currentLevel={currentRoastLevel} />
        </div>
      </div>

      {/* Persona Selector — full-width on its own row, banyak konten */}
      <div className="w-full animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        <RoastPersonaSelector currentPersona={currentRoastPersona} />
      </div>

      {/* Custom Categories Manager */}
      <div className="w-full">
        <CustomCategoryManager categories={categories} />
      </div>
    </div>
  );
}
