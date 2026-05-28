"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ROAST_PERSONAS, type RoastPersona } from "@/lib/roasting";

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "2-digit",
  year: "numeric",
});

function isRoastPersona(persona: RoastPersona): boolean {
  return (
    persona === "DEFAULT" ||
    persona === "MAMA" ||
    persona === "SULTAN" ||
    persona === "TETANGGA" ||
    persona === "DOSEN"
  );
}

export async function setRoastPersona(
  persona: RoastPersona,
): Promise<{ success: boolean; message: string }> {
  const userId = await auth();

  if (!isRoastPersona(persona)) {
    return { success: false, message: "Persona tidak dikenali." };
  }

  const monthKey = monthFormatter.format(new Date());

  try {
    const existing = await prisma.monthlyBudget.findUnique({
      where: { userId_month: { userId, month: monthKey } },
      select: { roastPersona: true },
    });
    const shouldRegenerateRoast = existing?.roastPersona !== persona;

    await prisma.monthlyBudget.upsert({
      where: { userId_month: { userId, month: monthKey } },
      update: {
        roastPersona: persona,
        ...(shouldRegenerateRoast ? { latestRoast: null } : {}),
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
