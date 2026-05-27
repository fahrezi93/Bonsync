"use server";

import { Type } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireCurrentUserId } from "@/lib/auth";
import { buildRoastPrompt } from "@/lib/roasting";

/* ─── Types ─── */
export interface ChatMessage {
  role: "user" | "ai";
  content: string;
  pending?: boolean;   // AI belum konfirmasi simpan
  pendingExpense?: {
    description: string;
    amount: number;
  };
}

export interface ChatActionResult {
  aiReply: string;
  /** Ada expense yang menunggu konfirmasi user */
  pendingExpense?: {
    description: string;
    amount: number;
  };
}

export interface SaveChatExpenseResult {
  success: boolean;
  message: string;
}

import { generateContentWithFallback } from "@/lib/ai-fallback";

async function callGemini(prompt: string, schema?: object): Promise<string> {
  const res = await generateContentWithFallback({
    config: schema
      ? { responseMimeType: "application/json", responseSchema: schema }
      : {},
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  return res.text;
}

/* ─── Schema: intent classification ─── */
const intentSchema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      enum: ["expense", "roasting", "other"],
    },
    description: { type: Type.STRING },
    amount: { type: Type.NUMBER },
    reply: { type: Type.STRING },
  },
  required: ["intent", "reply"],
} as const;

/* ─── Main chat action ─── */
export async function processChatMessage(
  userText: string,
  expenseSummary: string,
  history: { role: string; content: string }[] = [],
): Promise<ChatActionResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      aiReply:
        "AI lagi offline (API key belum diset), tapi aku tetap siap dengerin curhatanmu 😅",
    };
  }

  const historyText = history
    .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
    .join("\n\n");

  const systemPrompt = `
Kamu adalah asisten keuangan personal yang sarkastik tapi helpful, bahasa gaul Indonesia.
Kamu punya 3 mode respons:

1. EXPENSE — kalau user laporan pengeluaran (contoh: "bayar parkir 2 ribu", "beli kopi 25rb"):
   - Extract description dan amount
   - Balas konfirmasi dulu, jangan langsung simpan
   - Contoh reply: "Parkir Rp 2.000 ya? Mau aku catat? (balas 'ya' atau 'iya')"

2. ROASTING — kalau user minta evaluasi/roasting pengeluaran:
   - Baca data pengeluaran bulan ini yang sudah dikasih
   - Beri respons sarkastik tapi informatif
   - intent: "roasting"

3. OTHER — pertanyaan umum lain atau obrolan nyambung dari sebelumnya
   - intent: "other"
   - Jawab seperlunya berdasarkan riwayat percakapan.

Data pengeluaran bulan ini:
${expenseSummary}

Riwayat Percakapan Sebelumnya:
${historyText || "Belum ada."}

PENTING:
- Kalau intent=expense, WAJIB isi field description (nama pengeluaran) dan amount (angka rupiah, tanpa simbol)
- Kalau user menjawab "ya"/"iya"/"yep"/"ok"/"sip" setelah konfirmasi sebelumnya, ini bukan expense baru
- Selalu balas dalam bahasa Indonesia gaul
`.trim();

  try {
    const raw = await callGemini(
      `${systemPrompt}\n\nUser: ${userText}`,
      intentSchema,
    );

    const parsed = JSON.parse(raw) as {
      intent: string;
      description?: string;
      amount?: number;
      reply: string;
    };

    if (
      parsed.intent === "expense" &&
      parsed.description &&
      parsed.amount &&
      parsed.amount > 0
    ) {
      return {
        aiReply: parsed.reply,
        pendingExpense: {
          description: parsed.description,
          amount: parsed.amount,
        },
      };
    }

    return { aiReply: parsed.reply || "Hm, aku nggak paham maksudnya." };
  } catch {
    return {
      aiReply:
        "Aduh, AI-ku lagi error bentar. Coba kirim lagi ya!",
    };
  }
}

