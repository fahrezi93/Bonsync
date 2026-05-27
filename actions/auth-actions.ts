"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export interface AuthActionState {
  error?: string;
  success?: string;
}

export interface ProfileActionState {
  success: boolean;
  message: string;
}

// Helper URL aplikasi — fallback ke localhost saat dev
function normalizeSiteUrl(url: string) {
  return url.replace(/\/+$/, "");
}

async function getSiteUrl() {
  // NEXT_PUBLIC_SITE_URL selalu diprioritaskan — ini yang kita set secara eksplisit
  // di .env.production.deploy dan Cloud Run env vars. Jangan pakai x-forwarded-host
  // karena di Cloud Run bisa berisi internal container address (0.0.0.0:8080).
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Dev fallback: pakai header hanya kalau env var tidak ada
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const host = forwardedHost ?? headerStore.get("host");

  if (host) {
    return `${forwardedProto ?? "http"}://${host}`;
  }

  return "http://localhost:3000";
}

function getSafeNext(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const next = getSafeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid login credentials")) {
      return { error: "Email atau password salah." };
    }
    if (msg.includes("email not confirmed")) {
      return {
        error:
          "Email kamu belum dikonfirmasi. Cek inbox/spam dan klik link verifikasi yang sudah dikirim.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }
  if (password.length < 6) {
    return { error: "Password minimal 6 karakter." };
  }
  if (password !== confirmPassword) {
    return { error: "Konfirmasi password tidak cocok." };
  }

  const supabase = await createClient();

  // emailRedirectTo harus mengarah ke URL app kita sendiri, bukan ke Supabase
  const redirectTo = `${await getSiteUrl()}/auth/callback`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("user already registered")) {
      return { error: "Email ini sudah terdaftar. Coba login." };
    }
    return { error: error.message };
  }

  // Jika user sudah ada tapi belum konfirmasi (identities kosong)
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: "Email ini sudah terdaftar. Coba login atau cek inbox untuk link konfirmasi." };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }

  return {
    success:
      "Akun berhasil dibuat. Cek inbox atau spam untuk link konfirmasi, lalu klik link itu agar session login aktif.",
  };
}

export async function resendConfirmationEmail(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return { error: "Masukkan email kamu." };
  }

  const supabase = await createClient();
  const redirectTo = `${await getSiteUrl()}/auth/callback`;

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Link konfirmasi baru telah dikirim. Cek inbox/spam kamu." };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const displayName = (formData.get("displayName") as string | null)?.trim() ?? "";
  const avatarPath = (formData.get("avatarPath") as string | null)?.trim() ?? "";

  if (displayName.length < 2) {
    return { success: false, message: "Nama tampilan minimal 2 karakter." };
  }
  if (displayName.length > 40) {
    return { success: false, message: "Nama tampilan maksimal 40 karakter." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "Sesi login tidak valid. Silakan login ulang." };
  }

  const cleanAvatarPath = avatarPath.startsWith(`${user.id}/`) ? avatarPath : null;
  const { error } = await supabase.auth.updateUser({
    data: {
      display_name: displayName,
      avatar_path: cleanAvatarPath,
    },
  });

  if (error) {
    return { success: false, message: `Gagal memperbarui profil: ${error.message}` };
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { success: true, message: "Profil berhasil diperbarui." };
}
