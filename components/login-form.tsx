"use client";

import { useActionState, useState, useEffect, useTransition, useRef } from "react";

import { Loader2, Mail, Lock, Eye, EyeOff, CheckCircle, RefreshCw, MailOpen, ArrowRight, HelpCircle } from "lucide-react";
import {
  signIn,
  signUp,
  resendConfirmationEmail,
  type AuthActionState,
} from "@/actions/auth-actions";
import { createClient } from "@/utils/supabase/client";

const initialState: AuthActionState = {};

interface LoginFormProps {
  next: string;
  defaultEmail?: string;
}

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        ux_mode: "popup";
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        container: HTMLElement,
        options: {
          theme: "outline";
          size: "large";
          shape: "pill";
          width: number;
          text: "continue_with";
          locale: "id";
        },
      ) => void;
    };
  };
}

function getGoogleIdentityServices() {
  return (window as Window & { google?: GoogleIdentityServices }).google;
}

export function LoginForm({ next, defaultEmail }: LoginFormProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [email, setEmail] = useState(defaultEmail || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [googlePending, startGoogleTransition] = useTransition();
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleSdkLoaded, setGoogleSdkLoaded] = useState(false);
  const googleInitRef = useRef(false);


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
  function submitAuthAction(formData: FormData) {
    setPassword("");
    setConfirmPassword("");
    action(formData);
  }

  // Tampilkan tombol resend jika error berisi "belum dikonfirmasi"
  const showResendButton =
    mode === "login" &&
    loginState.error?.toLowerCase().includes("belum dikonfirmasi");

  // Load Google Identity Services SDK dan render tombol langsung ke container
  useEffect(() => {
    if (googleInitRef.current) return;

    const initGoogleSignIn = () => {
      if (googleInitRef.current) return;

      const google = getGoogleIdentityServices();
      if (!google) return;

      googleInitRef.current = true;
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
      if (!clientId) {
        console.error("BonSync: NEXT_PUBLIC_GOOGLE_CLIENT_ID tidak ditemukan di .env");
        return;
      }

      try {
        google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: "popup",
          callback: async (response) => {
            setGoogleError(null);
            startGoogleTransition(async () => {
              try {
                const supabase = createClient();
                const { error } = await supabase.auth.signInWithIdToken({
                  provider: "google",
                  token: response.credential,
                });
                if (error) {
                  setGoogleError(error.message);
                } else {
                  window.location.href = next || "/";
                }
              } catch (e) {
                setGoogleError(
                  e instanceof Error ? e.message : "Gagal masuk dengan Google."
                );
              }
            });
          },
        });

        // Render tombol Google langsung ke dalam container
        const container = document.getElementById("google-signin-container");
        if (container) {
          container.innerHTML = ""; // bersihkan dulu
          google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            shape: "pill",
            width: container.offsetWidth || 360,
            text: "continue_with",
            locale: "id",
          });
          setGoogleSdkLoaded(true);
        }
      } catch (err) {
        console.error("Gagal menginisialisasi Google Sign-In:", err);
      }
    };

    if (typeof window === "undefined") return;

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client?hl=id"]'
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client?hl=id";
      script.async = true;
      script.defer = true;
      script.onload = initGoogleSignIn;
      document.head.appendChild(script);
    } else if (getGoogleIdentityServices()) {
      initGoogleSignIn();
    }
  }, [next]);


  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] space-y-6 relative overflow-hidden">
      
      {/* Ambient decorative spot inside card */}
      <div className="absolute top-0 right-0 size-24 bg-emerald-100/20 rounded-full blur-xl pointer-events-none -z-10" />

      {/* Tab switcher */}
      <div className="flex rounded-full border border-slate-200/60 bg-slate-100/50 p-1 backdrop-blur-sm select-none">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setShowResend(false);
          }}
          className={`flex-1 outline-none focus:outline-none focus:ring-0 tap-highlight-transparent rounded-full py-2.5 text-sm font-semibold transition-all duration-300 cursor-pointer ${
            mode === "login"
              ? "bg-white text-emerald-600 shadow-sm border border-slate-200/30"
              : "text-slate-500 hover:text-slate-800 border border-transparent"
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
          className={`flex-1 outline-none focus:outline-none focus:ring-0 tap-highlight-transparent rounded-full py-2.5 text-sm font-semibold transition-all duration-300 cursor-pointer ${
            mode === "register"
              ? "bg-white text-emerald-600 shadow-sm border border-slate-200/30"
              : "text-slate-500 hover:text-slate-800 border border-transparent"
          }`}
        >
          Daftar
        </button>
      </div>

      {/* Success state (register) */}
      {registerState.success && mode === "register" ? (
        <div className="flex flex-col items-center gap-6 py-6 text-center animate-fade-in-up">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sora">
              Email Konfirmasi Dikirim!
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed px-4 font-inter">
              {registerState.success}
            </p>
          </div>

          {/* Integrated Modern Help Block */}
          <div className="w-full rounded-2xl border border-slate-100 bg-slate-50/40 backdrop-blur-sm p-5 text-left space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-700 text-xs tracking-wide">
              <HelpCircle className="size-4 text-emerald-500" />
              <span className="font-sora font-semibold">Belum Menerima Email?</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-500 leading-relaxed font-inter">
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 flex size-1.5 shrink-0 rounded-full bg-emerald-500"></span>
                <span>Periksa folder <strong className="text-slate-700 font-semibold">Spam</strong> atau <strong className="text-slate-700 font-semibold">Promosi</strong> di kotak masuk Anda.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 flex size-1.5 shrink-0 rounded-full bg-emerald-500"></span>
                <span>Tunggu sekitar 1-2 menit hingga proses pengiriman selesai sepenuhnya.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 flex size-1.5 shrink-0 rounded-full bg-emerald-500"></span>
                <span>Pastikan penulisan alamat email Anda sudah benar dan aktif.</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setMode("login")}
            className="w-full mt-3 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 active:scale-98 transition-all duration-300 shadow-md shadow-slate-900/10 cursor-pointer"
          >
            <span>Kembali ke Halaman Login</span>
          </button>
        </div>
      ) : (
        <>
          <form action={submitAuthAction} className="space-y-5">
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
                <Mail className="absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-300" />
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
                <Lock className="absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-300" />
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
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
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
                  <Lock className="absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-300" />
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
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {pending
                ? "Memproses…"
                : mode === "login"
                  ? "Masuk"
                  : "Buat Akun"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400">atau</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google Sign-In button — rendered langsung oleh GSI SDK */}
          {googlePending ? (
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 shadow-sm"
            >
              <Loader2 className="size-4 animate-spin text-emerald-500" />
              Menghubungkan ke Google…
            </button>
          ) : (
            <div className="relative w-full flex justify-center min-h-[48px]">
              {!googleSdkLoaded && (
                <div className="absolute inset-0 flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-slate-50/50 py-3 text-sm font-semibold text-slate-400">
                  <Loader2 className="size-4 animate-spin text-slate-400" />
                  Memuat Google…
                </div>
              )}
              <div
                id="google-signin-container"
                className={`w-full flex justify-center ${!googleSdkLoaded ? "opacity-0" : "opacity-100 transition-opacity duration-300"}`}
              />
            </div>
          )}

          {/* Google error */}
          {googleError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-xs font-bold text-rose-700 animate-fade-in-up">
              {googleError}
            </div>
          )}

          {/* Tombol kirim ulang email konfirmasi */}
          {showResendButton && !showResend && (
            <button
              type="button"
              onClick={() => setShowResend(true)}
              className="w-full flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-650 hover:bg-slate-100 hover:text-slate-800 transition-all duration-300 cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
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
                  {resendPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
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
