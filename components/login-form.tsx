"use client";

import { useActionState, useState, useEffect } from "react";
import { Loader2, Mail, Lock, Eye, EyeOff, CheckCircle, RefreshCw, Sparkle } from "lucide-react";
import {
  signIn,
  signUp,
  resendConfirmationEmail,
  type AuthActionState,
} from "@/actions/auth-actions";

const initialState: AuthActionState = {};

interface LoginFormProps {
  next: string;
}

export function LoginForm({ next }: LoginFormProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loginState, loginAction, loginPending] = useActionState(
    signIn,
    initialState,
  );
  const [registerState, registerAction, registerPending] = useActionState(
    signUp,
    initialState,
  );
  const [resendState, resendAction, resendPending] = useActionState(
    resendConfirmationEmail,
    initialState,
  );

  const pending = loginPending || registerPending;
  const state = mode === "login" ? loginState : registerState;
  const action = mode === "login" ? loginAction : registerAction;

  // Reset password saja saat ada error — email tetap dipertahankan
  useEffect(() => {
    if (state.error) {
      setPassword("");
      setConfirmPassword("");
    }
  }, [state.error]);

  // Tampilkan tombol resend jika error berisi "belum dikonfirmasi"
  const showResendButton =
    mode === "login" &&
    loginState.error?.toLowerCase().includes("belum dikonfirmasi");

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] space-y-6 relative overflow-hidden">
      
      {/* Ambient decorative spot inside card */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/20 rounded-full blur-xl pointer-events-none -z-10" />

      {/* Tab switcher */}
      <div className="flex rounded-full border border-slate-200/60 bg-slate-100/50 p-1 backdrop-blur-sm select-none">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setShowResend(false);
          }}
          className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-all duration-300 cursor-pointer ${
            mode === "login"
              ? "bg-white text-emerald-600 shadow-sm border border-slate-200/30"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Masuk
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setShowResend(false);
          }}
          className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-all duration-300 cursor-pointer ${
            mode === "register"
              ? "bg-white text-emerald-600 shadow-sm border border-slate-200/30"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Daftar
        </button>
      </div>

      {/* Success state (register) */}
      {registerState.success && mode === "register" ? (
        <div className="flex flex-col items-center gap-5 py-6 text-center animate-fade-in-up">
          {/* Elegant Icon with pulse effect */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm shadow-emerald-500/10">
            <span className="absolute inline-flex h-full w-full rounded-2xl bg-emerald-400 opacity-20 animate-ping duration-1000"></span>
            <CheckCircle className="h-8 w-8 text-emerald-500 relative z-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-black text-[#21164c] tracking-tight">Email Konfirmasi Dikirim!</h2>
            <p className="text-xs text-[#353241]/80 font-medium leading-relaxed px-2">
              {registerState.success}
            </p>
          </div>

          {/* Cozy and Premium Alert Box */}
          <div className="w-full rounded-[20px] border border-slate-150 bg-slate-50/80 p-4.5 text-left space-y-2.5 shadow-none">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-[11px] font-mono uppercase tracking-wider">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-50 text-amber-600 border border-amber-100 text-[10px]">⚠️</span>
              <span>Belum Menerima Email?</span>
            </div>
            <ul className="space-y-2 text-[11px] font-semibold text-[#353241]/75 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400"></span>
                <span>Periksa folder <strong>Spam</strong> atau <strong>Promosi</strong> di email kamu.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400"></span>
                <span>Tunggu 1-2 menit hingga proses pengiriman selesai.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400"></span>
                <span>Pastikan penulisan alamat email sudah benar.</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setMode("login")}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white py-3.5 text-xs font-extrabold text-[#21164c] tracking-wider uppercase font-mono hover:bg-slate-50 shadow-sm active:scale-98 transition-all duration-300 cursor-pointer"
          >
            Kembali ke Login
          </button>
        </div>
      ) : (
        <>
          <form action={action} className="space-y-5">
            {/* Hidden next param */}
            <input type="hidden" name="next" value={next} />

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Alamat Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-300" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="kamu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[16px] border border-slate-200 bg-[#fbfbfb]/80 py-3.5 pl-11 pr-4 text-xs font-semibold text-[#21164c] placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 shadow-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Kata Sandi
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-300" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[16px] border border-slate-200 bg-[#fbfbfb]/80 py-3.5 pl-11 pr-10 text-xs font-semibold text-[#21164c] placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 shadow-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#21164c] transition-colors cursor-pointer"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password (register only) */}
            {mode === "register" && (
              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-300" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-[16px] border border-slate-200 bg-[#fbfbfb]/80 py-3.5 pl-11 pr-4 text-xs font-semibold text-[#21164c] placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 shadow-none"
                  />
                </div>
              </div>
            )}

            {/* Error message */}
            {state.error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-xs font-bold text-rose-700 shadow-none animate-fade-in-up">
                {state.error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3.5 text-sm shadow-sm hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 transition-all duration-300 cursor-pointer"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {pending
                ? "Memproses..."
                : mode === "login"
                  ? "Masuk"
                  : "Buat Akun"}
            </button>
          </form>

          {/* Tombol kirim ulang email konfirmasi */}
          {showResendButton && !showResend && (
            <button
              type="button"
              onClick={() => setShowResend(true)}
              className="w-full flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-650 hover:bg-slate-100 hover:text-slate-800 transition-all duration-300 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Kirim ulang email konfirmasi
            </button>
          )}

          {/* Form kirim ulang */}
          {showResend && (
            <div className="rounded-[22px] border border-slate-200 bg-[#fbfbfb] p-4.5 space-y-3.5 animate-fade-in-up">
              <p className="text-sm font-semibold text-slate-700">
                Kirim Ulang Email Konfirmasi ke:
              </p>
              <form action={resendAction} className="flex gap-2">
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={email}
                  placeholder="kamu@email.com"
                  className="flex-1 rounded-[12px] border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#21164c] placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300"
                />
                <button
                  type="submit"
                  disabled={resendPending}
                  className="flex items-center gap-1.5 rounded-[12px] bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 hover:shadow-md disabled:opacity-60 transition-all duration-300 cursor-pointer"
                >
                  {resendPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Kirim
                </button>
              </form>
              {resendState.success && (
                <p className="text-xs text-emerald-600 font-bold font-mono">{resendState.success}</p>
              )}
              {resendState.error && (
                <p className="text-xs text-rose-650 font-bold font-mono">{resendState.error}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
