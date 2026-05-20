"use server";

import { Type } from "@google/genai";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/auth";
import {
  computeParticipantSplit,
  computeReceiptTotals,
  sanitizeReceiptDraft,
  type SplitAssignments,
  type ReceiptDraft,
} from "@/lib/receipt-utils";

interface ExtractReceiptResult {
  success: boolean;
  message?: string;
  data?: ReceiptDraft;
}

interface SaveExpenseResult {
  success: boolean;
  message: string;
  category?: string;
  aiAdvice?: string;
}

const receiptSchema = {
  type: Type.OBJECT,
  properties: {
    isReceipt: { type: Type.BOOLEAN },
    merchantName: { type: Type.STRING },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          itemName: { type: Type.STRING },
          price: { type: Type.NUMBER },
        },
        required: ["itemName", "price"],
      },
    },
    discount: { type: Type.NUMBER },
    tax: { type: Type.NUMBER },
    serviceCharge: { type: Type.NUMBER },
  },
  required: ["isReceipt", "merchantName", "items", "discount", "tax", "serviceCharge"],
} as const;

const roastSchema = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING },
    aiAdvice: { type: Type.STRING },
  },
  required: ["category", "aiAdvice"],
} as const;

import { generateContentWithFallback } from "@/lib/ai-fallback";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseGeminiError(error: unknown): string {
  const fallback = error instanceof Error ? error.message : "Unknown AI error";
  const message = String((error as { message?: string })?.message ?? fallback);
  if (message.toLowerCase().includes("429") || message.toLowerCase().includes("resource_exhausted")) {
    return "Kuota Gemini sedang habis, coba lagi beberapa saat.";
  }
  if (message.toLowerCase().includes("api key") || message.toLowerCase().includes("permission_denied")) {
    return "API key Gemini tidak valid / belum punya akses model.";
  }
  return message;
}

async function generateWithGeminiModelFallback(params: {
  apiKey: string;
  config: Record<string, unknown>;
  contents: Array<{
    role: "user" | "model";
    parts: Array<Record<string, unknown>>;
  }>;
}): Promise<{ text: string; model: string }> {
  return generateContentWithFallback({
    config: params.config,
    contents: params.contents,
  });
}

async function classifyAndRoastExpense(
  amount: number,
  promptContext: string,
): Promise<{ category: string; aiAdvice: string; fallbackUsed: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      category: "OTHERS",
      aiAdvice: "Transaksi tercatat. AI lagi libur, tapi pengeluaranmu tetap kepantau.",
      fallbackUsed: true,
    };
  }

  try {
    const roastResponse = await generateWithGeminiModelFallback({
      apiKey,
      config: {
        responseMimeType: "application/json",
        responseSchema: roastSchema,
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                `${promptContext}\n` +
                `Total pengeluaran yang dicatat: ${formatRupiah(amount)}.\n` +
                "Kategorikan (FOOD/TRANSPORT/LIFESTYLE/HEALTH/ENTERTAINMENT/OTHERS) " +
                "dan beri aiAdvice 1-2 kalimat roasting/nasihat tajam bahasa Indonesia gaul.",
            },
          ],
        },
      ],
    });

    const parsed = JSON.parse(roastResponse.text) as { category?: string; aiAdvice?: string };
    return {
      category: parsed.category?.trim() || "OTHERS",
      aiAdvice: parsed.aiAdvice?.trim() || "Transaksi tercatat. Keep your budget tight.",
      fallbackUsed: false,
    };
  } catch {
    return {
      category: "OTHERS",
      aiAdvice: "Transaksi tercatat. AI sempat error, tapi budgeting-mu tetap lanjut.",
      fallbackUsed: true,
    };
  }
}

const ROAST_TIMEOUT_MS = 5_000;
const ROAST_FALLBACK = {
  category: "OTHERS",
  aiAdvice: "Tersimpan! AI lagi sibuk, kategori menyusul.",
  fallbackUsed: true,
};

/** Versi bergaransi cepat — maksimal 5 detik, lalu fallback */
async function classifyWithTimeout(
  amount: number,
  promptContext: string,
): Promise<{ category: string; aiAdvice: string; fallbackUsed: boolean }> {
  return Promise.race([
    classifyAndRoastExpense(amount, promptContext),
    new Promise<typeof ROAST_FALLBACK>((resolve) =>
      setTimeout(() => resolve(ROAST_FALLBACK), ROAST_TIMEOUT_MS),
    ),
  ]);
}


