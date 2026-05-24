import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function escapeCsvCell(value: string | number | boolean | null | undefined) {
  const raw = value == null ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

function toCsv(rows: Array<Array<string | number | boolean | null | undefined>>) {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

export async function GET() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const expenses = await prisma.expense.findMany({
    where: { userId },
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
      "Split Bill",
      "Nama/Deskripsi",
      "Merchant",
      "Mode Nota",
      "Total Nota",
      "Nominal Dicatat",
      "Teguran AI",
    ],
    ...expenses.map((expense) => [
      dateFormatter.format(expense.date),
      expense.category,
      expense.source,
      expense.isSplitBill ? "Ya" : "Tidak",
      expense.description ?? "",
      expense.receipt?.merchantName ?? "",
      expense.receipt?.mode ?? "",
      expense.receipt?.totalAmount ?? "",
      expense.totalAmount,
      expense.aiAdvice,
    ]),
  ];

  const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });
  const monthName = monthFormatter.format(new Date()).replace(/\s+/g, "-");
  const filename = `BonSync-Export-${monthName}.csv`;
  const csv = `\uFEFF${toCsv(rows)}\r\n`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
