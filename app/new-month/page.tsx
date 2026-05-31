import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { NewMonthFlow } from "@/components/new-month-flow";

import { monthLabelFormatter } from "@/lib/date-utils";

export default async function NewMonthPage() {
  const userId = await getCurrentUserId();

  // Belum login → ke login
  if (!userId) {
    redirect("/login");
  }

  const monthLabel = monthLabelFormatter.format(new Date());

  return <NewMonthFlow monthLabel={monthLabel} />;
}
