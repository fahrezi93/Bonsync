/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import {
  Users,
  Flame,
  TrendingDown,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { RevealSection } from "./reveal-section";

const roastDatabase = {
  kopi: "Beli kopi 40 ribu tiap pagi biar berasa anak senja estetis. Ujung-ujungnya lambung menjerit pas tanggal tua cuma mampu beli mie instan rasa soto. Kopi elite, makan melilit! ☕️💀",
  selfreward: "Mengerjakan tugas sepele 15 menit tapi 'self-reward' belanja baju branded 1.5 juta. Itu bukan reward sayang, itu sabotase finansial! Hati-hati rungkad sebelum waktunya! 🛍️🔥",
  gofood: "Gofood martabak manis jam 11 malem pakai promo ongkir 2 ribu rupiah. Makanan dateng, dompet kosong, berat badan nambah. Paket lengkap menuju kemiskinan dan obesitas! 🍕🛵",
};

export function FeaturesSection() {
  const [survivalSlider, setSurvivalSlider] = useState(72);
  const [bentoRoastTopic, setBentoRoastTopic] = useState<"kopi" | "selfreward" | "gofood">("kopi");

  const getSurvivalStatus = (score: number) => {
    if (score >= 70) return { label: "Aman Banget! Dompet Tebal 😎", color: "text-emerald-600", stroke: "#10b981" };
    if (score >= 40) return { label: "Waspada! Rem Jajannya ⚠️", color: "text-amber-500", stroke: "#f59e0b" };
    return { label: "🚨 Kritis! Otw Makan Promag", color: "text-rose-500", stroke: "#f43f5e" };
  };

  const survivalInfo = getSurvivalStatus(survivalSlider);

  const dashArray = 125.66;
  const dashOffset = dashArray - (survivalSlider / 100) * dashArray;

  return (
    <section id="features" className="py-24 px-6 bg-white border-t border-b border-slate-100 relative overflow-hidden">

      {/* Background soft grid pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto mb-16 text-center">
        <RevealSection>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 tracking-tight font-sans leading-[1.15]">
            Satu Aplikasi. Segudang Kendali.
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium text-sm md:text-[15px] tracking-tight leading-relaxed">
            BonSync membuang semua grafik rumit dan kaku, menggantinya dengan kontrol cerdas, visual game, dan kritik yang membumi.
          </p>
        </RevealSection>
      </div>

      {/* BENTO GRID LAYOUT */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Card 1: Scanner Struk Instan AI */}
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-[28px] p-7 md:p-9 relative overflow-hidden flex flex-col justify-between min-h-[400px] group shadow-sm hover:border-slate-200/80 transition-all duration-300">

          <div className="max-w-md relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-semibold px-2.5 py-0.5 rounded-full mb-5 select-none">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              OCR AI Engine
            </div>

            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-3 tracking-tight">
              Scanner Struk Instan AI
            </h3>
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed tracking-tight">
              Ambil foto struk belanjaanmu. Sistem kecerdasan buatan (OCR) kami langsung menguraikan gambar buram sekalipun menjadi teks terstruktur berupa nama item, harga, pajak, dan detail transaksi secara akurat.
            </p>
          </div>

          {/* Clean Flat visual representation */}
          <div className="relative w-full flex justify-end items-end h-36 overflow-visible select-none pr-4 md:pr-10 mt-6 md:mt-0">

            {/* Floating OCR Tag 1 */}
            <div className="absolute left-4 top-2 z-20 backdrop-blur-md bg-white/80 border border-slate-150 shadow-sm rounded-full px-3 py-1 text-[9px] font-semibold text-slate-700 flex items-center gap-1.5 transition-transform duration-300 group-hover:translate-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Confidence: 99.8%</span>
            </div>

            {/* Floating OCR Tag 2 */}
            <div className="absolute left-32 bottom-20 z-20 backdrop-blur-md bg-white/80 border border-slate-150 shadow-sm rounded-full px-3 py-1 text-[9px] font-semibold text-slate-700 flex items-center gap-1.5 transition-transform duration-300 group-hover:-translate-x-1">
              <span>🏷️ Merchant: Sedap Rasa</span>
            </div>

            {/* Sleek Minimalist Receipt Card */}
            <div className="w-64 bg-white border border-slate-150 rounded-[16px] p-4 shadow-sm translate-y-4 group-hover:translate-y-2 transition-all duration-300 relative z-10">

              <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-800 font-mono">SEDAP RASA RESTO</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">Rp 172.000</span>
              </div>
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between text-[9px] text-slate-500 font-medium">
                  <span>2x Nasi Goreng Spesial</span>
                  <span>Rp 70.000</span>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-medium">
                  <span>1x Gurame Bakar Madu</span>
                  <span>Rp 85.000</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Interactive Survival Gauge */}
        <div className="bg-white border border-slate-100 rounded-[28px] p-7 relative overflow-hidden flex flex-col justify-between min-h-[400px] shadow-sm hover:border-slate-200/80 transition-all duration-300">
          <div>
            <div className="w-10 h-10 bg-slate-50 rounded-[12px] flex items-center justify-center border border-slate-100 mb-5">
              <TrendingDown className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-3 tracking-tight">
              Survival Score Game
            </h3>
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed tracking-tight">
              Geser slider pengeluaran di bawah untuk melihat sisa nyawa budget kamu bulan ini ala video game!
            </p>
          </div>

          {/* Speedometer semi-circular gauge */}
          <div className="flex flex-col items-center gap-6 py-2 select-none w-full">
            <div className="relative w-36 h-24 flex items-center justify-center overflow-hidden">
              <svg className="w-36 h-36 absolute top-0" viewBox="0 0 100 100">
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke={survivalInfo.stroke}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${dashArray}`}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-500 ease-out"
                />
              </svg>

              <div className="absolute bottom-0 flex flex-col items-center">
                <span className="text-2xl font-bold tracking-tight transition-colors" style={{ color: survivalInfo.stroke }}>
                  {survivalSlider}%
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5 font-sans">Survival Rate</span>
              </div>
            </div>

            {/* Slider & Label */}
            <div className="w-full flex flex-col items-center gap-2">
              <span className={`text-[10px] font-semibold ${survivalInfo.color} transition-colors bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-100`}>
                {survivalInfo.label}
              </span>

              <input
                type="range"
                min="5"
                max="100"
                value={survivalSlider}
                onChange={(e) => setSurvivalSlider(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-500 focus:outline-none border border-transparent shadow-inner transition-colors hover:bg-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Smart Split Bill */}
        <div className="bg-white border border-slate-100 rounded-[28px] p-7 relative overflow-hidden flex flex-col justify-between min-h-[400px] shadow-sm hover:border-slate-200/80 transition-all duration-300">
          <div>
            <div className="w-10 h-10 bg-slate-50 rounded-[12px] flex items-center justify-center border border-slate-100 mb-5">
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-3 tracking-tight">
              Smart Split Bill
            </h3>
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed tracking-tight">
              Tidak perlu kalkulator berjam-jam untuk membagi porsi makan rame-rame. Cukup tunjuk mana item punyamu dan bagikan langsung lewat WhatsApp.
            </p>
          </div>

          {/* Split Bill visual representation */}
          <div className="flex flex-col gap-3 select-none border-t border-slate-50 pt-5">
            <div className="flex justify-between items-center bg-slate-50/50 border border-slate-100 p-3 rounded-[16px]">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-800 tracking-tight">Dimsum Platter</span>
                <span className="text-[9px] font-medium text-slate-500 mt-0.5">Rp 105.000 (Bagi Rata)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-sky-50 border border-sky-100 text-sky-700 font-semibold px-2 py-0.5 rounded-full font-sans">
                  33.3% / org
                </span>

                {/* Flat pastel avatars stack */}
                <div className="flex -space-x-1.5 group/avatars transition-all duration-300 hover:-space-x-0.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 border border-white flex items-center justify-center text-[8px] font-bold text-emerald-700 shadow-sm transition-transform duration-300 hover:scale-105 hover:z-10 cursor-pointer">U</div>
                  <div className="w-6 h-6 rounded-full bg-indigo-50 border border-white flex items-center justify-center text-[8px] font-bold text-indigo-700 shadow-sm transition-transform duration-300 hover:scale-105 hover:z-10 cursor-pointer">BD</div>
                  <div className="w-6 h-6 rounded-full bg-rose-50 border border-white flex items-center justify-center text-[8px] font-bold text-rose-700 shadow-sm transition-transform duration-300 hover:scale-105 hover:z-10 cursor-pointer">ST</div>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 font-medium text-center tracking-tight">Pajak & service otomatis dibagi secara adil!</p>
          </div>
        </div>

        {/* Card 4: Roasting Playground */}
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-[28px] p-7 md:p-9 relative overflow-hidden flex flex-col justify-between min-h-[400px] shadow-sm hover:border-slate-200/80 transition-all duration-300">

          <div className="max-w-md relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-pink-50 border border-pink-100 text-pink-600 text-[10px] font-semibold px-2.5 py-0.5 rounded-full mb-5">
              <Flame className="w-3 h-3 text-pink-600" />
              Roasting Finansial
            </div>

            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-3 tracking-tight">
              AI Roast Generator Gaul
            </h3>
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed tracking-tight">
              Ingin tahu seberapa parah pola jajanmu? Coba ketuk salah satu kebiasaan impulsif di bawah ini untuk melihat contoh ejekan sarkas khas AI BonSync!
            </p>
          </div>

          {/* Interactive Selector & Speech bubble */}
          <div className="w-full flex flex-col lg:flex-row gap-5 items-stretch border-t border-slate-50 pt-5 select-none mt-5 lg:mt-0">

            <div className="flex flex-row lg:flex-col gap-1.5 shrink-0 w-full lg:w-44 flex-wrap bg-slate-50 p-1 rounded-[16px] border border-slate-100">
              <button
                onClick={() => setBentoRoastTopic("kopi")}
                className={`flex-1 lg:flex-none text-[11px] font-semibold px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer text-center ${bentoRoastTopic === "kopi"
                  ? "bg-white text-slate-800 shadow-sm border border-slate-100"
                  : "bg-transparent text-slate-500 hover:text-slate-700"
                  }`}
              >
                ☕ Kopi Estetik
              </button>
              <button
                onClick={() => setBentoRoastTopic("selfreward")}
                className={`flex-1 lg:flex-none text-[11px] font-semibold px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer text-center ${bentoRoastTopic === "selfreward"
                  ? "bg-white text-slate-800 shadow-sm border border-slate-100"
                  : "bg-transparent text-slate-500 hover:text-slate-700"
                  }`}
              >
                🛍️ Self-Reward
              </button>
              <button
                onClick={() => setBentoRoastTopic("gofood")}
                className={`flex-1 lg:flex-none text-[11px] font-semibold px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer text-center ${bentoRoastTopic === "gofood"
                  ? "bg-white text-slate-800 shadow-sm border border-slate-100"
                  : "bg-transparent text-slate-500 hover:text-slate-700"
                  }`}
              >
                🛵 Gofood Malam
              </button>
            </div>

            {/* Flat speech bubble */}
            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-[16px] p-5 relative flex items-center gap-3 w-full min-h-[90px]">
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-sm shadow-sm shrink-0 select-none">
                💀
              </div>
              <p className="text-[12px] font-medium text-slate-600 italic leading-relaxed tracking-tight flex-1">
                "{roastDatabase[bentoRoastTopic]}"
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
