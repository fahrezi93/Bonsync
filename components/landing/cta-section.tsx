"use client";

import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";
import { RevealSection } from "./reveal-section";

export function CTASection() {
  return (
    <section className="py-24 px-6 relative overflow-hidden bg-white border-t border-slate-100 z-10">

      {/* Background soft grid pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">

        <RevealSection delay={0} className="flex flex-col items-center">

          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-slate-800 leading-[1.15] mb-5 font-sans max-w-2xl">
            Siap untuk <span className="text-emerald-600">Reality Check</span> Keuanganmu?
          </h2>
          <p className="text-slate-500 text-sm md:text-[16px] mb-10 font-medium tracking-tight leading-relaxed max-w-xl">
            Bergabunglah bersama ribuan anak muda lainnya yang sudah tobat jajan berlebih. 100% Gratis. Tanpa kartu kredit.
          </p>

          {/* Action Buttons Row */}
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center mb-16">
            {/* Primary Button */}
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-7 py-3.5 rounded-full text-[13px] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 tracking-tight font-sans cursor-pointer"
            >
              Daftar & Mulai Sekarang
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Secondary Button */}
            <Link
              href="#features"
              className="inline-flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold px-7 py-3.5 rounded-full text-[13px] transition-all duration-300 hover:-translate-y-0.5 tracking-tight font-sans cursor-pointer"
            >
              Pelajari Fitur
            </Link>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