function revalidateExpensePages() {
  revalidatePath("/");
  revalidatePath("/history");
}

export async function extractReceiptDraft(formData: FormData): Promise<ExtractReceiptResult> {
  const file = formData.get("receipt") as File | null;
  if (!file || file.size === 0) {
    return { success: false, message: "File nota belum dipilih." };
  }
  if (!file.type.startsWith("image/")) {
    return { success: false, message: "File harus berupa gambar." };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: true,
      message: "AI belum aktif. Draft manual dibuka, isi nota secara manual ya.",
      data: {
        merchantName: "Unknown Merchant",
        items: [{ itemName: "Item 1", price: 0 }],
        discount: 0,
        tax: 0,
        serviceCharge: 0,
      },
    };
  }

  try {
    const imageBuffer = await file.arrayBuffer();
    const inlineBase64 = Buffer.from(imageBuffer).toString("base64");
    const response = await generateWithGeminiModelFallback({
      apiKey,
      config: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema,
        systemInstruction: [
            "Kamu adalah AI spesialis OCR nota/struk belanja.",
            "LANGKAH PERTAMA: Tentukan apakah gambar ini adalah struk/nota belanja yang valid.",
            "Set isReceipt=false jika gambar adalah: selfie, foto orang, foto makanan, pemandangan, meme, tangkapan layar chat, screenshot, atau apapun yang BUKAN struk/nota belanja fisik/digital.",
            "Set isReceipt=true HANYA jika ada bukti transaksi: daftar item, harga, nama toko, dan/atau total bayar.",
            "Jika isReceipt=false: isi merchantName='', items=[], discount=0, tax=0, serviceCharge=0.",
            "Jika isReceipt=true, ekstrak data ke JSON dengan aturan KETAT:",
            "1. merchantName: nama toko/restoran di nota.",
            "2. items[]: daftar item yang dibeli. Setiap item punya itemName (string) dan price (angka Rp, SEBELUM diskon/pajak).",
            "3. discount: TOTAL semua potongan/voucher/promo dalam Rp (angka positif). Jika tidak ada, isi 0.",
            "4. tax: TOTAL pajak (PPN/PPh) saja dalam Rp. Jika tidak ada, isi 0.",
            "5. serviceCharge: JUMLAHKAN SEMUA biaya tambahan selain pajak menjadi SATU angka: biaya layanan + biaya pengemasan + biaya admin + biaya pengiriman + biaya lain-lain. Jika tidak ada, isi 0.",
            "PENTING: Pastikan subtotal_items - discount + tax + serviceCharge = total yang tertera di nota.",
            "Semua nilai angka adalah number (bukan string).",
          ].join(" "),
      },
      contents: [
        {
          role: "user",
          parts: [
            { text: "Analisis gambar ini. Apakah ini struk/nota belanja? Jika ya, ekstrak datanya. Jika bukan, set isReceipt=false." },
            {
              inlineData: {
                mimeType: file.type,
                data: inlineBase64,
              },
            },
          ],
        },
      ],
    });

    const rawParsed = JSON.parse(response.text) as { isReceipt?: boolean } & Record<string, unknown>;

    // Deteksi bukan struk
    if (rawParsed.isReceipt === false) {
      return {
        success: false,
        message: "Aduh, ini kayaknya bukan foto struk deh! 🙈 Coba foto struk/nota belanja yang asli ya, biar aku bisa bacanya.",
      };
    }

    const parsed = sanitizeReceiptDraft(rawParsed);

    // Sanity check: kalau AI bilang isReceipt=true tapi data kosong banget, tolak juga
    if (parsed.items.length === 0 && !parsed.merchantName) {
      return {
        success: false,
        message: "Hmm, aku nggak nemu data struk di foto ini. Pastikan fotonya jelas dan itu beneran struk belanja ya! 📷",
      };
    }

    return { success: true, data: parsed };
  } catch (error) {
    const reason = parseGeminiError(error);
    const quotaIssue =
      reason.toLowerCase().includes("kuota") ||
      reason.toLowerCase().includes("resource_exhausted") ||
      reason.toLowerCase().includes("429");

    return {
      success: true,
      message: quotaIssue
        ? "Kuota Gemini sedang habis. Draft manual dibuka, kamu bisa isi itemnya sekarang."
        : `Gagal ekstrak AI (${reason}). Draft manual dibuka, silakan isi/edit nota.`,
      data: {
        merchantName: "Unknown Merchant",
        items: [{ itemName: "Item 1", price: 0 }],
        discount: 0,
        tax: 0,
        serviceCharge: 0,
      },
    };
  }
}

