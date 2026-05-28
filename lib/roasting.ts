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
 *      (expense-actions.ts & chat-actions.ts) atau saat roastLevel/persona berubah.
 *    - Membuka/menutup halaman tanpa perubahan expense → selalu pakai cache DB.
 *    - AI HANYA dipanggil ulang jika pengeluaran/level/persona berubah.
 *
 * 2. React.cache() (per-request memoization):
 *    - Dalam 1 render request, DB hanya di-query sekali meski fungsi dipanggil
 *      dari beberapa komponen berbeda.
 */

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { generateContentWithFallback } from "@/lib/ai-fallback";

export type RoastLevel = "MILD" | "MEDIUM" | "NUCLEAR";
export type RoastPersona = "DEFAULT" | "MAMA" | "SULTAN" | "TETANGGA" | "DOSEN";

const MAX_ROAST_SENTENCES = 2;
const MAX_ROAST_CHARS = 220;
const NUMBER_WORD_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bdua puluh satu ribu\b/gi, "Rp 21.000"],
  [/\bseratus ribu\b/gi, "Rp 100.000"],
  [/\bdua ratus ribu\b/gi, "Rp 200.000"],
  [/\btiga ratus ribu\b/gi, "Rp 300.000"],
  [/\bempat ratus ribu\b/gi, "Rp 400.000"],
  [/\blima ratus ribu\b/gi, "Rp 500.000"],
  [/\benam ratus ribu\b/gi, "Rp 600.000"],
  [/\btujuh ratus ribu\b/gi, "Rp 700.000"],
  [/\bdelapan ratus ribu\b/gi, "Rp 800.000"],
  [/\bsembilan ratus ribu\b/gi, "Rp 900.000"],
  [/\bsatu juta\b/gi, "Rp 1.000.000"],
  [/\bdua juta\b/gi, "Rp 2.000.000"],
  [/\btiga juta\b/gi, "Rp 3.000.000"],
  [/\bempat juta\b/gi, "Rp 4.000.000"],
  [/\blima juta\b/gi, "Rp 5.000.000"],
];

function truncateAtWord(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;

  const trimmed = value.slice(0, maxLength).trimEnd();
  const lastSpace = trimmed.lastIndexOf(" ");
  return `${trimmed.slice(0, lastSpace > 120 ? lastSpace : maxLength).trimEnd()}...`;
}

export function normalizeRoastText(raw: string) {
  let compact = raw
    .replace(/\s+/g, " ")
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .trim();

  if (!compact) return compact;

  for (const [pattern, replacement] of NUMBER_WORD_REPLACEMENTS) {
    compact = compact.replace(pattern, replacement);
  }

  const sentences = compact.match(/[^.!?。！？]+[.!?。！？]*/g) ?? [compact];
  const shortText = sentences.slice(0, MAX_ROAST_SENTENCES).join(" ").trim();
  return truncateAtWord(shortText, MAX_ROAST_CHARS);
}

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

/* ─── Persona definitions ─── */

interface PersonaDescriptor {
  /** Nama tampilan untuk UI */
  label: string;
  emoji: string;
  /** Karakter persona yang akan disisipkan ke dalam prompt */
  character: string;
  /** Contoh kalimat untuk priming gaya bicara */
  examples: string[];
}

export const ROAST_PERSONAS: Record<RoastPersona, PersonaDescriptor> = {
  DEFAULT: {
    label: "Default",
    emoji: "✨",
    character: "asisten keuangan personal yang sarkastik dan gaul tongkrongan Indonesia",
    examples: [
      "Bro, kopi 50rb tiap hari? Lo aplikasi keuangan apa ATM Starbucks?",
    ],
  },
  MAMA: {
    label: "Mama",
    emoji: "🧕",
    character:
      "ibu rumah tangga Indonesia yang protektif tapi sedikit nyinyir; selalu membandingkan pengeluaran user dengan harga bahan dapur, sering memanggil 'nak', dan suka kasih nostalgia 'mama dulu zaman muda...'",
    examples: [
      "Aduh nak, kopi 50 ribu? Mama bisa masak rendang seminggu lho segitu...",
      "Boba lagi boba lagi, mama dulu jajan es teh seribu rupiah aja udah seneng...",
    ],
  },
  SULTAN: {
    label: "Sultan",
    emoji: "💸",
    character:
      "konglomerat sok kaya yang menganggap pengeluaran user terlalu receh dan gak level; sering pakai istilah 'pegawai aku', 'family office', 'private jet', 'investasi receh segini'",
    examples: [
      "Receh banget pengeluaranmu, pegawai aku jajan lebih dari ini.",
      "200 ribu sebulan? Itu tip valet aku doang, bro.",
    ],
  },
  TETANGGA: {
    label: "Tetangga Julid",
    emoji: "🏘️",
    character:
      "tetangga ibu-ibu kompleks yang julid dan selalu update gosip; selalu membandingkan pengeluaran user dengan tetangga lain, mengaitkan dengan rumor terbaru, dan kepo banget",
    examples: [
      "Eh denger-denger Spotify-nya udah 6 bulan ya, tapi kemarin minta makan ke gua lho...",
      "Ibu Sari sebelah aja gak sebanyak ini jajannya, hus!",
    ],
  },
  DOSEN: {
    label: "Dosen Killer",
    emoji: "👨‍🏫",
    character:
      "dosen killer galak yang selalu mengaitkan pengeluaran dengan tugas akhir / IPK yang belum kelar; nada menghakimi seperti sedang sidang skripsi",
    examples: [
      "Tugas akhir aja belum kelar, udah ngabisin 800 ribu di Tokopedia? Sidang dulu baru jajan.",
      "Kamu yakin mau lulus tahun ini dengan track record belanja seperti ini?",
    ],
  },
};

