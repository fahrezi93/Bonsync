"use client";

import { useState } from "react";
import { Download, Loader2, FileText } from "lucide-react";

interface ExportButtonProps {
  href: string;
  label: string;
  loadingLabel: string;
  variant: "outline" | "solid";
  icon: "csv" | "pdf";
  fallbackFilename: string;
  onError: (message: string) => void;
}

function getDownloadFilename(response: Response, fallbackFilename: string) {
  const header = response.headers.get("Content-Disposition") ?? "";
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);

  const filenameMatch = header.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] ?? fallbackFilename;
}

async function downloadFile(href: string, fallbackFilename: string) {
  const response = await fetch(href, { credentials: "same-origin" });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Export gagal dengan status ${response.status}.`);
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error("File export kosong.");
  }

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = getDownloadFilename(response, fallbackFilename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function ExportButton({
  href,
  label,
  loadingLabel,
  variant,
  icon,
  fallbackFilename,
  onError,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    onError("");

    try {
      await downloadFile(href, fallbackFilename);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Export gagal. Coba ulangi lagi.");
    } finally {
      setLoading(false);
    }
  };

  const Icon = icon === "pdf" ? FileText : Download;

  const baseClass =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition-all active:scale-[0.96] disabled:opacity-60 disabled:cursor-not-allowed";

  const variantClass =
    variant === "solid"
      ? "bg-slate-900 text-white hover:bg-slate-800"
      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className={`${baseClass} ${variantClass}`}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Icon className="size-4" />
      )}
      {loading ? loadingLabel : label}
    </button>
  );
}

function buildExportUrl(path: string, month?: string, category?: string) {
  const params = new URLSearchParams();
  if (month) params.set("month", month);
  if (category) params.set("category", category);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function ExportButtons({
  className,
  month,
  category,
}: {
  className?: string;
  month?: string;
  category?: string;
}) {
  const [errorMessage, setErrorMessage] = useState("");
  const layoutClass = className ?? "flex items-center gap-2";
  const errorClass = className?.includes("grid") ? "col-span-full" : "basis-full";

  return (
    <div className={layoutClass}>
      <ExportButton
        href={buildExportUrl("/api/export", month, category)}
        label="Export CSV"
        loadingLabel="Menyiapkan..."
        variant="outline"
        icon="csv"
        fallbackFilename="BonSync-Export.csv"
        onError={setErrorMessage}
      />
      <ExportButton
        href={buildExportUrl("/api/export/pdf", month, category)}
        label="Export PDF"
        loadingLabel="Menyiapkan..."
        variant="solid"
        icon="pdf"
        fallbackFilename="BonSync-Export.pdf"
        onError={setErrorMessage}
      />
      {errorMessage && (
        <p className={`${errorClass} text-xs font-semibold text-rose-500`}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}