/* ─── Save confirmed expense ─── */
export async function saveChatExpense(
  description: string,
  amount: number,
): Promise<SaveChatExpenseResult> {
  const userId = await requireCurrentUserId();
  if (!description || amount <= 0) {
    return { success: false, message: "Data pengeluaran tidak valid." };
  }

  // Simple classify without full roast for speed
  let category = "OTHERS";
  let aiAdvice = "Transaksi dicatat via chat.";

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const classifySchema = {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          aiAdvice: { type: Type.STRING },
        },
        required: ["category", "aiAdvice"],
      } as const;

      const raw = await callGemini(
        `Kategorikan pengeluaran "${description}" sebesar Rp ${amount.toLocaleString("id-ID")}.\n` +
          `Pilih dari: FOOD, TRANSPORT, LIFESTYLE, HEALTH, ENTERTAINMENT, OTHERS.\n` +
          `Beri aiAdvice 1 kalimat singkat sarkastik gaul Indonesia.`,
        classifySchema,
      );

      const parsed = JSON.parse(raw) as { category?: string; aiAdvice?: string };
      category = parsed.category?.trim() || "OTHERS";
      aiAdvice = parsed.aiAdvice?.trim() || aiAdvice;
    }
  } catch {
    // fallback silently
  }

  try {
    await prisma.expense.create({
      data: {
        userId,
        description,
        totalAmount: amount,
        category,
        aiAdvice,
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

    revalidatePath("/");
    revalidatePath("/history");

    return { success: true, message: `Sip, ${description} Rp ${amount.toLocaleString("id-ID")} udah dicatat!` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message: `Gagal simpan: ${msg}` };
  }
}

/* ─── Get expense summary for AI context ─── */
export async function getExpenseSummaryForChat(): Promise<string> {
  const userId = await requireCurrentUserId();

  try {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "2-digit", year: "numeric" });
    const monthKey = monthFormatter.format(new Date());

    const [budget, expenses] = await Promise.all([
      prisma.monthlyBudget.findUnique({ where: { userId_month: { userId, month: monthKey } } }),
      prisma.expense.findMany({
        where: { userId, date: { gte: monthStart } },
        orderBy: { date: "desc" },
        take: 20,
      }),
    ]);

    if (!budget) return "User belum set budget bulan ini.";

    const spent = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
    const remaining = Math.max(0, budget.limitAmount - spent);

    const lines = expenses
      .slice(0, 10)
      .map((e) => `- ${e.category}: Rp ${e.totalAmount.toLocaleString("id-ID")} (${e.aiAdvice ?? ""})`)
      .join("\n");

    return (
      `Budget bulan ini: Rp ${budget.limitAmount.toLocaleString("id-ID")}\n` +
      `Sudah dipakai: Rp ${spent.toLocaleString("id-ID")}\n` +
      `Sisa: Rp ${remaining.toLocaleString("id-ID")}\n\n` +
      `10 transaksi terakhir:\n${lines || "Belum ada transaksi."}`
    );
  } catch {
    return "Gagal mengambil data pengeluaran.";
  }
}

/* ── Generate Monthly Roasting (Server Action wrapper) ── */
// Dipanggil dari: AI Chat interface (saat user minta roasting manual)
// Untuk tampilan dashboard, gunakan getMonthlyRoasting() dari @/lib/roasting
// yang sudah menggunakan React.cache() untuk per-request memoization.
export async function generateMonthlyRoasting(): Promise<string> {
  const userId = await requireCurrentUserId();
  const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "2-digit", year: "numeric" });
  const monthKey = monthFormatter.format(new Date());

  // Cek cache DB dulu — hanya generate ulang jika latestRoast null
  // (latestRoast di-null-kan saat ada expense baru/dihapus)
  let cachedBudget: { latestRoast: string | null; roastLevel: string; roastPersona: string } | null = null;
  try {
    cachedBudget = await prisma.monthlyBudget.findUnique({
      where: { userId_month: { userId, month: monthKey } },
      select: { latestRoast: true, roastLevel: true, roastPersona: true },
    });
    if (cachedBudget?.latestRoast) {
      return cachedBudget.latestRoast;
    }
  } catch {
    // Gagal baca DB → lanjut generate
  }

  const summary = await getExpenseSummaryForChat();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return "Bentar, aku belum bisa mikir karena API key-nya belum dipasang. Kalau udah ada, ntar aku roasting kelakuan belanjamu bulan ini! 😎";
  }

  const prompt = buildRoastPrompt(
    summary,
    (cachedBudget?.roastLevel as "MILD" | "MEDIUM" | "NUCLEAR") ?? "MEDIUM",
    (cachedBudget?.roastPersona as "DEFAULT" | "MAMA" | "SULTAN" | "TETANGGA" | "DOSEN") ?? "DEFAULT",
  );

  try {
    const reply = await callGemini(prompt);
    const roast = reply.trim();

    // Simpan ke DB supaya request berikutnya tidak generate ulang
    try {
      await prisma.monthlyBudget.upsert({
        where: { userId_month: { userId, month: monthKey } },
        update: { latestRoast: roast },
        create: { userId, month: monthKey, limitAmount: 0, latestRoast: roast },
      });
    } catch {
      // Gagal tulis cache → tidak masalah
    }

    return roast;
  } catch {
    return "Waduh, AI-nya lagi nge-blank karena bon kamu kebanyakan. Coba lagi bentar ya!";
  }
}
