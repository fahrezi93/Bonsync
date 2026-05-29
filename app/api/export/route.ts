import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { attachmentHeaders, buildExpenseExportWhere, buildExportFilename } from "@/lib/export-filters";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  QUICK_RECEIPT: "Foto Nota",
  SPLIT_BILL: "Split Bill",
};

function escapeCsvCell(value: string | number | boolean | null | undefined) {
  const raw = value == null ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

function toCsv(rows: Array<Array<string | number | boolean | null | undefined>>) {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

function compactText(value: string | null | undefined, maxLength = 120) {
  const clean = (value ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trimEnd()}…`;
}

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const expenses = await prisma.expense.findMany({
      where: buildExpenseExportWhere(userId, url),
      orderBy: { date: "desc" },
      select: {
        date: true,
        totalAmount: true,
        category: true,
        isSplitBill: true,
        aiAdvice: true,
        source: true,
        description: true,
        receipt: {
          select: {
            merchantName: true,
            mode: true,
            totalAmount: true,
          },
        },
      },
    });

    const rows = [
      [
        "Tanggal",
        "Kategori",
        "Sumber",
        "Split",
        "Nama",
        "Merchant",
        "Mode",
        "Total",
        "Dicatat",
        "AI",
      ],
      ...expenses.map((expense) => [
        dateFormatter.format(expense.date),
        expense.category,
        SOURCE_LABELS[expense.source] ?? expense.source,
        expense.isSplitBill ? "Ya" : "Tidak",
        compactText(expense.description, 40),
        expense.receipt?.merchantName ?? "",
        expense.receipt?.mode ?? "",
        expense.receipt?.totalAmount ? idr.format(expense.receipt.totalAmount) : "",
        idr.format(expense.totalAmount),
        compactText(expense.aiAdvice),
      ]),
    ];

    const filename = buildExportFilename(url, "csv");
    const csv = `\uFEFF${toCsv(rows)}\r\n`;

    return new Response(csv, {
      status: 200,
      headers: attachmentHeaders(filename, "text/csv; charset=utf-8"),
    });
  } catch (error) {
    console.error("[export/csv] Failed to create export", error);
    return new Response("Gagal membuat export CSV. Coba ulangi beberapa saat lagi.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
