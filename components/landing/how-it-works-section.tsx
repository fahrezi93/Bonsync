/* eslint-disable react/no-unescaped-entities */
"use client";

import { Sliders, Scan, UserCheck, Flame } from "lucide-react";
import { RevealSection } from "./reveal-section";

export function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Set Budget Bulanan",
      desc: "Tentukan batas pengeluaran jajanmu bulan ini di dasbor dalam hitungan detik.",
      icon: <Sliders className="size-5" />,
      widget: (
        <div className="w-full mt-6 bg-slate-50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-semibold">Budget Jajan</span>
            <span className="text-xs text-emerald-600 font-bold">Rp 1.500.000</span>
          </div>
          {/* Custom Sleek Slider Mockup */}
          <div className="w-full h-1.5 bg-[#e0e0db]/50 rounded-full overflow-hidden relative mb-2">
            <div className="absolute left-0 top-0 bottom-0 w-[65%] bg-emerald-500 rounded-full" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-500 font-semibold">Tersisa 35%</span>
            <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold px-2 py-0.5 rounded-md">Aman 🍀</span>
          </div>
        </div>
      )
    },
    {
      num: "02",
      title: "Jepret / Scan Struk",
      desc: "Foto struk belanja pas nongkrong, biarkan AI membaca nominalnya secara instan.",
      icon: <Scan className="size-5" />,
      widget: (
        <div className="w-full mt-6 bg-slate-50 rounded-xl p-4 relative overflow-hidden">
          {/* Simulated Scanner Viewport */}
          <div className="border border-dashed border-amber-300/60 rounded-lg p-2.5 flex flex-col items-center justify-center relative bg-[#fafafa]">
            {/* Pulsing Scan Laser Line */}
            <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent top-1/2 -translate-y-1/2 animate-bounce pointer-events-none" />
            <div className="text-[10px] text-amber-600 font-bold tracking-wider mb-1">
              Scanning…
            </div>
            <div className="text-xs text-slate-700 font-bold">
              Sedap Rasa Cafe
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              Rp 145.000
            </div>
          </div>
        </div>
      )
    },
    {
      num: "03",
      title: "Split / Simpan Instan",
      desc: "Bagi tagihan bareng temen secara adil atau langsung masukan ke riwayat.",
      icon: <UserCheck className="size-5" />,
      widget: (
        <div className="w-full mt-6 bg-slate-50 rounded-xl p-4">
          <div className="text-[10px] text-slate-500 font-semibold mb-2">Bagi Tagihan</div>
          <div className="flex gap-1.5 items-center">
            {/* Mini Avatar Stack */}
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 border border-white flex items-center justify-center text-[10px] font-bold text-emerald-700">K</div>
              <div className="w-6 h-6 rounded-full bg-[#bcf2ff]/80 border border-white flex items-center justify-center text-[10px] font-bold text-slate-700">T</div>
            </div>
            <div className="w-[1px] h-6 bg-[#e0e0db]/60 mx-1" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-700 font-semibold">Patungan</span>
                <span className="text-[11px] text-emerald-600 font-bold">50 / 50</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      num: "04",
      title: "Baca AI Roast",
      desc: "Tahan mental membaca ejekan finansial kami biar makin hemat dan tersadar.",
      icon: <Flame className="size-5" />,
      widget: (
        <div className="w-full mt-6 bg-slate-50 rounded-xl p-4 relative overflow-hidden">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-rose-600 font-bold tracking-wider flex items-center gap-1">
              🔥 Roasting
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          </div>
          <p className="text-[9.5px] font-bold text-[#353241] leading-relaxed italic bg-rose-50/50 p-2 rounded-lg border border-rose-100/50">
            "Beli boba 40rb per hari tapi nangis pas kuota abis. Otakmu kemana bos? 💀"
          </p>
        </div>
      )
    }
  ];

  return (
    <section id="how-it-works" className="py-28 px-6 bg-white border-b border-[#e0e0db] relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[450px] h-[450px] bg-gradient-to-br from-[#bcf2ff]/10 to-[#ffaae6]/10 rounded-full blur-[120px] pointer-events-none z-0" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <RevealSection className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-[#21164c] mb-6 tracking-tight font-sans leading-[1.10]">
            Cara Kerja BonSync
          </h2>
          <p className="text-[#353241]/80 font-medium max-w-lg mx-auto text-sm md:text-[16px] tracking-tight leading-relaxed">
            Empat langkah instan menuju pengelolaan dompet sehat dan bebas dari jebakan rungkad finansial.
          </p>
        </RevealSection>

        {/* Tactile Asymmetric Grid Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 relative">
          {/* Connecting line for larger screens */}
          <div className="hidden lg:block absolute top-[60px] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-emerald-100 via-amber-100 to-rose-100 -z-10" />

          {steps.map((step, i) => (
            <RevealSection key={step.title} delay={i * 100}>
              {/* Minimalist Flat Card */}
              <div className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-6 relative flex flex-col justify-between items-start text-left group transition-colors duration-300 h-full min-h-[320px]">
                <div className="w-full">
                  <div className="mb-6 text-slate-800">
                    {step.icon}
                  </div>

                  <div className="flex items-center gap-3 mb-2.5">
                    <span className="text-xs font-bold text-slate-400">
                      {step.num}
                    </span>
                    <h4 className="text-base font-bold text-slate-800 tracking-tight transition-colors">
                      {step.title}
                    </h4>
                  </div>
                  
                  <p className="text-sm text-slate-500 leading-relaxed font-medium tracking-tight">
                    {step.desc}
                  </p>
                </div>

                {/* Built-in Realistic Mock Widget */}
                {step.widget}
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}
