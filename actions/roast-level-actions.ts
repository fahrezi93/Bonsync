"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type RoastLevel = "MILD" | "MEDIUM" | "NUCLEAR";

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "2-digit",
  year: "numeric",
});

export async function setRoastLevel(level: RoastLevel): Promise<{ success: boolean; message: string }> {
  const userId = await auth();

  const monthKey = monthFormatter.format(new Date());

  try {
    const existing = await prisma.monthlyBudget.findUnique({
      where: { userId_month: { userId, month: monthKey } },
      select: { roastLevel: true },
    });
    const shouldRegenerateRoast = existing?.roastLevel !== level;

    await prisma.monthlyBudget.upsert({
      where: { userId_month: { userId, month: monthKey } },
      update: {
        roastLevel: level,
        ...(shouldRegenerateRoast ? { latestRoast: null } : {}),
      },
      create: {
        userId,
        month: monthKey,
        limitAmount: 0,
        roastLevel: level,
        latestRoast: null,
      },
    });

    revalidatePath("/");
    revalidatePath("/settings");

    const labels: Record<RoastLevel, string> = {
      MILD: "Sopan 🥦",
      MEDIUM: "Pedas Sedang 🔥",
      NUCLEAR: "Nuklir 💀",
    };

    return { success: true, message: `Level kepedasan diubah ke: ${labels[level]}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message: `Gagal simpan: ${msg}` };
  }
}
