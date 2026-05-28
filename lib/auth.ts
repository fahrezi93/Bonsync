import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "2-digit", year: "numeric" });

export async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user.id;
}

export async function requireCurrentUserId() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  return userId;
}

export async function auth() {
  return requireCurrentUserId();
}

export async function requireOnboarding() {
  const userId = await requireCurrentUserId();

  const monthKey = monthFormatter.format(new Date());

  const budget = await prisma.monthlyBudget.findUnique({
    where: { userId_month: { userId, month: monthKey } },
  });

  if (!budget) {
    redirect("/onboarding");
  }

  return userId;
}
