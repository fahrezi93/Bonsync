"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export interface BudgetActionState {
  success: boolean;
  message: string;
  submittedLimit?: number;
}

import { monthFormatter } from "@/lib/date-utils";

const MAX_BUDGET = 1_000_000_000;

function parseBudgetInput(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string") return null;

  const digitsOnly = raw.replace(/\D/g, "");
  if (!digitsOnly) return null;

  const parsed = Number.parseInt(digitsOnly, 10);
  if (!Number.isSafeInteger(parsed)) return null;

  return parsed;
}

export async function setBudget(
  _prevState: BudgetActionState,
  formData: FormData
): Promise<BudgetActionState> {
  const userId = await auth();
  const raw = formData.get("limitAmount");
  const limit = parseBudgetInput(raw);

  if (!limit || limit <= 0) {
    return { success: false, message: "Masukkan nominal budget yang valid (lebih dari 0)." };
  }
  if (limit > MAX_BUDGET) {
    return { success: false, message: "Budget terlalu besar. Maksimal Rp 1.000.000.000." };
  }

  const monthKey = monthFormatter.format(new Date());

  try {
    const existing = await prisma.monthlyBudget.findUnique({
      where: { userId_month: { userId, month: monthKey } },
      select: { limitAmount: true },
    });
    
    // Cari budget bulan sebelumnya untuk mewarisi setelan AI
    const previousBudget = await prisma.monthlyBudget.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { roastLevel: true, roastPersona: true }
    });

    const shouldRegenerateRoast = existing?.limitAmount !== limit;
    
    const roastLevel = previousBudget?.roastLevel ?? "MEDIUM";
    const roastPersona = previousBudget?.roastPersona ?? "DEFAULT";

    await prisma.monthlyBudget.upsert({
      where: { userId_month: { userId, month: monthKey } },
      update: {
        limitAmount: limit,
        ...(shouldRegenerateRoast ? { latestRoast: null } : {}),
      },
      create: { 
        userId, 
        month: monthKey, 
        limitAmount: limit, 
        latestRoast: null,
        roastLevel,
        roastPersona
      },
    });

    revalidatePath("/");
    revalidatePath("/settings");

    return {
      success: true,
      message: `Budget bulan ini berhasil diset ke Rp ${limit.toLocaleString("id-ID")}.`,
      submittedLimit: limit,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message: `Gagal menyimpan budget: ${msg}` };
  }
}

import { cookies } from "next/headers";

export async function skipBudgetSetup() {
  const monthKey = monthFormatter.format(new Date());
  // Set cookie for 24 hours
  const cookieStore = await cookies();
  cookieStore.set(`skip_budget_${monthKey}`, "true", { 
    maxAge: 60 * 60 * 24 
  });
  revalidatePath("/");
}
