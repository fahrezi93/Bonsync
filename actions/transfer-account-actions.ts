"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type TransferAccountInput = {
  label: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

export type TransferAccountItem = TransferAccountInput & {
  id: string;
};

export type TransferAccountActionResult = {
  success: boolean;
  message: string;
};

function cleanText(value: string, maxLength: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanAccountNumber(value: string) {
  return value.trim().replace(/[^\d -]/g, "").replace(/\s+/g, " ").slice(0, 40);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function getTransferAccounts(): Promise<TransferAccountItem[]> {
  const userId = await auth();

  return prisma.$queryRaw<TransferAccountItem[]>`
    SELECT "id", "label", "bankName", "accountNumber", "accountHolder"
    FROM "TransferAccount"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" ASC
  `;
}

export async function addTransferAccount(
  input: TransferAccountInput,
): Promise<TransferAccountActionResult> {
  const userId = await auth();
  const label = cleanText(input.label, 40);
  const bankName = cleanText(input.bankName, 32);
  const accountNumber = cleanAccountNumber(input.accountNumber);
  const accountHolder = cleanText(input.accountHolder, 60);

  if (!label || !bankName || !accountNumber || !accountHolder) {
    return { success: false, message: "Lengkapi nama rekening, bank, nomor rekening, dan pemilik." };
  }

  try {
    await prisma.$executeRaw`
      INSERT INTO "TransferAccount" (
        "id",
        "userId",
        "label",
        "bankName",
        "accountNumber",
        "accountHolder",
        "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        ${userId},
        ${label},
        ${bankName},
        ${accountNumber},
        ${accountHolder},
        NOW()
      )
    `;

    revalidatePath("/scan");
    return { success: true, message: "Rekening berhasil disimpan." };
  } catch (error) {
    const message = getErrorMessage(error);
    if (message.includes("TransferAccount_userId_label_key")) {
      return { success: false, message: "Nama rekening ini sudah ada." };
    }

    return { success: false, message: `Gagal menyimpan rekening: ${message}` };
  }
}

export async function deleteTransferAccount(id: string): Promise<TransferAccountActionResult> {
  const userId = await auth();
  const accountId = id.trim();

  if (!accountId) {
    return { success: false, message: "Rekening tidak valid." };
  }

  try {
    const accounts = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "TransferAccount"
      WHERE "id" = ${accountId} AND "userId" = ${userId}
      LIMIT 1
    `;

    if (accounts.length === 0) {
      return { success: false, message: "Rekening tidak ditemukan." };
    }

    await prisma.$executeRaw`
      DELETE FROM "TransferAccount"
      WHERE "id" = ${accountId} AND "userId" = ${userId}
    `;

    revalidatePath("/scan");
    return { success: true, message: "Rekening berhasil dihapus." };
  } catch (error) {
    return { success: false, message: `Gagal menghapus rekening: ${getErrorMessage(error)}` };
  }
}
