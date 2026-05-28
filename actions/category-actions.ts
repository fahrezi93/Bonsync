"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

type CategoryActionResult = {
  success: boolean;
  message: string;
  category?: Prisma.CategoryGetPayload<Record<string, never>>;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function isPredefinedCategoryName(name: string) {
  switch (name) {
    case "FOOD":
    case "TRANSPORT":
    case "LIFESTYLE":
    case "HEALTH":
    case "ENTERTAINMENT":
    case "OTHERS":
      return true;
    default:
      return false;
  }
}

export async function getUserCategories() {
  const userId = await auth();
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return categories;
}

export async function addCategory(
  name: string,
  color?: string,
  icon?: string,
): Promise<CategoryActionResult> {
  const userId = await auth();
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return { success: false, message: "Nama kategori tidak boleh kosong." };
  }

  if (isPredefinedCategoryName(trimmedName.toUpperCase())) {
    return { success: false, message: "Nama kategori ini sudah digunakan oleh sistem." };
  }

  try {
    const category = await prisma.category.create({
      data: {
        userId,
        name: trimmedName,
        color,
        icon,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/history");
    return { success: true, message: "Kategori berhasil ditambahkan.", category };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "Kategori dengan nama ini sudah ada." };
    }
    return { success: false, message: `Gagal menambahkan kategori: ${getErrorMessage(error)}` };
  }
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
  const userId = await auth();
  
  try {
    const category = await prisma.category.findFirst({
      where: { id, userId },
      select: { id: true, name: true },
    });

    if (!category) {
      return { success: false, message: "Kategori tidak ditemukan." };
    }

    await prisma.$transaction([
      prisma.expense.updateMany({
        where: { userId, category: category.name },
        data: { category: "OTHERS" },
      }),
      prisma.category.delete({
        where: { id: category.id },
      }),
      prisma.monthlyBudget.updateMany({
        where: { userId },
        data: { latestRoast: null },
      }),
    ]);

    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath("/history");
    return { success: true, message: "Kategori berhasil dihapus. Transaksi lama dipindahkan ke OTHERS." };
  } catch (error: unknown) {
    return { success: false, message: `Gagal menghapus kategori: ${getErrorMessage(error)}` };
  }
}

export async function updateCategory(
  id: string,
  name: string,
  color?: string,
  icon?: string,
): Promise<CategoryActionResult> {
  const userId = await auth();
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { success: false, message: "Nama kategori tidak boleh kosong." };
  }
  if (isPredefinedCategoryName(trimmedName.toUpperCase())) {
    return { success: false, message: "Nama kategori ini sudah digunakan oleh sistem." };
  }

  try {
    const existing = await prisma.category.findFirst({
      where: { id, userId },
      select: { id: true, name: true },
    });

    if (!existing) {
      return { success: false, message: "Kategori tidak ditemukan." };
    }

    const [category] = await prisma.$transaction([
      prisma.category.update({
        where: { id: existing.id },
        data: {
          name: trimmedName,
          color,
          icon,
        },
      }),
      prisma.expense.updateMany({
        where: { userId, category: existing.name },
        data: { category: trimmedName },
      }),
      prisma.monthlyBudget.updateMany({
        where: { userId },
        data: { latestRoast: null },
      }),
    ]);

    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath("/history");
    return { success: true, message: "Kategori berhasil diperbarui.", category };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "Kategori dengan nama ini sudah ada." };
    }
    return { success: false, message: `Gagal memperbarui kategori: ${getErrorMessage(error)}` };
  }
}
