import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function collectPdfBuffer(doc: PDFKit.PDFDocument) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function drawMetric(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
) {
  doc
    .roundedRect(x, y, width, 58, 10)
    .fillAndStroke("#f8fafc", "#e2e8f0")
    .fillColor("#64748b")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(label.toUpperCase(), x + 12, y + 12, { width: width - 24 })
    .fillColor("#0f172a")
    .fontSize(13)
    .text(value, x + 12, y + 30, { width: width - 24 });
}

function ensurePageSpace(doc: PDFKit.PDFDocument, neededHeight: number) {
  if (doc.y + neededHeight <= doc.page.height - doc.page.margins.bottom) return;
  doc.addPage();
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
      source: true,
      description: true,
      isSplitBill: true,
      receipt: {
        select: {
          merchantName: true,
        },
      },
    },
  });

  const total = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
  const splitCount = expenses.filter((expense) => expense.isSplitBill).length;
  const categoryTotals = new Map<string, number>();
  for (const expense of expenses) {
    categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + expense.totalAmount);
  }

  const topCategories = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const doc = new PDFDocument({
    size: "A4",
    margin: 42,
    info: {
      Title: "Laporan Pengeluaran BonSync",
      Author: "BonSync",
    },
  });
  const bufferPromise = collectPdfBuffer(doc);
  const generatedAt = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  doc
    .fillColor("#0f172a")
    .font("Helvetica-Bold")
    .fontSize(22)
    .text("Laporan Pengeluaran", { align: "left" })
    .fillColor("#10b981")
    .text("BonSync", { continued: false })
    .moveDown(0.35)
    .fillColor("#64748b")
    .font("Helvetica")
    .fontSize(10)
    .text(`Dibuat pada ${generatedAt}`, { width: 360 })
    .moveDown(1.2);

  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const metricWidth = (contentWidth - 20) / 3;
  const metricY = doc.y;
  drawMetric(doc, "Total Pengeluaran", idr.format(total), doc.page.margins.left, metricY, metricWidth);
  drawMetric(doc, "Jumlah Transaksi", `${expenses.length} transaksi`, doc.page.margins.left + metricWidth + 10, metricY, metricWidth);
  drawMetric(doc, "Split Bill", `${splitCount} transaksi`, doc.page.margins.left + (metricWidth + 10) * 2, metricY, metricWidth);

  doc.y = metricY + 82;
  doc
    .fillColor("#0f172a")
    .font("Helvetica-Bold")
    .fontSize(13)
    .text("Kategori Terbesar")
    .moveDown(0.6);

  if (topCategories.length === 0) {
    doc
      .fillColor("#64748b")
      .font("Helvetica")
      .fontSize(10)
      .text("Belum ada transaksi untuk diekspor.");
  } else {
    for (const [category, amount] of topCategories) {
      const y = doc.y;
      doc
        .roundedRect(doc.page.margins.left, y, contentWidth, 28, 8)
        .fillAndStroke("#ffffff", "#e2e8f0")
        .fillColor("#0f172a")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(category, doc.page.margins.left + 12, y + 9, { width: 230 })
        .fillColor("#047857")
        .text(idr.format(amount), doc.page.margins.left + contentWidth - 170, y + 9, {
          width: 158,
          align: "right",
        });
      doc.y = y + 34;
    }
  }

  doc.moveDown(0.8);
  doc
    .fillColor("#0f172a")
    .font("Helvetica-Bold")
    .fontSize(13)
    .text("Daftar Transaksi")
    .moveDown(0.6);

  for (const expense of expenses) {
    ensurePageSpace(doc, 54);
    const y = doc.y;
    const title = expense.description?.trim() || expense.receipt?.merchantName?.trim() || "Tanpa deskripsi";

    doc
      .roundedRect(doc.page.margins.left, y, contentWidth, 44, 8)
      .fillAndStroke("#ffffff", "#e2e8f0")
      .fillColor("#0f172a")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(title, doc.page.margins.left + 12, y + 9, { width: 260, ellipsis: true })
      .fillColor("#64748b")
      .font("Helvetica")
      .fontSize(8)
      .text(`${dateFormatter.format(expense.date)}  |  ${expense.category}  |  ${expense.source}`, doc.page.margins.left + 12, y + 25, {
        width: 320,
      })
      .fillColor("#047857")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(idr.format(expense.totalAmount), doc.page.margins.left + contentWidth - 150, y + 16, {
        width: 138,
        align: "right",
      });
    doc.y = y + 52;
  }

  doc.end();
  const buffer = await bufferPromise;
  const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });
  const monthName = monthFormatter.format(new Date()).replace(/\s+/g, "-");

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="BonSync-Export-${monthName}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