export async function saveQuickReceiptExpense(draftPayload: ReceiptDraft): Promise<SaveExpenseResult> {
  const userId = await requireCurrentUserId();
  const draft = sanitizeReceiptDraft(draftPayload);
  const totals = computeReceiptTotals(draft);

  if (draft.items.length === 0) {
    return { success: false, message: "Item nota kosong. Tambah minimal 1 item." };
  }
  if (totals.total <= 0) {
    return { success: false, message: "Total nota harus lebih dari 0." };
  }

  const roast = await classifyWithTimeout(
    totals.total,
    `Konteks transaksi: scan nota cepat dari merchant "${draft.merchantName}". ` +
      `Subtotal ${formatRupiah(totals.subtotal)}, potongan ${formatRupiah(totals.discount)}, ` +
      `tax+service ${formatRupiah(totals.extraCharges)}.`,
  );

  try {
    await prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.create({
        data: {
          userId,
          merchantName: draft.merchantName,
          subtotalAmount: totals.subtotal,
          discountAmount: totals.discount,
          taxAmount: draft.tax,
          serviceChargeAmount: draft.serviceCharge,
          totalAmount: totals.total,
          mode: "QUICK",
          items: {
            create: draft.items.map((item) => ({
              itemName: item.itemName,
              price: item.price,
              ownerType: "SELF",
            })),
          },
        },
      });

      await tx.expense.create({
        data: {
          userId,
          description: draft.merchantName,
          totalAmount: totals.total,
          category: roast.category,
          aiAdvice: roast.aiAdvice,
          isSplitBill: false,
          source: "QUICK_RECEIPT",
          receiptId: receipt.id,
        },
      });

      const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "2-digit", year: "numeric" });
      const monthKey = monthFormatter.format(new Date());
      await tx.monthlyBudget.updateMany({
        where: { userId, month: monthKey },
        data: { latestRoast: null },
      });
    });

    revalidateExpensePages();
    return {
      success: true,
      message: roast.fallbackUsed
        ? "Nota tersimpan. AI fallback dipakai untuk kategori/advice."
        : "Nota berhasil disimpan ke pengeluaranmu.",
      category: roast.category,
      aiAdvice: roast.aiAdvice,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Gagal menyimpan nota: ${msg}` };
  }
}

export async function saveSplitBillExpense(
  draftPayload: ReceiptDraft,
  assignments: SplitAssignments,
  selfName = "Saya",
): Promise<SaveExpenseResult> {
  const userId = await requireCurrentUserId();
  const draft = sanitizeReceiptDraft(draftPayload);
  const participantNames = Array.from(
    new Set(
      Object.values(assignments)
        .flat()
        .map((name) => String(name).trim())
        .filter(Boolean),
    ),
  );
  if (!participantNames.includes(selfName)) participantNames.unshift(selfName);
  const split = computeParticipantSplit(draft, participantNames, assignments);
  const selfLine = split.participants.find((p) => p.name === selfName);
  const selfShare = selfLine?.total ?? 0;

  if (draft.items.length === 0) {
    return { success: false, message: "Item nota kosong. Tambah minimal 1 item." };
  }
  if (split.unassignedIndexes.length > 0) {
    return { success: false, message: "Masih ada item yang belum punya pemilik." };
  }
  if (selfShare <= 0) {
    return { success: false, message: "Share kamu tidak valid." };
  }

  const roast = await classifyWithTimeout(
    selfShare,
    `Konteks transaksi: split bill dari merchant "${draft.merchantName}", hanya share user yang dicatat. ` +
      `Bagian user: subtotal ${formatRupiah(selfLine?.subtotal ?? 0)}, potongan ${formatRupiah(selfLine?.discountShare ?? 0)}, ` +
      `pajak ${formatRupiah(selfLine?.taxShare ?? 0)}, service ${formatRupiah(selfLine?.serviceShare ?? 0)}.`,
  );
  const fullTotal = split.fullTotal;

  try {
    await prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.create({
        data: {
          userId,
          merchantName: draft.merchantName,
          subtotalAmount: split.fullSubtotal,
          discountAmount: draft.discount,
          taxAmount: draft.tax,
          serviceChargeAmount: draft.serviceCharge,
          totalAmount: fullTotal,
          mode: "SPLIT",
          items: {
            create: draft.items.map((item, idx) => ({
              itemName: item.itemName,
              price: item.price,
              ownerType: (assignments[idx] ?? []).map((name) => String(name).trim()).includes(selfName)
                ? "SELF"
                : "OTHER",
            })),
          },
        },
      });

      await tx.expense.create({
        data: {
          userId,
          description: draft.merchantName,
          totalAmount: selfShare,
          category: roast.category,
          aiAdvice: roast.aiAdvice,
          isSplitBill: true,
          source: "SPLIT_BILL",
          receiptId: receipt.id,
        },
      });

      const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "2-digit", year: "numeric" });
      const monthKey = monthFormatter.format(new Date());
      await tx.monthlyBudget.updateMany({
        where: { userId, month: monthKey },
        data: { latestRoast: null },
      });
    });

    revalidateExpensePages();
    return {
      success: true,
      message: roast.fallbackUsed
        ? "Share tersimpan. AI fallback dipakai untuk kategori/advice."
        : "Share kamu berhasil disimpan.",
      category: roast.category,
      aiAdvice: roast.aiAdvice,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Gagal simpan split bill: ${msg}` };
  }
}

