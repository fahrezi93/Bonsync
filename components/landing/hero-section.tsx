/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Camera,
  Users,
  Flame,
  Receipt,
  ScanLine,
  CheckCircle2,
  ArrowRight,
  PlayCircle,
  Cpu,
  Sliders,
  Coins,
  Smile,
  ShieldCheck
} from "lucide-react";
import { RevealSection } from "./reveal-section";

const rawBillItems = [
  { name: "Tenderloin Steak", price: 145000 },
  { name: "Peach Iced Tea", price: 28000 },
  { name: "Chicken Gyoza", price: 42000 },
  { name: "Matcha Latte", price: 35000 },
];

const roastDatabase = {
  boba: {
    mild: "Beli boba & kopi kekinian boleh aja buat penyegar kerja, tapi coba dibatasi seminggu 2 kali biar gak boncos tipis-tipis. 🥤🌱",
    medium: "Beli boba & es kopi tiap sore 'biar waras pas kerja'. Pas akhir bulan pusing nyari pinjolan. Ginjalmu manis manis manis, dompetmu kritis kritis kritis! 🧋💀",
    hard: "KECANDUAN SUGAR RUSH BERKEDOK WARAS! Tiap hari jajan boba size jumbo double topping. Saldo rekening sekarat, tapi kolesterol meroket. Itu dompet apa puskesmas, kritis amat! 😭🥤☢️",
  },
  gadget: {
    mild: "Beli gadget baru emang seru buat dukung kerjaan, tapi pastikan emang butuh fiturnya ya, bukan cuma lapar mata. 📱💻",
    medium: "Beli gadget baru berkedok 'investasi alat kerja', padahal cuma dipake buat scrolldown tiktok 6 jam sehari. Tabungan ludes, produktivitas nol. Gaya elite, saldo sulit bos! 📱💸",
    hard: "ALAT INVESTASI MATAMU! Beli handphone flagship belasan juta cuma buat pamer mirror selfie dan scrolling reels 8 jam sehari. Tabungan lunas didepak buat cicilan 12 bulan. Gaya bintang lima, rekening minus lima! 💀📱❌",
  },
  paylater: {
    mild: "Paylater membantu di saat darurat, tapi hati-hati ya, jangan lupa catat limitnya biar cicilan gak numpuk bulan depan. 💳",
    medium: "Cicilan paylater ada di 5 aplikasi berbeda buat beli sneakers diskonan. Pas jatuh tempo langsung mode ghosting & pura-pura lupa ingatan. Dompetmu nangis di pojokan! 😭🛒",
    hard: "FESTIVAL GHOSTING DEBT COLLECTOR! Aplikasi paylater dipasang di semua platform cuma buat checkout promo 'beli 1 gratis rindu'. Pas jatuh tempo hp dimute, pura-pura pingsan. Tobat woy, sebelum rumahmu disita! 😭💸☢️",
  },
};

