import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

function escapeCsv(value: string | number | boolean): string {
  const str = String(value);
  if (str.includes(",") || str.includes("\n") || str.includes("\"")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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
      id: true,
      date: true,
      totalAmount: true,
      category: true,
      isSplitBill: true,
      aiAdvice: true,
      source: true,
      receiptId: true,
    },
  });

  const headers = ["id", "date", "totalAmount", "category", "isSplitBill", "source", "receiptId", "aiAdvice"];
  const rows = expenses.map((e) =>
    [
      escapeCsv(e.id),
      escapeCsv(e.date.toISOString()),
      escapeCsv(e.totalAmount),
      escapeCsv(e.category),
      escapeCsv(e.isSplitBill),
      escapeCsv(e.source),
      escapeCsv(e.receiptId ?? ""),
      escapeCsv(e.aiAdvice),
    ].join(","),
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dompetai-expenses.csv"`,
    },
  });
}
