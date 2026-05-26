"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ROAST_PERSONAS, type RoastPersona } from "@/lib/roasting";

const VALID_PERSONAS: ReadonlyArray<RoastPersona> = [
  "DEFAULT",
  "MAMA",
  "SULTAN",
  "TETANGGA",
  "DOSEN",
];

export async function setRoastPersona(
  persona: RoastPersona,
): Promise<{ success: boolean; message: string }> {
  if (!VALID_PERSONAS.includes(persona)) {
    return { success: false, message: "Persona tidak dikenali." };
  }

  const userId = await requireCurrentUserId();

  const monthFormatter = new Intl.DateTimeFormat("id-ID", {
    month: "2-digit",
    year: "numeric",
  });
  const monthKey = monthFormatter.format(new Date());

  try {
    await prisma.monthlyBudget.upsert({
      where: { userId_month: { userId, month: monthKey } },
      update: {
        roastPersona: persona,
        // Invalidate cached roast so it's regenerated dengan persona baru
        latestRoast: null,
      },
      create: {
        userId,
        month: monthKey,
        limitAmount: 0,
        roastPersona: persona,
        latestRoast: null,
      },
    });

    revalidatePath("/");
    revalidatePath("/settings");

    const meta = ROAST_PERSONAS[persona];
    return {
      success: true,
      message: `Persona AI diubah ke: ${meta.emoji} ${meta.label}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message: `Gagal simpan: ${msg}` };
  }
}
