"use client";

/* eslint-disable react/no-unescaped-entities */
import {
  Camera,
  Flame,
  Coins,
  Activity,
  CheckCircle2
} from "lucide-react";
import { RevealSection } from "./reveal-section";

export function BenefitsSection() {
  return (
    <section id="benefits" className="py-28 px-6 bg-[#ffffff] relative overflow-hidden border-t border-[#e0e0db]">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#bcf2ff]/20 to-[#ffaae6]/10 rounded-full blur-[130px] pointer-events-none z-0" />
      
      <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        
        {/* Left Side: Copywriting & Feature Blocks */}
        <RevealSection>
          
          <h2 className="text-3xl md:text-5xl font-bold text-[#21164c] mb-6 tracking-tight leading-[1.10] font-sans">
            Bukan Sekadar Aplikasi Catatan Keuangan Biasa.
          </h2>
          
          <p className="text-[#353241] text-base md:text-[18px] mb-10 leading-relaxed font-medium tracking-tight">
            Kami tahu mencatat keuangan konvensional itu membosankan. Grafiknya kaku, fiturnya terlalu rumit untuk jajan harian, dan ujung-ujungnya terlupakan. BonSync dirancang khusus agar mencatat keuangan terasa menyenangkan, interaktif, dan penuh humor.
          </p>
          
          {/* Redesigned Taktil Benefit Feature Blocks */}
          <div className="flex flex-col gap-5">
            {[
              {
                title: "Bebas Ketik Manual",
                desc: "Cukup foto struk, sistem AI kami yang berberes mengekstrak nama dan nominal harga secara instan.",
                icon: <Camera className="w-5 h-5 text-slate-700" />
              },
              {
                title: "Kritik Tajam & Realistis",
                desc: "Fitur Roasting AI mendidik kesadaran belanja lewat ejekan logis bahasa gaul.",
                icon: <Flame className="w-5 h-5 text-slate-700" />
              },
              {
                title: "Kalkulator Patungan Adil",
                desc: "Pajak, diskon, dan tips dibagi otomatis secara proporsional sesuai item yang dimakan.",
                icon: <Coins className="w-5 h-5 text-slate-700" />
              }
            ].map((item, i) => (
              <div
                key={i}
                className="flex gap-5 items-start py-4 group cursor-pointer"
              >
                <div className="mt-0.5 shrink-0 transition-transform duration-300 group-hover:-translate-y-1">
                  {item.icon}
                </div>
                <div>
                  <h5 className="font-bold text-base mb-1 text-slate-800 tracking-tight transition-colors">
                    {item.title}
                  </h5>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed tracking-tight">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </RevealSection>
        
        {/* Right Side: Showcase Feed (Redesigned layered overlap) */}
        <RevealSection delay={200} className="relative w-full max-w-lg mx-auto md:mr-0">
          
          {/* Premium Mesh Gradient Canvas Wrapper */}
          <div className="bg-gradient-to-br from-[#bcf2ff]/80 via-[#dfff9d]/55 to-[#ffaae6]/40 rounded-[48px] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-[#e0e0db]/45 relative overflow-hidden group">
            
            {/* Ambient soft glow internally */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-white/30 rounded-full blur-2xl pointer-events-none -z-10" />
            
            {/* Header: Pulsating Live tag */}
            <div className="flex justify-between items-center mb-8 select-none">
              <h4 className="text-xs font-semibold text-slate-700 tracking-wider">
                Live AI Roast Feed
              </h4>
              
              <span className="flex items-center gap-1.5 bg-white/70 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/50 text-xs font-semibold text-rose-600 shadow-none">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute" />
                Stream Active
              </span>
            </div>
            
            {/* Layered 3D Overlapping Feed Container */}
            <div className="flex flex-col gap-4 relative">
              
              {/* Card 1: Top Stack (Relative z-20) */}
              <div className="bg-white p-5.5 rounded-[22px] border border-[#e0e0db]/50 shadow-[0_12px_30px_rgba(0,0,0,0.02)] relative z-20 transform rotate-1 transition-all duration-500 hover:rotate-0 hover:scale-[1.02]">
                
                {/* Data Badges */}
                <div className="flex gap-2 mb-3 select-none">
                  <span className="text-[10px] bg-rose-50 border border-rose-200/50 text-rose-650 font-semibold px-2 py-0.5 rounded-full">
                    🔴 Score: 19% • Kritis
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                    🛍️ Sneakers
                  </span>
                </div>
                
                <p className="text-xs font-semibold leading-relaxed italic text-slate-700 tracking-tight">
                  "Self-reward beli sneakers 2 juta padahal tabungan cuma cukup buat nambal ban ojek seminggu. Itu bukan self-reward bos, itu sabotase masa depan! 💀"
                </p>
                <span className="text-[10px] text-slate-500 font-medium block mt-3">
                  — User Roasting #19
                </span>
              </div>
              
              {/* Card 2: Middle Stack (Relative z-10, slightly translated) */}
              <div className="bg-white/95 p-5.5 rounded-[22px] border border-[#e0e0db]/50 shadow-[0_12px_30px_rgba(0,0,0,0.02)] relative z-10 -mt-2 translate-x-2 -rotate-1 transition-all duration-500 hover:rotate-0 hover:translate-x-0 hover:scale-[1.02]">
                
                {/* Data Badges */}
                <div className="flex gap-2 mb-3 select-none">
                  <span className="text-[10px] bg-amber-50 border border-amber-200/50 text-amber-600 font-semibold px-2 py-0.5 rounded-full">
                    🟡 Score: 42% • Waspada
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                    ☕ Kopi
                  </span>
                </div>

                <p className="text-xs font-semibold leading-relaxed italic text-slate-700 tracking-tight">
                  "Checkout kopi kekinian 45 ribu tiap sore tapi pas temen minjem cepek bilangnya lagi seret & pura-pura pingsan. Hati-hati lambung manis dompet tragis! ☕"
                </p>
                <span className="text-[10px] text-slate-500 font-medium block mt-3">
                  — User Roasting #42
                </span>
              </div>

              {/* Card 3: Bottom Stack (Relative z-0, cut-off at bottom for continuous stream effect) */}
              <div className="bg-white/80 p-5.5 rounded-[22px] border border-[#e0e0db]/40 shadow-sm relative z-0 -mt-2 translate-x-4 rotate-1 max-h-[85px] overflow-hidden opacity-50 transition-all duration-500 hover:opacity-85 hover:rotate-0">
                
                {/* Data Badges */}
                <div className="flex gap-2 mb-3 select-none">
                  <span className="text-[10px] bg-emerald-50 border border-emerald-200/50 text-emerald-600 font-semibold px-2 py-0.5 rounded-full">
                    🟢 Score: 85% • Aman
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                    🧋 Boba
                  </span>
                </div>

                <p className="text-xs font-semibold leading-relaxed italic text-slate-700 tracking-tight">
                  "Wah rajin jajan tapi masih aman jaya sentosa. Tapi inget, boba tiap hari bisa bikin saldo dan gula darah kompak melonjak ya! 🧋"
                </p>
                <span className="text-[10px] text-slate-500 font-medium block mt-3">
                  — User Roasting #63
                </span>
              </div>

            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
