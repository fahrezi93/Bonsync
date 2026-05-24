"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "py-2" : "py-6"
        }`}
    >
      <div
        className={`mx-auto flex items-center justify-between transition-all duration-500 ${scrolled
            ? "max-w-4xl px-6 py-3 bg-white/95 backdrop-blur-xl rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.06)] w-[92%] mt-2"
            : "max-w-6xl px-6 py-2 bg-transparent w-full"
          }`}
      >
        {/* Logo - Rich Emerald brand presence */}
        <Link href="/" className="flex items-center gap-2 group tracking-tight select-none">
          <span className="text-[#21164c] font-bold text-[15px] group-hover:text-emerald-600 transition-colors">
            Bon<span className="text-emerald-500">Sync</span>
          </span>
        </Link>

        {/* Navigation Links - Plus Jakarta Sans & Slate Text with -0.02em tracking */}
        <nav className="hidden md:flex items-center gap-6 bg-[#f4f4f3]/80 hover:bg-[#f4f4f3] transition-colors px-6 py-2 rounded-full backdrop-blur-sm">
          <Link
            href="#features"
            className="text-[12px] font-medium text-[#353241] hover:text-[#21164c] transition-colors tracking-tight"
          >
            Fitur
          </Link>
          <Link
            href="#how-it-works"
            className="text-[12px] font-medium text-[#353241] hover:text-[#21164c] transition-colors tracking-tight"
          >
            Cara Kerja
          </Link>
          <Link
            href="#benefits"
            className="text-[12px] font-medium text-[#353241] hover:text-[#21164c] transition-colors tracking-tight"
          >
            Benefit
          </Link>
          <Link
            href="#why-us"
            className="text-[12px] font-medium text-[#353241] hover:text-[#21164c] transition-colors tracking-tight"
          >
            FAQ
          </Link>
        </nav>

        {/* Primary Action Button - Adora spec: rounded-full, Action Green, Plus Jakarta Sans */}
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-[12px] font-medium transition-all duration-300 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow hover:-translate-y-0.5 tracking-tight cursor-pointer"
        >
          Mulai Gratis
        </Link>
      </div>
    </header>
  );
}
