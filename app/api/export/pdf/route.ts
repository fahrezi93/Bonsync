import PDFDocument from "pdfkit";
import { existsSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { attachmentHeaders, buildExpenseExportWhere, buildExportFilename } from "@/lib/export-filters";

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

const FONT_REGULAR = "Inter";
const FONT_BOLD = "Inter-Bold";

function collectPdfBuffer(doc: PDFKit.PDFDocument) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function registerFonts(doc: PDFKit.PDFDocument) {
  const regularPath = path.join(process.cwd(), "public", "fonts", "Inter-Regular.ttf");
  const boldPath = path.join(process.cwd(), "public", "fonts", "Inter-Bold.ttf");

  if (existsSync(regularPath) && existsSync(boldPath)) {
    doc.registerFont(FONT_REGULAR, regularPath);
    doc.registerFont(FONT_BOLD, boldPath);
    return { regular: FONT_REGULAR, bold: FONT_BOLD };
  }

  return { regular: "Helvetica", bold: "Helvetica-Bold" };
}

function drawMetric(
  doc: PDFKit.PDFDocument,
  fonts: { regular: string; bold: string },
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
) {
  doc
    .roundedRect(x, y, width, 58, 10)
    .fillAndStroke("#f8fafc", "#dbe4ee")
    .fillColor("#64748b")
    .font(fonts.bold)
    .fontSize(8)
    .text(label.toUpperCase(), x + 12, y + 12, { width: width - 24 })
    .fillColor("#0f172a")
    .font(fonts.bold)
    .fontSize(13)
    .text(value, x + 12, y + 30, { width: width - 24 });
}

function drawSectionTitle(doc: PDFKit.PDFDocument, fonts: { bold: string }, title: string) {
  doc
    .moveDown(0.8)
    .fillColor("#0f172a")
    .font(fonts.bold)
    .fontSize(13)
    .text(title)
    .moveDown(0.55);
}

function ensurePageSpace(doc: PDFKit.PDFDocument, neededHeight: number) {
  if (doc.y + neededHeight <= doc.page.height - doc.page.margins.bottom) return;
  doc.addPage();
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
      margin: 40,
      info: {
        Title: "Laporan Pengeluaran BonSync",
        Author: "BonSync",
      },
    });
    const bufferPromise = collectPdfBuffer(doc);
    const fonts = registerFonts(doc);
    const generatedAt = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());

    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc
      .roundedRect(doc.page.margins.left, 36, contentWidth, 92, 18)
      .fill("#0f172a")
      .fillColor("#ffffff")
      .font(fonts.bold)
      .fontSize(22)
      .text("Laporan Pengeluaran", doc.page.margins.left + 22, 58, { continued: true })
      .fillColor("#34d399")
      .text(" BonSync")
      .fillColor("#cbd5e1")
      .font(fonts.regular)
      .fontSize(9)
      .text(`Dibuat pada ${generatedAt}`, doc.page.margins.left + 22, 90, { width: 280 })
      .fillColor("#a7f3d0")
      .font(fonts.bold)
      .fontSize(9)
      .text(`${expenses.length} transaksi`, doc.page.margins.left + contentWidth - 130, 90, {
        width: 108,
        align: "right",
      });

    doc.y = 150;

    const metricWidth = (contentWidth - 20) / 3;
    const metricY = doc.y;
    drawMetric(doc, fonts, "Total Pengeluaran", idr.format(total), doc.page.margins.left, metricY, metricWidth);
    drawMetric(doc, fonts, "Jumlah Transaksi", `${expenses.length} transaksi`, doc.page.margins.left + metricWidth + 10, metricY, metricWidth);
    drawMetric(doc, fonts, "Split Bill", `${splitCount} transaksi`, doc.page.margins.left + (metricWidth + 10) * 2, metricY, metricWidth);

    doc.y = metricY + 70;
    drawSectionTitle(doc, fonts, "Kategori Terbesar");

    const maxCategoryAmount = topCategories[0]?.[1] ?? 0;
    if (topCategories.length === 0) {
      doc
        .fillColor("#64748b")
        .font(fonts.regular)
        .fontSize(10)
        .text("Belum ada transaksi untuk diekspor.");
    } else {
      for (const [category, amount] of topCategories) {
        const y = doc.y;
        const barWidth = maxCategoryAmount > 0 ? Math.max(36, (contentWidth - 170) * (amount / maxCategoryAmount)) : 0;
        doc
          .roundedRect(doc.page.margins.left, y, contentWidth, 36, 10)
          .fillAndStroke("#ffffff", "#dbe4ee")
          .roundedRect(doc.page.margins.left + 12, y + 21, barWidth, 5, 3)
          .fill("#10b981")
          .fillColor("#0f172a")
          .font(fonts.bold)
          .fontSize(9)
          .text(category, doc.page.margins.left + 12, y + 9, { width: 220 })
          .fillColor("#047857")
          .font(fonts.bold)
          .text(idr.format(amount), doc.page.margins.left + contentWidth - 150, y + 9, {
            width: 138,
            align: "right",
          });
        doc.y = y + 44;
      }
    }

    drawSectionTitle(doc, fonts, "Daftar Transaksi");

    const tableTop = doc.y;
    doc
      .roundedRect(doc.page.margins.left, tableTop, contentWidth, 24, 7)
      .fill("#fef3c7")
      .fillColor("#0f172a")
      .font(fonts.bold)
      .fontSize(8)
      .text("Tanggal", doc.page.margins.left + 12, tableTop + 8, { width: 78 })
      .text("Transaksi", doc.page.margins.left + 92, tableTop + 8, { width: 230 })
      .text("Kategori", doc.page.margins.left + 322, tableTop + 8, { width: 92 })
      .text("Nominal", doc.page.margins.left + contentWidth - 120, tableTop + 8, {
        width: 108,
        align: "right",
      });
    doc.y = tableTop + 32;

    for (const expense of expenses) {
      ensurePageSpace(doc, 42);
      const y = doc.y;
      const title = expense.description?.trim() || expense.receipt?.merchantName?.trim() || "Tanpa deskripsi";

      doc
        .moveTo(doc.page.margins.left, y + 35)
        .lineTo(doc.page.margins.left + contentWidth, y + 35)
        .lineWidth(0.5)
        .strokeColor("#e2e8f0")
        .stroke()
        .fillColor("#0f172a")
        .font(fonts.bold)
        .fontSize(9)
        .text(title, doc.page.margins.left + 92, y + 2, { width: 220, ellipsis: true })
        .fillColor("#64748b")
        .font(fonts.regular)
        .fontSize(7.5)
        .text(dateFormatter.format(expense.date), doc.page.margins.left + 12, y + 4, { width: 72 })
        .text(expense.source, doc.page.margins.left + 92, y + 17, { width: 130, ellipsis: true })
        .font(fonts.bold)
        .fontSize(8)
        .text(expense.category, doc.page.margins.left + 322, y + 8, { width: 92, ellipsis: true })
        .fillColor("#047857")
        .font(fonts.bold)
        .fontSize(9)
        .text(idr.format(expense.totalAmount), doc.page.margins.left + contentWidth - 120, y + 8, {
          width: 108,
          align: "right",
        });
      doc.y = y + 40;
    }

    doc.end();
    const buffer = await bufferPromise;
    const filename = buildExportFilename(url, "pdf");

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: attachmentHeaders(filename, "application/pdf"),
    });
  } catch (error) {
    console.error("[export/pdf] Failed to create export", error);
    return new Response("Gagal membuat export PDF. Coba ulangi beberapa saat lagi.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
