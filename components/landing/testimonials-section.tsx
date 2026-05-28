/* eslint-disable react/no-unescaped-entities */
"use client";

import { Star } from "lucide-react";
import { RevealSection } from "./reveal-section";

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Kevin Arroyan",
      role: "Alumni Nombok Bukber",
      text: "Fitur split bill-nya gokil sih. Biasanya kalau abis makan rame-rame ngitung pajaknya pusing kepala, sekarang tinggal scan, tunjuk makanan, kelar!",
      status: "🛡️ Verified Tobat",
      statusColor: "bg-emerald-50 text-emerald-600 border-emerald-100/60",
      avatarBg: "bg-emerald-50 text-emerald-700",
      initial: "K"
    },
    {
      name: "Nadya Rahma",
      role: "Coffee Shop Enthusiast",
      text: "Survival Score beneran ngebantu visualisasiin budget jajan bulanan kayak nyawa game. Ditambah ejekan roast AI-nya beneran bikin ngerasa bersalah pas jajan.",
      status: "🔥 Ter-roast 48x",
      statusColor: "bg-rose-50 text-rose-600 border-rose-100/60",
      avatarBg: "bg-rose-50 text-rose-700",
      initial: "N"
    },
    {
      name: "Reza Fahrezi",
      role: "Freelancer Impulsif",
      text: "Akhirnya ada pencatat pengeluaran yang nggak kaku. Desain antarmukanya clean banget, premium kayak aplikasi berbayar padahal gratis 100%!",
      status: "💎 Budget Aman",
      statusColor: "bg-sky-50 text-sky-600 border-sky-100/60",
      avatarBg: "bg-sky-50 text-sky-700",
      initial: "R"
    },
  ];

  return (
    <section id="why-us" className="py-24 px-6 bg-slate-50/40 border-b border-slate-100 relative overflow-hidden">
      <div className="max-w-6xl mx-auto text-center mb-16 relative z-10">
        <RevealSection>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 tracking-tight font-sans leading-[1.15]">
            Kata Mereka yang Sudah Tobat
          </h2>
          <p className="text-slate-500 font-medium max-w-lg mx-auto text-sm md:text-[15px] tracking-tight leading-relaxed">
            Mendengar cerita asli dari para pejuang penabung yang berhasil bangkit dari lembah pemborosan jajan harian.
          </p>
        </RevealSection>
      </div>
      
      {/* Clean Grid Wall */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 pb-4 relative z-10">
        {testimonials.map((t, i) => (
          <RevealSection key={t.name} delay={i * 100}>
            {/* Minimalist card with soft border and subtle hover */}
            <div className="bg-white border border-slate-100 rounded-[24px] p-7 shadow-sm hover:border-slate-200/80 transition-all duration-300 flex flex-col justify-between h-full group">
              <div>
                {/* Top Stars & Badge */}
                <div className="flex justify-between items-center mb-5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="size-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>

                  {/* Status Badge */}
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border tracking-tight ${t.statusColor}`}>
                    {t.status}
                  </span>
                </div>

                <p className="text-slate-600 text-[13.5px] font-medium leading-relaxed mb-6 tracking-tight relative z-10">
                  "{t.text}"
                </p>
              </div>
              
              {/* User Identity Footer Card */}
              <div className="flex items-center gap-3 border-t border-slate-50 pt-5 mt-auto">
                {/* Minimalist Flat Avatar */}
                <div className={`size-9 rounded-full ${t.avatarBg} flex items-center justify-center font-bold text-[12px] select-none transition-transform duration-300 group-hover:scale-105`}>
                  {t.initial}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-800 leading-none tracking-tight group-hover:text-emerald-600 transition-colors">
                    {t.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 tracking-tight">
                    {t.role}
                  </p>
                </div>
              </div>
            </div>
          </RevealSection>
        ))}
      </div>
    </section>
  );
}