export interface ManualExpenseState {
  success: boolean;
  message: string;
}

export async function addManualExpense(
  _prevState: ManualExpenseState,
  formData: FormData,
): Promise<ManualExpenseState> {
  const userId = await requireCurrentUserId();
  const description = (formData.get("description") as string)?.trim();
  const amountRaw = formData.get("amount");
  const amount = Number(amountRaw);

  if (!description) {
    return { success: false, message: "Deskripsi pengeluaran tidak boleh kosong." };
  }
  if (!amountRaw || Number.isNaN(amount) || amount <= 0) {
    return { success: false, message: "Masukkan nominal yang valid (lebih dari 0)." };
  }

  const roast = await classifyWithTimeout(
    amount,
    `Konteks transaksi manual: "${description}".`,
  );

  try {
    await prisma.expense.create({
      data: {
        userId,
        description,
        totalAmount: amount,
        category: roast.category,
        aiAdvice: roast.aiAdvice,
        isSplitBill: false,
        source: "MANUAL",
      },
    });

    const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "2-digit", year: "numeric" });
    const monthKey = monthFormatter.format(new Date());
    await prisma.monthlyBudget.updateMany({
      where: { userId, month: monthKey },
      data: { latestRoast: null },
    });

    revalidateExpensePages();

    return {
      success: true,
      message: roast.fallbackUsed
        ? "Tersimpan! AI fallback dipakai untuk kategori/advice."
        : `✓ Tersimpan! Kategori: ${roast.category}.`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Gagal menyimpan: ${msg}` };
  }
}

export async function deleteExpense(id: string): Promise<{ success: boolean; message: string }> {
  const userId = await requireCurrentUserId();
  if (!id) return { success: false, message: "ID tidak valid." };
  try {
    const expense = await prisma.expense.findFirst({
      where: { id, userId },
      select: { id: true, date: true },
    });
    if (!expense) {
      return { success: false, message: "Pengeluaran tidak ditemukan." };
    }

    const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "2-digit", year: "numeric" });
    const expenseMonth = monthFormatter.format(expense.date);

    await prisma.$transaction([
      prisma.expense.delete({ where: { id } }),
      prisma.monthlyBudget.updateMany({
        where: { userId, month: expenseMonth },
        data: { latestRoast: null },
      }),
    ]);
    revalidateExpensePages();
    return { success: true, message: "Pengeluaran berhasil dihapus." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message: `Gagal menghapus: ${msg}` };
  }
}
