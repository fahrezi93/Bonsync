import { LoginForm } from "@/components/login-form";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Login — BonSync",
  description: "Masuk ke akun BonSync kamu.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const next = String(params.next ?? "/");
  const errorParam = params.error ? String(params.error) : undefined;
  const verifiedParam = params.verified ? String(params.verified) : undefined;
  const emailParam = params.email ? String(params.email) : undefined;

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-[#bcf2ff]/30 via-[#dfff9d]/20 to-[#ffaae6]/30 px-4 py-16 relative overflow-hidden">

      {/* Floating Ambient Glow Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] left-[20%] size-[350px] bg-emerald-100/40 rounded-full blur-[100px] animate-pulse duration-[6000ms]" />
        <div className="absolute bottom-[10%] right-[15%] size-[400px] bg-rose-100/30 rounded-full blur-[120px] animate-pulse duration-[8000ms]" />
      </div>

      {/* Floating 'Back to Home' Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200/50 bg-white/70 backdrop-blur-md text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-white shadow-sm transition-all duration-300 z-50"
      >
        <ArrowLeft className="size-4" />
        Kembali ke Beranda
      </Link>

      <div className="w-full max-w-sm space-y-8 animate-fade-in-up relative z-10">

        {/* Brand Re-Branded Emblem & Typography */}
        <div className="text-center space-y-3 select-none">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-none">
              Bon<span className="text-emerald-500">Sync</span>
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Catat Pengeluaran • Split Bill • AI Roasting
            </p>
          </div>
        </div>

        {/* Verification & Error Banners */}
        {errorParam === "auth_callback_failed" && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/90 backdrop-blur-sm px-4 py-3 text-xs font-bold text-rose-700 shadow-sm animate-fade-in-up">
            Verifikasi email gagal. Coba login ulang atau minta link baru.
          </div>
        )}

        {errorParam === "auth_link_expired" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 backdrop-blur-sm px-4 py-3 text-xs font-bold text-amber-700 shadow-sm animate-fade-in-up">
            Link verifikasi sudah kedaluwarsa atau sudah pernah dipakai. Login jika email sudah terverifikasi, atau kirim ulang link konfirmasi.
          </div>
        )}

        {verifiedParam === "1" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 backdrop-blur-sm px-4 py-3 text-xs font-bold text-emerald-700 shadow-sm animate-fade-in-up">
            Email berhasil diverifikasi. Sekarang kamu bisa login.
          </div>
        )}

        {/* Premium LoginForm Glass Box */}
        <LoginForm next={next} defaultEmail={emailParam} />

      </div>
    </div>
  );
}
