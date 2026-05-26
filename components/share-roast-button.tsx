"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toPng } from "html-to-image";
import { Loader2, Share2, Download, X, Sparkles, Check } from "lucide-react";
import type { RoastLevel, RoastPersona } from "@/lib/roasting";

interface ShareRoastButtonProps {
  advice: string;
  level: RoastLevel;
  persona: RoastPersona;
  /** Survival score 0-100 */
  survivalScore: number;
  /** Sisa rupiah dari budget */
  remaining: number;
  /** Total budget bulan ini */
  budgetLimit: number;
  /** Bulan dalam format "Mei 2026" misal */
  monthLabel: string;
  /** Display name user (opsional) */
  displayName?: string;
}

/* ── Visual mapping per level ── */
const LEVEL_THEME: Record<
  RoastLevel,
  {
    label: string;
    emoji: string;
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    statsBg: string;
  }
> = {
  MILD: {
    label: "Mode Sopan",
    emoji: "🥦",
    bg: "#ffffff",
    text: "#0f172a",
    border: "#e2e8f0",
    badgeBg: "#f8fafc",
    badgeText: "#334155",
    statsBg: "#f8fafc",
  },
  MEDIUM: {
    label: "Mode Pedas",
    emoji: "🔥",
    bg: "#ffffff",
    text: "#0f172a",
    border: "#e2e8f0",
    badgeBg: "#f8fafc",
    badgeText: "#334155",
    statsBg: "#f8fafc",
  },
  NUCLEAR: {
    label: "Mode Nuklir",
    emoji: "💀",
    bg: "#0f172a",
    text: "#f8fafc",
    border: "#1e293b",
    badgeBg: "#1e293b",
    badgeText: "#f1f5f9",
    statsBg: "#1e293b",
  },
};

const PERSONA_LABEL: Record<RoastPersona, { emoji: string; label: string }> = {
  DEFAULT: { emoji: "✨", label: "Default" },
  MAMA: { emoji: "🧕", label: "Mama" },
  SULTAN: { emoji: "💸", label: "Sultan" },
  TETANGGA: { emoji: "🏘️", label: "Tetangga Julid" },
  DOSEN: { emoji: "👨‍🏫", label: "Dosen Killer" },
};

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** Card dirender pada lebar tetap untuk konsistensi export PNG */
const CARD_EXPORT_WIDTH = 420;
/** Tinggi natural card (sekitar) — dipakai untuk hitung scale preview */
const CARD_NATURAL_HEIGHT = 540;

