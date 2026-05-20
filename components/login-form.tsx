"use client";

import { useActionState, useState } from "react";
import { Loader2, Mail, Lock, Eye, EyeOff, CheckCircle, RefreshCw } from "lucide-react";
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
  const [resendEmail, setResendEmail] = useState("");

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

  // Tampilkan tombol resend jika error berisi "belum dikonfirmasi"
  const showResendButton =
    mode === "login" &&
    loginState.error?.toLowerCase().includes("belum dikonfirmasi");

  return (
    <div className="premium-card p-6 space-y-5">
      {/* Tab switcher */}
      <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setShowResend(false);
          }}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
            mode === "login"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
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
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
            mode === "register"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Daftar
        </button>
      </div>

      {/* Success state (register) */}
      {registerState.success && mode === "register" ? (
        <div className="flex flex-col items-center gap-4 py-6 text-center animate-fade-in-up">
          {/* Elegant Icon with pulse effect */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm shadow-emerald-500/10">
            <span className="absolute inline-flex h-full w-full rounded-2xl bg-emerald-400 opacity-20 animate-ping duration-1000"></span>
            <CheckCircle className="h-8 w-8 text-emerald-500 relative z-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Email Konfirmasi Dikirim!</h2>
            <p className="text-xs text-slate-500 leading-relaxed px-2">
              {registerState.success}
            </p>
          </div>

          {/* Cozy and Premium Alert Box */}
          <div className="w-full rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-xs text-slate-700 text-left space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-50 text-amber-600 border border-amber-100 text-[10px]">⚠️</span>
              <span>Belum menerima email konfirmasi?</span>
            </div>
            <ul className="space-y-2 text-slate-500">
              <li className="flex items-start gap-2">
                <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300"></span>
                <span>Periksa folder <strong>Spam</strong> atau <strong>Promosi</strong> di email kamu.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300"></span>
                <span>Tunggu 1-2 menit hingga proses pengiriman selesai.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300"></span>
                <span>Pastikan penulisan alamat email sudah benar.</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setMode("login")}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-98 transition-all duration-200 cursor-pointer"
          >
            Kembali ke Login
          </button>
        </div>
      ) : (
        <>
          <form action={action} className="space-y-4">
            {/* Hidden next param */}
            <input type="hidden" name="next" value={next} />

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="kamu@email.com"
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Error message */}
            {state.error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {state.error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 disabled:opacity-60 active:scale-95 transition-all"
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
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Kirim ulang email konfirmasi
            </button>
          )}

          {/* Form kirim ulang */}
          {showResend && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-600">Kirim ulang email konfirmasi ke:</p>
              <form action={resendAction} className="flex gap-2">
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={resendEmail}
                  placeholder="kamu@email.com"
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="submit"
                  disabled={resendPending}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-60 transition-all"
                >
                  {resendPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Kirim
                </button>
              </form>
              {resendState.success && (
                <p className="text-xs text-emerald-600 font-medium">{resendState.success}</p>
              )}
              {resendState.error && (
                <p className="text-xs text-rose-600">{resendState.error}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
