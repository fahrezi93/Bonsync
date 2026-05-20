import { LoginForm } from "@/components/login-form";
import type { Metadata } from "next";

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

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-transparent px-4 py-8">
      <div className="w-full max-w-sm space-y-8 animate-fade-in-up">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 shadow-xl shadow-slate-900/20">
            <span className="text-2xl font-black tracking-tighter text-white">B</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">BonSync</h1>
          <p className="text-sm font-medium text-slate-500">
            Catat pengeluaran, split bill, roasting AI
          </p>
        </div>

        {errorParam === "auth_callback_failed" && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Verifikasi email gagal. Coba login ulang atau minta link baru.
          </div>
        )}

        {errorParam === "auth_link_expired" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Link verifikasi sudah kedaluwarsa atau sudah pernah dipakai. Login jika email sudah terverifikasi, atau kirim ulang link konfirmasi.
          </div>
        )}

        {verifiedParam === "1" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Email berhasil diverifikasi. Sekarang kamu bisa login.
          </div>
        )}

        <LoginForm next={next} />
      </div>
    </div>
  );
}