export function buildRoastPrompt(
  summary: string,
  level: RoastLevel,
  persona: RoastPersona = "DEFAULT",
): string {
  const baseData =
    `ATURAN OUTPUT: maksimal 2 kalimat pendek, maksimal 35 kata total. ` +
    `Semua nominal uang WAJIB ditulis dengan angka format Rupiah, contoh "Rp 100.000", bukan "seratus ribu". ` +
    `Jangan pakai judul, bullet, markdown, atau tanda kutip.\n\n` +
    `Data keuangan user:\n${summary}`;
  const personaInfo = ROAST_PERSONAS[persona];

  const personaIntro =
    persona === "DEFAULT"
      ? ""
      : `\n\nKamu memerankan karakter "${personaInfo.label}": ${personaInfo.character}.\n` +
        `Gaya bicara harus konsisten dengan karakter tersebut. Contoh tone:\n` +
        personaInfo.examples.map((e) => `- "${e}"`).join("\n") +
        `\n\nTetap dalam karakter ini dari awal sampai akhir.`;

  switch (level) {
    case "MILD":
      return `Kamu adalah ${persona === "DEFAULT" ? "konsultan keuangan yang ramah, sopan, dan suportif" : personaInfo.character}.${personaIntro}
Berikan evaluasi pengeluaran user bulan ini dengan nada yang membangun — maksimal 2 kalimat pendek.
Gunakan bahasa Indonesia yang hangat dan tetap informatif, tapi tetap dalam karakter persona.
Tambahkan 1 emoji yang relevan di akhir.

${baseData}

Hanya kembalikan teks evaluasinya saja. Jangan pakai tanda kutip.`;

    case "MEDIUM":
      return `Kamu adalah ${personaInfo.character}.${personaIntro}
Roasting pengeluaran user bulan ini dengan SINGKAT — maksimal 2 kalimat pendek, langsung nusuk, tidak bertele-tele.
Gunakan bahasa Indonesia yang sarkastik tapi masih lucu dan konsisten dengan karakter persona di atas.

${baseData}

Hanya kembalikan teks isi roasting-nya saja. Jangan pakai tanda kutip.`;

    case "NUCLEAR":
      return `Kamu adalah ${personaInfo.character}, dalam mode paling savage dan tanpa empati sama sekali.${personaIntro}
Roasting pengeluaran user dengan level MAKSIMAL — blak-blakan, pedas, tidak ada basa-basi, tidak ada kata penyemangat.
Gunakan bahasa Indonesia yang keras, cerdas, menohok, tapi tetap dalam karakter persona di atas.
Maksimal 2-3 kalimat yang bikin malu. Jangan kasih saran baik-baik — cukup sampaikan kenyataan pahitnya saja dengan cara yang epic.

${baseData}

Hanya kembalikan teks isi roasting-nya saja. Jangan pakai tanda kutip.`;
  }
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
  async (
    userId: string,
    monthKey: string,
  ): Promise<{ text: string; level: RoastLevel; persona: RoastPersona }> => {
    // ── Layer 1: cek DB cache ──
    let currentLevel: RoastLevel = "MEDIUM";
    let currentPersona: RoastPersona = "DEFAULT";
    try {
      const budget = await prisma.monthlyBudget.findUnique({
        where: { userId_month: { userId, month: monthKey } },
        select: { latestRoast: true, roastLevel: true, roastPersona: true },
      });

      if (budget?.roastLevel) {
        currentLevel = budget.roastLevel as RoastLevel;
      }
      if (budget?.roastPersona) {
        currentPersona = budget.roastPersona as RoastPersona;
      }

      if (budget?.latestRoast) {
        // Cache hit → return langsung tanpa panggil AI sama sekali
        return { text: normalizeRoastText(budget.latestRoast), level: currentLevel, persona: currentPersona };
      }
    } catch {
      // Gagal baca DB → lanjut ke generate
    }

    // ── Layer 2: cache miss → generate AI ──
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        text: "Bentar, aku belum bisa mikir karena API key-nya belum dipasang. Kalau udah ada, ntar aku roasting kelakuan belanjamu bulan ini! 😎",
        level: currentLevel,
        persona: currentPersona,
      };
    }

    let summary: string;
    try {
      summary = await buildExpenseSummary(userId, monthKey);
    } catch {
      summary = "Gagal mengambil data pengeluaran.";
    }

    const prompt = buildRoastPrompt(summary, currentLevel, currentPersona);

    try {
      const res = await generateContentWithFallback({
        config: {},
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      const roast = normalizeRoastText(res.text);

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

      return { text: roast, level: currentLevel, persona: currentPersona };
    } catch {
      return {
        text: "Waduh, AI-nya lagi nge-blank karena bon kamu kebanyakan. Coba lagi bentar ya!",
        level: currentLevel,
        persona: currentPersona,
      };
    }
  },
);
