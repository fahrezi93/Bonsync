import type { Prisma } from "@prisma/client";

export function parseMonthRange(monthKey: string): { gte: Date; lt: Date } | null {
  const match = monthKey.match(/^(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const month = parseInt(match[1], 10) - 1;
  const year = parseInt(match[2], 10);
  return { gte: new Date(year, month, 1), lt: new Date(year, month + 1, 1) };
}

export function buildExpenseExportWhere(userId: string, url: URL): Prisma.ExpenseWhereInput {
  const category = url.searchParams.get("category")?.trim() ?? "";
  const month = url.searchParams.get("month")?.trim() ?? "";
  const where: Prisma.ExpenseWhereInput = { userId };

  if (category) where.category = category;

  const dateRange = month ? parseMonthRange(month) : null;
  if (dateRange) where.date = dateRange;

  return where;
}

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
});

function sanitizeFilenamePart(value: string) {
  return value
    .trim()
    .replace(/[^\w\s.-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildExportFilename(url: URL, extension: "csv" | "pdf") {
  const month = url.searchParams.get("month")?.trim() ?? "";
  const category = url.searchParams.get("category")?.trim() ?? "";
  const dateRange = month ? parseMonthRange(month) : null;
  const monthName = monthFormatter.format(dateRange?.gte ?? new Date());
  const parts = ["BonSync-Export", monthName, category].map(sanitizeFilenamePart).filter(Boolean);

  return `${parts.join("-")}.${extension}`;
}

export function attachmentHeaders(filename: string, contentType: string) {
  const asciiFilename = filename.replace(/[^\w.-]/g, "-");
  const encodedFilename = encodeURIComponent(filename);

  return {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
    "Cache-Control": "private, no-store",
  };
}
