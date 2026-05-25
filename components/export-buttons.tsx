"use client";

import { useState } from "react";
import { Download, Loader2, FileText } from "lucide-react";

interface ExportButtonProps {
  href: string;
  label: string;
  loadingLabel: string;
  variant: "outline" | "solid";
  icon: "csv" | "pdf";
}

function ExportButton({ href, label, loadingLabel, variant, icon }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    // Reset setelah 5 detik (download biasanya selesai dalam waktu itu)
    setTimeout(() => setLoading(false), 5000);
  };

  const Icon = icon === "pdf" ? FileText : Download;

  const baseClass =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition-all active:scale-[0.96] disabled:opacity-60 disabled:cursor-not-allowed";

  const variantClass =
    variant === "solid"
      ? "bg-slate-900 text-white hover:bg-slate-800"
      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <a
      href={loading ? undefined : href}
      onClick={handleClick}
      aria-disabled={loading}
      className={`${baseClass} ${variantClass} ${loading ? "pointer-events-none" : ""}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {loading ? loadingLabel : label}
    </a>
  );
}

export function ExportButtons({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <ExportButton
        href="/api/export"
        label="Export CSV"
        loadingLabel="Menyiapkan..."
        variant="outline"
        icon="csv"
      />
      <ExportButton
        href="/api/export/pdf"
        label="Export PDF"
        loadingLabel="Menyiapkan..."
        variant="solid"
        icon="pdf"
      />
    </div>
  );
}