export function ShareRoastButton(props: ShareRoastButtonProps) {
  const { advice, level, persona, survivalScore, remaining, budgetLimit, monthLabel, displayName } =
    props;

  const cardRef = useRef<HTMLDivElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  /** Scale untuk preview card biar muat di container modal */
  const [previewScale, setPreviewScale] = useState(1);

  const theme = LEVEL_THEME[level];
  const personaMeta = PERSONA_LABEL[persona];
  const score = Math.max(0, Math.min(100, Math.round(survivalScore)));
  const userName = (displayName || "Vibe Coder").trim();

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ─── Lock body scroll saat modal open ─── */
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  /* ─── Hitung scale preview agar fit ke container ─── */
  useEffect(() => {
    if (!open) return;
    function computeScale() {
      const wrap = previewWrapRef.current;
      if (!wrap) return;
      const availWidth = wrap.clientWidth;
      // Sisain padding kanan-kiri sedikit
      const targetWidth = Math.max(0, availWidth - 16);
      const scale = Math.min(1, targetWidth / CARD_EXPORT_WIDTH);
      setPreviewScale(scale);
    }
    computeScale();
    window.addEventListener("resize", computeScale);
    return () => window.removeEventListener("resize", computeScale);
  }, [open]);

  /* ─── Esc untuk close ─── */
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function generate(): Promise<string | null> {
    if (!cardRef.current) return null;
    setErrorMsg("");
    setGenerating(true);
    try {
      const url = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5, // 420 * 2.5 = 1050px lebar PNG, cukup buat IG/WA Story
        backgroundColor: "#ffffff",
      });
      setDataUrl(url);
      return url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal generate gambar.";
      setErrorMsg(msg);
      return null;
    } finally {
      setGenerating(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    setShared(false);
    setDataUrl(null);
    // Generate setelah modal mounted (next tick) supaya ref sudah ada
    setTimeout(() => {
      void generate();
    }, 80);
  }

  function handleClose() {
    setOpen(false);
    setDataUrl(null);
    setErrorMsg("");
  }

  async function handleDownload() {
    const url = dataUrl ?? (await generate());
    if (!url) return;
    const link = document.createElement("a");
    link.download = `bonsync-roast-${Date.now()}.png`;
    link.href = url;
    link.click();
    setShared(true);
    setTimeout(() => setShared(false), 2500);
  }

  async function handleNativeShare() {
    const url = dataUrl ?? (await generate());
    if (!url) return;

    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], `bonsync-roast-${Date.now()}.png`, {
        type: "image/png",
      });

      if (
        typeof navigator !== "undefined" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: "Roasting BonSync-ku",
          text: `Roasting AI BonSync ${theme.label} ${theme.emoji} — coba juga di BonSync! #JuaraVibeCoding`,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2500);
        return;
      }

      // Fallback: download
      await handleDownload();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      // User cancel share via Web Share API: kebanyakan browser throw "AbortError"
      if (!/cancel|abort/i.test(msg)) {
        setErrorMsg(msg || "Share dibatalkan.");
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-slate-700 transition-colors active:scale-95 shadow-sm"
        aria-label="Bagikan roasting"
      >
        <Share2 className="h-3.5 w-3.5" />
        Bagikan
      </button>

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/75 backdrop-blur-sm animate-fade-in-up"
          onMouseDown={(e) => {
            // close hanya kalau klik backdrop, bukan child
            if (e.target === e.currentTarget) handleClose();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-roast-title"
        >
          <div className="relative w-full sm:max-w-md md:max-w-lg sm:mx-4 bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden">
            {/* Sticky header */}
            <div className="shrink-0 flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100 bg-white">
              {/* Mobile drag handle */}
              <span className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-slate-200" />
              <div className="min-w-0 mt-1 sm:mt-0">
                <h3
                  id="share-roast-title"
                  className="text-base font-bold text-slate-800 tracking-tight"
                >
                  Bagikan Roasting-mu
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Pamerin ke story / WA, biar makin viral.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors active:scale-90"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable preview area */}
            <div
              ref={previewWrapRef}
              className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-slate-50 px-4 sm:px-6 py-5 flex justify-center"
            >
              {/* Wrapper that reserves the visual space taken by the scaled card */}
              <div
                style={{
                  width: CARD_EXPORT_WIDTH * previewScale,
                  height: CARD_NATURAL_HEIGHT * previewScale,
                  position: "relative",
                }}
              >
                {/* The actual card di-render dengan ukuran asli, tapi di-scale dengan transform */}
                <div
                  ref={cardRef}
                  style={{
                    width: CARD_EXPORT_WIDTH,
                    background: theme.bg,
                    color: theme.text,
                    fontFamily:
                      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    borderRadius: 32,
                    padding: 32,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    overflow: "hidden",
                    border: `1px solid ${theme.border}`,
                    transform: `scale(${previewScale})`,
                    transformOrigin: "top left",
                  }}
                >
                  {/* Header brand */}
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 24,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: theme.badgeBg,
                          border: `1px solid ${theme.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          lineHeight: 1,
                        }}
                      >
                        <Sparkles size={16} color={theme.badgeText} />
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5 }}>
                        BonSync
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "6px 12px",
                        borderRadius: 999,
                        background: theme.badgeBg,
                        color: theme.badgeText,
                        border: `1px solid ${theme.border}`,
                        letterSpacing: 0.2,
                        textTransform: "uppercase",
                      }}
                    >
                      {theme.emoji} {theme.label}
                    </span>
                  </div>

                  {/* Persona badge */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      background: theme.badgeBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 24,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{personaMeta.emoji}</span>
                    <span style={{ color: theme.badgeText }}>Persona: {personaMeta.label}</span>
                  </div>

                  {/* The actual roast quote */}
                  <div
                    style={{
                      position: "relative",
                      fontSize: 22,
                      lineHeight: 1.5,
                      fontWeight: 600,
                      letterSpacing: -0.5,
                      minHeight: 140,
                      marginBottom: 32,
                      color: theme.text,
                    }}
                  >
                    “ {advice || "Belum ada roasting."} ”
                  </div>

                  {/* Stats grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                      marginBottom: 32,
                    }}
                  >
                    <div
                      style={{
                        background: theme.statsBg,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 20,
                        padding: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          opacity: 0.7,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          marginBottom: 8,
                        }}
                      >
                        Survival
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>
                        {score}
                        <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.5, marginLeft: 4 }}>
                          / 100
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        background: theme.statsBg,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 20,
                        padding: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          opacity: 0.7,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          marginBottom: 8,
                        }}
                      >
                        Sisa Saldo
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          letterSpacing: -0.5,
                          lineHeight: 1.4,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {budgetLimit > 0 ? idr.format(remaining) : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 12,
                      fontWeight: 600,
                      opacity: 0.6,
                      paddingTop: 20,
                      borderTop: `1px solid ${theme.border}`,
                    }}
                  >
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {userName} · {monthLabel}
                    </span>
                    <span style={{ letterSpacing: 0.5 }}>bonsync.app</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status messages strip */}
            {(generating || errorMsg) && (
              <div className="shrink-0 px-5 sm:px-6 pt-3 pb-1 bg-white">
                {generating && (
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Menyiapkan gambar...
                  </div>
                )}
                {errorMsg && !generating && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-700 text-center">
                    ⚠️ {errorMsg}
                  </div>
                )}
              </div>
            )}

            {/* Sticky bottom action bar — selalu visible */}
            <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-2.5 px-5 sm:px-6 pt-3 pb-5 sm:pb-6 bg-white border-t border-slate-100 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
              <button
                type="button"
                onClick={handleNativeShare}
                disabled={generating || !!errorMsg}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm sm:order-2"
              >
                {shared ? (
                  <>
                    <Check className="h-4 w-4" /> Berhasil!
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Bagikan ke Story / WA
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={generating || !!errorMsg}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed sm:order-1"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