export function HeroSection() {
  const [activeHeroTab, setActiveHeroTab] = useState<"scan" | "split" | "roast">("scan");

  // Tab 1: Scan States
  const [scanState, setScanState] = useState<"idle" | "scanning" | "done">("idle");
  const [scanProgress, setScanProgress] = useState(0);

  // Tab 2: Split Bill States
  const [billSelections, setBillSelections] = useState<("self" | "other" | "both")[]>([
    "self", "both", "other", "self"
  ]);

  // Tab 3: AI Roast States
  const [roastTopic, setRoastTopic] = useState<"boba" | "gadget" | "paylater">("boba");
  const [roastSeverity, setRoastSeverity] = useState<"mild" | "medium" | "hard">("medium");
  const [isRoasting, setIsRoasting] = useState(false);
  const [roastOutput, setRoastOutput] = useState(
    "Gaya hidup elite, sisa saldo sulit. Coba klik kategori di handphone atau geser meteran tingkat kepedasan di samping! 💀"
  );

  // Trigger scanning animation
  const handleStartScan = () => {
    if (scanState !== "idle") return;
    setScanState("scanning");
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanState("done");
          return 100;
        }
        return prev + 4;
      });
    }, 60);
  };

  const handleResetScan = () => {
    setScanState("idle");
    setScanProgress(0);
  };

  // Toggle single item split option
  const toggleSplitSelection = (index: number) => {
    setBillSelections((prev) => {
      const next = [...prev];
      if (next[index] === "self") next[index] = "both";
      else if (next[index] === "both") next[index] = "other";
      else next[index] = "self";
      return next;
    });
  };

  // Calculate bill splits
  const calculateSelfSubtotal = () => {
    let subtotal = 0;
    rawBillItems.forEach((item, idx) => {
      const sel = billSelections[idx];
      if (sel === "self") subtotal += item.price;
      else if (sel === "both") subtotal += item.price / 2;
    });
    return subtotal;
  };

  const selfSubtotal = calculateSelfSubtotal();
  const tax = selfSubtotal * 0.1;
  const service = selfSubtotal * 0.05;
  const selfTotal = selfSubtotal + tax + service;

  // Trigger Custom AI Roast in Hero
  const triggerHeroRoast = (topic: "boba" | "gadget" | "paylater", severity: "mild" | "medium" | "hard" = roastSeverity) => {
    setRoastTopic(topic);
    setIsRoasting(true);
    setTimeout(() => {
      setRoastOutput(roastDatabase[topic][severity]);
      setIsRoasting(false);
    }, 500);
  };

  const changeSeverity = (severity: "mild" | "medium" | "hard") => {
    setRoastSeverity(severity);
    triggerHeroRoast(roastTopic, severity);
  };

  // Dynamic OCR tracking active line index during scanning animation
  // 4 items, we divide scanProgress from 0 to 100 into 4 checkpoints.
  const activeOCRLine = scanState === "scanning"
    ? Math.min(Math.floor(scanProgress / 25), 3)
    : -1;

  return (
    <section className="relative pt-36 md:pt-40 pb-20 px-6 overflow-hidden bg-white">
      {/* Soft Background Radial Glow (Dynamic based on selected tab for fluid aesthetic) */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-[620px] rounded-full blur-[140px] pointer-events-none transition-all duration-700 ease-in-out opacity-20 z-0 ${activeHeroTab === "scan"
        ? "bg-gradient-to-b from-emerald-500/30 via-emerald-200/15 to-transparent"
        : activeHeroTab === "split"
          ? "bg-gradient-to-b from-emerald-400/30 via-emerald-100/15 to-transparent"
          : "bg-gradient-to-b from-slate-500/25 via-slate-300/15 to-transparent"
        }`} />

      <div className="max-w-6xl mx-auto flex flex-col items-center text-center relative z-10">

        {/* Adora Display Headline */}
        <RevealSection delay={100}>
          <h1 className="text-3xl md:text-5xl lg:text-[54px] font-bold tracking-tight text-[#21164c] leading-[1.12] max-w-3xl mx-auto mb-6 font-sans">
            Catat Pintar. Patungan Lancar.<br className="hidden sm:inline" />{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#21164c] via-emerald-600 to-emerald-500">
              Belanja Tanpa Rungkad.
            </span>
          </h1>
        </RevealSection>

        {/* Adora Body text */}
        <RevealSection delay={200}>
          <p className="text-[#353241] text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed font-medium tracking-tight">
            BonSync memindai struk belanja secara otomatis, membagi bill seadil mungkin, serta memberikan kritik (<span className="italic">roasting</span>) finansial tajam yang bikin kamu tobat jajan.
          </p>
        </RevealSection>

        <RevealSection delay={300} className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full mb-16">
          {/* Adora Primary Action Button */}
          <Link
            href="/login"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-4 rounded-full text-[14px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-300 tracking-tight"
          >
            Mulai Pakai Sekarang
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Adora Ghost Button */}
          <a
            href="#playground"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent hover:bg-[#f4f4f3] text-[#353241] font-bold px-8 py-4 rounded-full text-[14px] transition-all shadow-sm border border-[#e0e0db] hover:-translate-y-0.5 duration-300 tracking-tight"
          >
            <PlayCircle className="w-4.5 h-4.5 text-[#353241]" />
            Coba Demo Interaktif
          </a>
        </RevealSection>

        {/* ======================================================== */}
        {/* PLAYGROUND: PREMIUM DYNAMIC SIMULATOR WIDGET (Dribbble Style) */}
        {/* ======================================================== */}
        <RevealSection id="playground" delay={400} className="w-full relative max-w-4xl mx-auto px-1 md:px-0">

          {/* Glowing Ambient Ring around the device canvas */}
          <div className={`absolute -inset-1.5 rounded-[34px] blur-[30px] opacity-25 transition-all duration-700 ease-in-out -z-10 ${activeHeroTab === "scan"
            ? "bg-emerald-500"
            : activeHeroTab === "split"
              ? "bg-emerald-400"
              : "bg-slate-400"
            }`} />

          {/* Premium Digital device canvas */}
          <div className="w-full bg-[#ffffff] border border-[#e0e0db] rounded-[32px] shadow-[0_24px_70px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-500 hover:shadow-[0_32px_90px_rgba(0,0,0,0.06)]">

            {/* Header: MacOS-style header redesigned beautifully */}
            <div className="bg-[#f4f4f3]/80 backdrop-blur-md border-b border-[#e0e0db] py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 select-none">
                  <span className="w-3 h-3 rounded-full bg-rose-400 block hover:bg-rose-500 transition-colors" />
                  <span className="w-3 h-3 rounded-full bg-amber-400 block hover:bg-amber-500 transition-colors" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400 block hover:bg-emerald-500 transition-colors" />
                </div>
                <div className="h-4 w-[1px] bg-slate-300 hidden sm:block" />
                <span className="text-[11px] font-bold text-[#353241]/40 tracking-tight font-mono uppercase hidden sm:inline">
                  sandbox://bonsync_simulator.app
                </span>
              </div>

              {/* Dribbble Premium Segmented Tab Controls */}
              <div className="flex w-full sm:w-auto bg-[#e0e0db]/50 p-1 rounded-[20px] sm:rounded-full border border-[#e0e0db]/30 shadow-inner overflow-x-auto hide-scrollbar justify-start sm:justify-center">
                <button
                  onClick={() => setActiveHeroTab("scan")}
                  className={`whitespace-nowrap flex-shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-2 rounded-full text-[10px] sm:text-[11px] font-extrabold transition-all duration-300 tracking-tight cursor-pointer ${activeHeroTab === "scan"
                    ? "bg-white text-[#21164c] shadow-[0_3px_10px_rgba(0,0,0,0.05)] scale-[1.02]"
                    : "text-[#353241]/70 hover:text-[#21164c]"
                    }`}
                >
                  <Camera className={`w-3.5 h-3.5 transition-transform duration-300 ${activeHeroTab === "scan" ? "text-emerald-500 scale-110" : "text-[#353241]/50"}`} />
                  OCR Scanner
                </button>
                <button
                  onClick={() => setActiveHeroTab("split")}
                  className={`whitespace-nowrap flex-shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-2 rounded-full text-[10px] sm:text-[11px] font-extrabold transition-all duration-300 tracking-tight cursor-pointer ${activeHeroTab === "split"
                    ? "bg-white text-[#21164c] shadow-[0_3px_10px_rgba(0,0,0,0.05)] scale-[1.02]"
                    : "text-[#353241]/70 hover:text-[#21164c]"
                    }`}
                >
                  <Users className={`w-3.5 h-3.5 transition-transform duration-300 ${activeHeroTab === "split" ? "text-emerald-500 scale-110" : "text-[#353241]/50"}`} />
                  Split Bill
                </button>
                <button
                  onClick={() => setActiveHeroTab("roast")}
                  className={`whitespace-nowrap flex-shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-2 rounded-full text-[10px] sm:text-[11px] font-extrabold transition-all duration-300 tracking-tight cursor-pointer ${activeHeroTab === "roast"
                    ? "bg-white text-[#21164c] shadow-[0_3px_10px_rgba(0,0,0,0.05)] scale-[1.02]"
                    : "text-[#353241]/70 hover:text-[#21164c]"
                    }`}
                >
                  <Flame className={`w-3.5 h-3.5 transition-transform duration-300 ${activeHeroTab === "roast" ? "text-emerald-500 scale-110 animate-pulse" : "text-[#353241]/50"}`} />
                  AI Roast Me
                </button>
              </div>
            </div>

            {/* Window Body: Polished with beautiful padding and subtle transition gradients */}
            <div className="p-5 md:p-12 bg-gradient-to-b from-white to-[#fcfcfb] min-h-[500px] flex items-center justify-center">

              {/* ─── TAB 1: AI SCAN SIMULATOR ─── */}
              {activeHeroTab === "scan" && (
                <div className="w-full flex flex-col md:flex-row gap-8 md:gap-12 items-center justify-center animate-fade-in-up">

                  {/* Premium Skeuomorphic Floating Receipt Scanner Card */}
                  <div className="relative w-full max-w-[280px] sm:max-w-[300px] bg-white border border-[#e0e0db] rounded-[24px] p-6 shadow-[0_15px_45px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col shrink-0 transition-transform duration-500 hover:scale-[1.02]">

                    {/* Glowing Laser Sweep Line */}
                    {scanState === "scanning" && (
                      <div
                        className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#10b981] to-transparent shadow-[0_0_12px_#10b981] z-20 pointer-events-none transition-all duration-100 ease-linear"
                        style={{ top: `${scanProgress}%` }}
                      />
                    )}

                    {/* Receipt Tear Wavy Top Border Effect */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-[radial-gradient(ellipse_at_top,transparent_3px,white_4px)] bg-[length:10px_6px] bg-repeat-x rotate-180 opacity-20" />

                    {/* Resto Branding Header */}
                    <div className="flex flex-col items-center border-b border-dashed border-[#e0e0db] pb-4 mb-4 select-none">
                      <div className="w-9 h-9 rounded-full bg-[#eef8f5] border border-emerald-100 flex items-center justify-center mb-1.5">
                        <Coins className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-[12px] font-extrabold text-[#21164c] tracking-widest font-mono">SPESIALIS KOPITIAM</p>
                      <p className="text-[8px] text-[#353241]/40 font-bold uppercase tracking-wider mt-0.5">Sudirman, Jakarta Selatan</p>
                      <div className="w-full flex justify-between items-center mt-3 text-[9px] text-[#353241]/60 font-semibold font-mono">
                        <span>INV#882791</span>
                        <span>21/05/2026 12:21</span>
                      </div>
                    </div>

                    {/* Idle Scan Screen */}
                    {scanState === "idle" && (
                      <div className="py-14 flex flex-col items-center justify-center text-center select-none">
                        <div className="w-14 h-14 rounded-[20px] bg-[#f4f4f3] flex items-center justify-center mb-4 border border-[#e0e0db] relative group-hover:scale-110 transition-transform">
                          <Camera className="w-6 h-6 text-[#353241]/60" />
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#10b981] animate-ping" />
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                        </div>
                        <p className="text-[13px] font-extrabold text-[#21164c] mb-1 tracking-tight">Siap Memindai Struk</p>
                        <p className="text-[10px] text-[#353241]/75 px-3 leading-relaxed font-bold tracking-tight">
                          Klik tombol hijau di sebelah kanan untuk memulai simulasi pemindaian cerdas.
                        </p>
                      </div>
                    )}

                    {/* Scanning & Done Screen: Premium custom item rows with OCR highlights */}
                    {(scanState === "scanning" || scanState === "done") && (
                      <div className="flex flex-col gap-2 flex-1 select-none font-mono text-[#353241]">
                        {rawBillItems.map((item, idx) => {
                          const isCurrentLine = scanState === "scanning" && activeOCRLine === idx;
                          const isVisible = scanState === "done" || (scanState === "scanning" && scanProgress >= (idx + 1) * 23);

                          return (
                            <div
                              key={idx}
                              className={`relative p-2 rounded-[10px] transition-all duration-300 ${isCurrentLine
                                ? "bg-[#eef8f5] border border-emerald-300/60 scale-[1.01] shadow-[0_2px_8px_rgba(16,185,129,0.06)]"
                                : "border border-transparent"
                                }`}
                            >
                              {/* Glowing OCR Box Label */}
                              {isCurrentLine && (
                                <span className="absolute -top-1.5 -left-1 text-[8px] bg-[#10b981] text-white px-1 py-0.2 rounded-md font-mono font-bold animate-pulse tracking-tighter">
                                  OCR_LINE_{idx + 1}
                                </span>
                              )}

                              <div
                                className={`flex justify-between items-center transition-all duration-300 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"
                                  }`}
                              >
                                <span className="text-[11px] font-bold text-[#353241]/90 truncate max-w-[125px] font-sans tracking-tight">
                                  {item.name}
                                </span>
                                <span className="text-[11px] font-bold tracking-tight">
                                  Rp {item.price.toLocaleString("id-ID")}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Calculated Grand Total on Struk */}
                        <div className={`border-t border-dashed border-[#e0e0db] pt-3 mt-4 transition-all duration-500 ${scanState === "scanning" && scanProgress < 95 ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                          }`}>
                          <div className="flex justify-between text-xs font-bold text-[#21164c] font-sans tracking-tight">
                            <span>TOTAL</span>
                            <span>Rp 250.000</span>
                          </div>
                          <div className="flex justify-between text-[9px] text-[#353241]/50 font-semibold mt-1 font-sans tracking-tight">
                            <span>Pajak (10%)</span>
                            <span>Rp 25.000</span>
                          </div>
                          <div className="flex justify-between text-[11px] font-bold text-[#21164c] border-t border-[#e0e0db]/50 pt-2 mt-2 font-sans tracking-tight">
                            <span>GRAND TOTAL</span>
                            <span>Rp 275.000</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Barcode & Footer representation */}
                    <div className={`flex flex-col items-center justify-center border-t border-dashed border-[#e0e0db] pt-4 mt-4 select-none transition-all duration-500 ${scanState === "done" ? "opacity-100" : "opacity-20"
                      }`}>
                      {/* Interactive Barcode */}
                      <div className="h-6 w-44 bg-[repeating-linear-gradient(90deg,#353241,#353241_2px,transparent_2px,transparent_6px,#353241_6px,#353241_9px,transparent_9px,transparent_11px)]" />
                      <span className="text-[8px] text-[#353241]/40 font-mono mt-1 font-semibold tracking-widest">BONSYNC*OCR*AI*2026</span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[radial-gradient(ellipse_at_bottom,transparent_3px,white_4px)] bg-[length:10px_6px] bg-repeat-x opacity-20" />
                  </div>

                  {/* High Fidelity Simulation Control Panel */}
                  <div className="flex-1 flex flex-col items-start text-left w-full max-w-md">

                    <h4 className="text-xl md:text-[22px] font-bold text-[#21164c] mb-3 tracking-tight font-sans leading-[1.20]">
                      Simulasi OCR Cerdas
                    </h4>
                    <p className="text-[13px] text-[#353241] leading-relaxed mb-6 font-medium tracking-tight">
                      Teknologi AI kami memecah struk terpanjang sekalipun secara instan. Menghubungkan setiap item, nominal harga, pajak, dan data merchant secara otomatis dengan akurasi tinggi tanpa ketik manual.
                    </p>

                    {/* Live Tech Stats Dashboard */}
                    <div className="grid grid-cols-2 gap-4 w-full mb-6 bg-[#f4f4f3]/40 border border-[#e0e0db] rounded-[16px] p-4">
                      <div>
                        <p className="text-[10px] font-extrabold text-[#353241]/40 uppercase tracking-wider font-mono">Kecepatan Parse</p>
                        <p className="text-sm font-extrabold text-[#21164c] tracking-tight">{scanState === "done" ? "0.68 detik" : scanState === "scanning" ? "Memproses..." : "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-[#353241]/40 uppercase tracking-wider font-mono">Tingkat Akurasi</p>
                        <p className="text-sm font-extrabold text-[#10b981] tracking-tight">{scanState === "done" ? "99.8%" : scanState === "scanning" ? "Kalkulasi..." : "-"}</p>
                      </div>
                    </div>

                    {scanState === "idle" && (
                      <button
                        onClick={handleStartScan}
                        className="w-full sm:w-auto bg-[#10b981] hover:bg-emerald-600 hover:shadow-md hover:-translate-y-0.5 text-white font-bold text-xs px-6 py-3.5 rounded-full transition-all duration-300 cursor-pointer tracking-tight"
                      >
                        Mulai Simulasi Scan
                      </button>
                    )}

                    {scanState === "scanning" && (
                      <div className="flex items-center gap-3.5 w-full bg-[#eef8f5] border border-emerald-100 rounded-full px-5 py-3">
                        <div className="w-4.5 h-4.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-bold text-[#21164c] tracking-tight">
                          Sedang membaca data struk... {scanProgress}%
                        </span>
                      </div>
                    )}

                    {scanState === "done" && (
                      <div className="flex flex-col gap-3 w-full">
                        <div className="bg-[#eef8f5] border border-emerald-200/60 rounded-[16px] p-3 flex items-center gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                          <span className="text-xs font-bold text-emerald-800 tracking-tight">
                            Struk Terpecah Berhasil! Data siap dibagikan.
                          </span>
                        </div>
                        <button
                          onClick={handleResetScan}
                          className="w-full sm:w-auto text-[#353241] hover:text-[#21164c] text-xs font-extrabold underline cursor-pointer tracking-tight self-start"
                        >
                          Reset & Coba Lagi
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── TAB 2: INTERACTIVE SPLIT BILL ─── */}
              {activeHeroTab === "split" && (
                <div className="w-full flex flex-col md:flex-row gap-8 md:gap-12 items-center justify-center animate-fade-in-up">

                  {/* Premium Splitting Interactive Board */}
                  <div className="relative w-full max-w-[280px] sm:max-w-[300px] bg-white border border-[#e0e0db] rounded-[24px] p-5 sm:p-6 shadow-[0_15px_45px_rgba(0,0,0,0.02)] flex flex-col shrink-0 select-none">

                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#e0e0db] pb-3 mb-4">
                      <div>
                        <p className="text-[12px] font-extrabold text-[#21164c] tracking-tight font-mono">Spesialis Kopitiam</p>
                        <p className="text-[9px] text-[#353241]/60 font-bold uppercase tracking-wider">Tap item untuk atur porsi</p>
                      </div>
                      <div className="w-7 h-7 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    </div>

                    {/* Tactile Split Item Capsules */}
                    <div className="flex flex-col gap-3">
                      {rawBillItems.map((item, idx) => {
                        const status = billSelections[idx];

                        // Custom styling based on active split status
                        let colorClass = "bg-[#f4f4f3]/50 border-[#e0e0db] hover:bg-[#f4f4f3] text-[#353241]";
                        let statusText = "Teman";
                        let statusColor = "bg-white border-[#e0e0db] text-[#353241]/70";

                        if (status === "self") {
                          colorClass = "bg-emerald-50 border-emerald-200 text-[#21164c] shadow-sm scale-[1.01]";
                          statusText = "Kamu";
                          statusColor = "bg-emerald-500 text-white border-transparent";
                        } else if (status === "both") {
                          colorClass = "bg-slate-50 border-slate-300 text-[#21164c] shadow-sm scale-[1.01]";
                          statusText = "Berdua (50:50)";
                          statusColor = "bg-slate-600 text-white border-transparent";
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => toggleSplitSelection(idx)}
                            className={`flex justify-between items-center text-left p-3 rounded-[16px] border transition-all duration-300 cursor-pointer tracking-tight ${colorClass}`}
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="text-[11px] font-extrabold truncate tracking-tight text-[#21164c]">{item.name}</span>
                              <span className="text-[9px] font-bold opacity-75 mt-0.5 tracking-tight font-mono">
                                Rp {item.price.toLocaleString("id-ID")}
                              </span>
                            </div>

                            {/* Colorful ownership badge */}
                            <div className="shrink-0 flex items-center gap-1.5">
                              <span className={`text-[8px] font-extrabold px-2.5 py-0.8 rounded-full border border-transparent tracking-tight font-mono uppercase ${statusColor}`}>
                                {statusText}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Premium Receipt Breakdown Math */}
                    <div className="border-t border-[#e0e0db] pt-4 mt-5 space-y-2 select-none font-mono text-[#353241]">
                      <div className="flex justify-between text-[10px] font-bold tracking-tight font-sans">
                        <span>Porsi Subtotal Kamu</span>
                        <span>Rp {selfSubtotal.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold tracking-tight font-sans">
                        <span>Pajak & Servis (15% Proporsional)</span>
                        <span>Rp {(tax + service).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between text-xs font-extrabold text-[#21164c] border-t border-[#e0e0db] pt-2.5 mt-1 font-sans tracking-tight">
                        <span>BAGIAN KAMU</span>
                        <span className="text-[#10b981] font-mono">Rp {selfTotal.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Control / Tutorial Panel */}
                  <div className="flex-1 flex flex-col items-start text-left w-full max-w-md">

                    <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold px-3 py-1 rounded-full mb-5 tracking-tight">
                      <Users className="w-3.5 h-3.5" />
                      FAIR-SPLIT MATRIX
                    </div>

                    <h4 className="text-xl md:text-[22px] font-bold text-[#21164c] mb-3 tracking-tight font-sans leading-[1.20]">
                      Patungan Tanpa Canggung
                    </h4>
                    <p className="text-[13px] text-[#353241] leading-relaxed mb-6 font-medium tracking-tight">
                      Tidak ada lagi perdebatan porsi makan. Dengan mengetuk setiap item struk di sebelah kiri, Anda dapat langsung menggeser kepemilikan pembayaran. Sistem secara dinamis menghitung porsi subtotal serta mendistribusikan beban pajak dan servis secara <strong>adil & proporsional</strong>!
                    </p>

                    {/* Interactive Legend Visualizer */}
                    <div className="bg-[#f4f4f3]/40 border border-[#e0e0db] rounded-[18px] p-4 w-full space-y-2.5">
                      <p className="text-[10px] font-extrabold text-[#353241]/40 uppercase tracking-wider font-mono">Petunjuk Porsi</p>

                      <div className="flex flex-wrap gap-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-emerald-500" />
                          <span className="text-[11px] font-extrabold text-[#353241]/95 tracking-tight">Kamu (100% milikmu)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-slate-600" />
                          <span className="text-[11px] font-extrabold text-[#353241]/95 tracking-tight">Berdua (Bagi rata 50%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-[#e0e0db]" />
                          <span className="text-[11px] font-extrabold text-[#353241]/70 tracking-tight">Teman (Dibayarkan teman)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 3: INTERACTIVE AI ROAST SHOWCASE ─── */}
              {activeHeroTab === "roast" && (
                <div className="w-full flex flex-col md:flex-row gap-8 md:gap-12 items-center justify-center animate-fade-in-up">

                  {/* Holographic Premium Smartphone Simulator (Light-mode Minimalist) */}
                  <div className="relative w-full max-w-[280px] sm:max-w-[300px] bg-white border-4 border-slate-200 rounded-[36px] p-4.5 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col h-[390px] shrink-0 justify-between overflow-hidden">

                    {/* Subtle green tint ambient glow */}
                    <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

                    {/* Notch Representation */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-slate-200 rounded-b-2xl z-20 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                      <div className="w-10 h-1 bg-slate-400 rounded-full" />
                    </div>

                    {/* Chat Header */}
                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-2 mt-2 relative z-10">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-base shadow-sm select-none">
                        💀
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-800 tracking-tight">Roast-Bot AI</p>
                        <span className="flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[8px] text-slate-500 font-bold tracking-tight">Mode Pedas Aktif</span>
                        </span>
                      </div>
                    </div>

                    {/* Chat Messages Log */}
                    <div className="flex-1 flex flex-col gap-3 overflow-y-auto hide-scrollbar justify-end pb-3 relative z-10">
                      <div className="bg-slate-50 border border-slate-150 rounded-[16px] rounded-bl-sm p-3.5 self-start max-w-[85%]">
                        <p className="text-[9px] text-emerald-600 font-bold mb-1 tracking-tight font-mono">BonSync AI</p>
                        <p className="text-[11px] text-slate-700 leading-relaxed font-medium tracking-tight">
                          Halo! Jajan impulsif apa lagi yang mau kamu roasting hari ini? Biar mental finansialmu terselamatkan dari kemiskinan.
                        </p>
                      </div>

                      {/* Custom Message bubble with shake-effect if hard severity */}
                      <div className={`border rounded-[16px] rounded-br-sm p-3.5 self-end max-w-[85%] transition-all duration-300 ${roastSeverity === "mild"
                        ? "bg-emerald-50/60 border-emerald-100"
                        : roastSeverity === "medium"
                          ? "bg-amber-50/60 border-amber-100"
                          : "bg-rose-50/60 border-rose-100 animate-pulse shadow-sm"
                        }`}>
                        <div className={`flex justify-between items-center mb-1.5 border-b pb-1 ${roastSeverity === "mild"
                          ? "border-emerald-100/60"
                          : roastSeverity === "medium"
                            ? "border-amber-100/60"
                            : "border-rose-100/60"
                          }`}>
                          <p className={`text-[9px] font-bold tracking-tight font-mono uppercase ${roastSeverity === "mild"
                            ? "text-emerald-700"
                            : roastSeverity === "medium"
                              ? "text-amber-700"
                              : "text-rose-700"
                            }`}>
                            AI ROAST • {roastSeverity}
                          </p>
                          <span className="text-[10px]">
                            {roastSeverity === "mild" ? "🥦" : roastSeverity === "medium" ? "🔥" : "☢️"}
                          </span>
                        </div>
                        {isRoasting ? (
                          <div className="flex items-center gap-1.5 py-1">
                            <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${roastSeverity === "mild"
                              ? "bg-emerald-500"
                              : roastSeverity === "medium"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                              }`} style={{ animationDelay: "0ms" }} />
                            <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${roastSeverity === "mild"
                              ? "bg-emerald-500"
                              : roastSeverity === "medium"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                              }`} style={{ animationDelay: "150ms" }} />
                            <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${roastSeverity === "mild"
                              ? "bg-emerald-500"
                              : roastSeverity === "medium"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                              }`} style={{ animationDelay: "300ms" }} />
                          </div>
                        ) : (
                          <p className={`text-[11px] leading-relaxed font-semibold tracking-tight italic ${roastSeverity === "mild"
                            ? "text-emerald-900"
                            : roastSeverity === "medium"
                              ? "text-amber-900"
                              : "text-rose-900"
                            }`}>
                            "{roastOutput}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Chat Category input deck */}
                    <div className="border-t border-slate-100 pt-3.5 flex gap-1.5 relative z-10">
                      <button
                        onClick={() => triggerHeroRoast("boba")}
                        className={`flex-1 text-[9px] font-bold py-2 px-1 rounded-full border transition-all duration-350 cursor-pointer tracking-tight uppercase ${roastTopic === "boba"
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                          : "bg-transparent text-emerald-600 hover:bg-emerald-50 border-emerald-200"
                          }`}
                      >
                        🥤 Boba
                      </button>
                      <button
                        onClick={() => triggerHeroRoast("gadget")}
                        className={`flex-1 text-[9px] font-bold py-2 px-1 rounded-full border transition-all duration-350 cursor-pointer tracking-tight uppercase ${roastTopic === "gadget"
                          ? "bg-teal-500 border-teal-500 text-white shadow-sm"
                          : "bg-transparent text-teal-600 hover:bg-teal-50 border-teal-200"
                          }`}
                      >
                        📱 Gadget
                      </button>
                      <button
                        onClick={() => triggerHeroRoast("paylater")}
                        className={`flex-1 text-[9px] font-bold py-2 px-1 rounded-full border transition-all duration-350 cursor-pointer tracking-tight uppercase ${roastTopic === "paylater"
                          ? "bg-slate-500 border-slate-500 text-white shadow-sm"
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border-slate-200"
                          }`}
                      >
                        💳 Paylater
                      </button>
                    </div>
                  </div>

                  {/* High Fidelity Roast control deck */}
                  <div className="flex-1 flex flex-col items-start text-left w-full max-w-md">

                    <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold px-3 py-1 rounded-full mb-5 tracking-tight">
                      <Flame className="w-3.5 h-3.5" />
                      AI SATIRE ENGINE
                    </div>

                    <h4 className="text-xl md:text-[22px] font-bold text-[#21164c] mb-3 tracking-tight font-sans leading-[1.20]">
                      Teguran Pedas Finansial
                    </h4>
                    <p className="text-[13px] text-[#353241] leading-relaxed mb-6 font-medium tracking-tight">
                      Ubah kebiasaan buruk jajan berlebihan lewat teguran sarkasme Indonesia yang cerdas. AI kami menganalisis kebiasaan finansial dan menyajikannya secara blak-blakan agar Anda tertawa sekaligus tersadar.
                    </p>

                    {/* Dribbble Roast Severity Meter Interactive Control */}
                    <div className="bg-[#f4f4f3]/40 border border-[#e0e0db] rounded-[24px] p-5.5 w-full">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-extrabold text-[#353241]/40 uppercase tracking-wider font-mono">Tingkat Kepedasan AI</span>
                        <span className="text-[11px] font-extrabold text-[#21164c] tracking-tight bg-white border border-[#e0e0db] px-2.5 py-0.5 rounded-full uppercase">
                          Level: {roastSeverity}
                        </span>
                      </div>

                      {/* Interactive Severity Segmented Selector */}
                      <div className="flex bg-[#e0e0db]/50 p-1 rounded-full border border-[#e0e0db]/30 mb-4">
                        <button
                          onClick={() => changeSeverity("mild")}
                          className={`flex-1 text-center py-2 text-[10px] font-extrabold rounded-full transition-all duration-300 cursor-pointer ${roastSeverity === "mild"
                            ? "bg-white text-emerald-700 shadow-sm"
                            : "text-[#353241]/60 hover:text-[#21164c]"
                            }`}
                        >
                          Sopan 🥦
                        </button>
                        <button
                          onClick={() => changeSeverity("medium")}
                          className={`flex-1 text-center py-2 text-[10px] font-extrabold rounded-full transition-all duration-300 cursor-pointer ${roastSeverity === "medium"
                            ? "bg-white text-[#21164c] shadow-sm"
                            : "text-[#353241]/60 hover:text-[#21164c]"
                            }`}
                        >
                          Pedas Sedang 🔥
                        </button>
                        <button
                          onClick={() => changeSeverity("hard")}
                          className={`flex-1 text-center py-2 text-[10px] font-extrabold rounded-full transition-all duration-300 cursor-pointer ${roastSeverity === "hard"
                            ? "bg-white text-rose-700 shadow-sm animate-pulse"
                            : "text-[#353241]/60 hover:text-[#21164c]"
                            }`}
                        >
                          Nuklir 💀
                        </button>
                      </div>

                      {/* Dynamic Severity Progress Bar (Glow Gauge) */}
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${roastSeverity === "mild"
                            ? "w-1/3 bg-emerald-500"
                            : roastSeverity === "medium"
                              ? "w-2/3 bg-amber-500"
                              : "w-full bg-gradient-to-r from-amber-500 to-rose-600 animate-pulse"
                            }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
