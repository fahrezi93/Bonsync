"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/auth";

export interface BudgetActionState {
  success: boolean;
  message: string;
  submittedLimit?: number;
}

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "2-digit",
  year: "numeric",
});

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
  const raw = formData.get("limitAmount");
  const limit = parseBudgetInput(raw);

  if (!limit || limit <= 0) {
    return { success: false, message: "Masukkan nominal budget yang valid (lebih dari 0)." };
  }
  if (limit > MAX_BUDGET) {
    return { success: false, message: "Budget terlalu besar. Maksimal Rp 1.000.000.000." };
  }

  const monthKey = monthFormatter.format(new Date());
  const userId = await requireCurrentUserId();

  try {
    await prisma.monthlyBudget.upsert({
      where: { userId_month: { userId, month: monthKey } },
      update: { limitAmount: limit, latestRoast: null },
      create: { userId, month: monthKey, limitAmount: limit, latestRoast: null },
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
