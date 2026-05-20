/**
 * lib/roasting.ts
 *
 * Helper untuk mengambil teks roasting AI di dashboard.
 * Bukan Server Action — file ini bisa menggunakan React.cache() dengan benar.
 *
 * STRATEGI CACHE (2 lapis):
 *
 * 1. DB cache (kolom latestRoast di MonthlyBudget):
 *    - Roast disimpan ke DB setelah berhasil di-generate.
 *    - latestRoast di-null-kan HANYA saat ada expense baru/dihapus
 *      (expense-actions.ts & chat-actions.ts).
 *    - Membuka/menutup halaman tanpa perubahan expense → selalu pakai cache DB.
 *    - AI HANYA dipanggil ulang jika pengeluaran berubah.
 *
 * 2. React.cache() (per-request memoization):
 *    - Dalam 1 render request, DB hanya di-query sekali meski fungsi dipanggil
 *      dari beberapa komponen berbeda.
 */

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { generateContentWithFallback } from "@/lib/ai-fallback";

async function buildExpenseSummary(userId: string, monthKey: string): Promise<string> {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [budget, expenses] = await Promise.all([
    prisma.monthlyBudget.findUnique({
      where: { userId_month: { userId, month: monthKey } },
    }),
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
}

/**
 * Ambil teks roasting untuk user bulan ini.
 *
 * - Cache hit (latestRoast ada di DB) → return langsung, 0 AI call.
 * - Cache miss (latestRoast null) → generate AI 1x, simpan ke DB.
 *
 * Dibungkus React.cache() supaya per-request hanya 1x eksekusi.
 */
export const getMonthlyRoasting = cache(
  async (userId: string, monthKey: string): Promise<string> => {
    // ── Layer 1: cek DB cache ──
    try {
      const budget = await prisma.monthlyBudget.findUnique({
        where: { userId_month: { userId, month: monthKey } },
        select: { latestRoast: true },
      });

      if (budget?.latestRoast) {
        // Cache hit → return langsung tanpa panggil AI sama sekali
        return budget.latestRoast;
      }
    } catch {
      // Gagal baca DB → lanjut ke generate
    }

    // ── Layer 2: cache miss → generate AI ──
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return "Bentar, aku belum bisa mikir karena API key-nya belum dipasang. Kalau udah ada, ntar aku roasting kelakuan belanjamu bulan ini! 😎";
    }

    let summary: string;
    try {
      summary = await buildExpenseSummary(userId, monthKey);
    } catch {
      summary = "Gagal mengambil data pengeluaran.";
    }

    const prompt = `Kamu adalah asisten keuangan personal yang sarkastik dan gaul tongkrongan Indonesia.
Roasting pengeluaran user bulan ini dengan SINGKAT — maksimal 2 kalimat pendek, langsung nusuk, tidak bertele-tele.

Data keuangan user:
${summary}

Hanya kembalikan teks isi roasting-nya saja. Jangan pakai tanda kutip.`;

    try {
      const res = await generateContentWithFallback({
        config: {},
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      const roast = res.text.trim();

      // Simpan ke DB supaya request berikutnya tidak generate ulang
      try {
        await prisma.monthlyBudget.upsert({
          where: { userId_month: { userId, month: monthKey } },
          update: { latestRoast: roast },
          create: { userId, month: monthKey, limitAmount: 0, latestRoast: roast },
        });
      } catch {
        // Gagal tulis cache → tidak masalah, roast tetap ditampilkan
      }

      return roast;
    } catch {
      return "Waduh, AI-nya lagi nge-blank karena bon kamu kebanyakan. Coba lagi bentar ya!";
    }
  }
);
