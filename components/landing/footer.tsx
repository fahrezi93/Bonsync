"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-20 pb-12 px-6 relative overflow-hidden z-10">
      <div className="max-w-6xl mx-auto">
        {/* Main Multi-Column Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pb-12 border-b border-slate-100">

          {/* Column 1: Brand & Mission (Span 5) */}
          <div className="md:col-span-5 flex flex-col items-start gap-4">
            <Link href="/" className="flex items-center gap-2 group tracking-tight select-none">
              <span className="text-slate-800 font-bold text-[22px] transition-colors">
                Bon<span className="text-emerald-500">Sync</span>
              </span>
            </Link>
            <p className="text-slate-500 text-[13px] font-medium leading-relaxed tracking-tight max-w-sm">
              Misi kami sederhana: Menyelamatkan dompet generasi muda dari kepunahan akibat boba, kopi kekinian, dan belanja sneakers impulsif. Cerdas finansial secara menyenangkan dengan humor realistik.
            </p>
          </div>

          {/* Column 2: Fitur Utama (Span 2) */}
          <div className="md:col-span-2 flex flex-col items-start gap-3">
            <h5 className="text-[12px] font-bold text-slate-800 tracking-tight mb-1">
              Fitur Utama
            </h5>
            <div className="flex flex-col gap-2.5">
              <Link href="#features" className="text-[12.5px] font-medium text-slate-500 hover:text-emerald-600 transition-colors tracking-tight">
                Scan Struk AI
              </Link>
              <Link href="#features" className="text-[12.5px] font-medium text-slate-500 hover:text-emerald-600 transition-colors tracking-tight">
                Patungan Split Bill
              </Link>
              <Link href="#features" className="text-[12.5px] font-medium text-slate-500 hover:text-emerald-600 transition-colors tracking-tight">
                AI Roasting Keuangan
              </Link>
              <Link href="#features" className="text-[12.5px] font-medium text-slate-500 hover:text-emerald-600 transition-colors tracking-tight">
                Survival Score Gauge
              </Link>
            </div>
          </div>

          {/* Column 3: Sumber Daya (Span 2) */}
          <div className="md:col-span-2 flex flex-col items-start gap-3">
            <h5 className="text-[12px] font-bold text-slate-800 tracking-tight mb-1">
              Sumber Daya
            </h5>
            <div className="flex flex-col gap-2.5">
              <Link href="#how-it-works" className="text-[12.5px] font-medium text-slate-500 hover:text-emerald-600 transition-colors tracking-tight">
                Cara Kerja
              </Link>
              <Link href="#why-us" className="text-[12.5px] font-medium text-slate-500 hover:text-emerald-600 transition-colors tracking-tight">
                Pertanyaan FAQ
              </Link>
              <Link href="#" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-slate-500 hover:text-emerald-600 transition-colors tracking-tight">
                Komunitas
                <ArrowUpRight className="w-3 h-3 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Column 4: Perusahaan & Legal (Span 3) */}
          <div className="md:col-span-3 flex flex-col items-start gap-3">
            <h5 className="text-[12px] font-bold text-slate-800 tracking-tight mb-1">
              Hukum & Hubungan
            </h5>
            <div className="flex flex-col gap-2.5">
              <Link href="/privacy" className="text-[12.5px] font-medium text-slate-500 hover:text-emerald-600 transition-colors tracking-tight">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-[12.5px] font-medium text-slate-500 hover:text-emerald-600 transition-colors tracking-tight">
                Terms of Service
              </Link>
              <a href="mailto:support@bonsync.com" className="text-[12.5px] font-medium text-slate-500 hover:text-emerald-600 transition-colors tracking-tight">
                Hubungi Kami
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 select-none">
          <p className="text-slate-400 text-[12px] font-medium tracking-tight">
            © {new Date().getFullYear()} BonSync. Cerdas Berbelanja & Hemat Maksimal.
          </p>
        </div>

      </div>
    </footer>
  );
}
