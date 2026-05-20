import { prisma } from "@/lib/prisma";
import { SetBudgetForm } from "@/components/set-budget-form";
import { requireCurrentUserId } from "@/lib/auth";

const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "2-digit", year: "numeric" });
const monthLabelFormatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });

export default async function SettingsPage() {
  const userId = await requireCurrentUserId();
  const monthKey = monthFormatter.format(new Date());
  const monthLabel = monthLabelFormatter.format(new Date());

  const budget = await prisma.monthlyBudget.findUnique({
    where: { userId_month: { userId, month: monthKey } },
  });

  return (
    <SetBudgetForm
      currentLimit={budget?.limitAmount}
      monthLabel={monthLabel}
    />
  );
}
