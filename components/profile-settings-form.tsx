"use client";

import { useActionState, useState, useTransition } from "react";
import Image from "next/image";
import { Camera, Loader2, Save, UserRound } from "lucide-react";
import { updateProfile, type ProfileActionState } from "@/actions/auth-actions";
import { createClient } from "@/utils/supabase/client";

type ProfileSettingsFormProps = {
  userId: string;
  email: string;
  displayName: string;
  avatarPath: string | null;
  avatarUrl: string | null;
};

const initialState: ProfileActionState = {
  success: false,
  message: "",
};

export function ProfileSettingsForm({
  userId,
  email,
  displayName,
  avatarPath,
  avatarUrl,
}: ProfileSettingsFormProps) {
  const [state, formAction, isSaving] = useActionState(updateProfile, initialState);
  const [name, setName] = useState(displayName);
  const [currentAvatarPath, setCurrentAvatarPath] = useState(avatarPath ?? "");
  const [previewUrl, setPreviewUrl] = useState(avatarUrl);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, startUpload] = useTransition();

  const hasChanges =
    name.trim() !== displayName.trim() ||
    currentAvatarPath !== (avatarPath ?? "");

  function uploadAvatar(file: File) {
    setUploadError("");
    startUpload(async () => {
      const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
      if (!allowedTypes.has(file.type)) {
        setUploadError("Avatar harus berupa JPG, PNG, atau WebP.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setUploadError("Ukuran avatar maksimal 2 MB.");
        return;
      }

      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${userId}/avatar.${ext}`;
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        setUploadError(`Gagal upload avatar: ${error.message}`);
        return;
      }

      const signed = await supabase.storage.from("avatars").createSignedUrl(data.path, 60 * 10);
      if (signed.error) {
        setUploadError(`Avatar terunggah, tapi preview gagal: ${signed.error.message}`);
      }

      setCurrentAvatarPath(data.path);
      setPreviewUrl(signed.data?.signedUrl ?? null);
    });
  }

  const initial = (name || email || "B").charAt(0).toUpperCase();

  return (
    <form action={formAction} className="premium-card p-6 md:p-8 flex flex-col gap-6 md:gap-8 w-full animate-fade-in-up">
      <input type="hidden" name="avatarPath" value={currentAvatarPath} />

      <div className="flex flex-col gap-1">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Informasi Pribadi</h2>
        <p className="text-sm font-medium text-slate-500">
          Kelola foto profil dan nama yang ditampilkan di platform.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 md:gap-8 items-start sm:items-center p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm flex items-center justify-center">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Avatar profil"
              width={96}
              height={96}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-emerald-100 text-emerald-700 text-3xl font-bold">
              {initial}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <label className="inline-flex w-fit cursor-pointer items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95">
            {isUploading ? <Loader2 className="size-4 animate-spin text-slate-400" /> : <Camera className="size-4 text-slate-400" />}
            {isUploading ? "Mengunggah..." : "Unggah Foto Baru"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={isUploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadAvatar(file);
                event.target.value = "";
              }}
            />
          </label>
          <p className="text-xs font-medium text-slate-400">
            Format yang didukung: JPG, PNG, WebP (Maks. 2MB)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="displayName" className="text-sm font-semibold text-slate-700 pl-1">
            Nama Panggilan
          </label>
          <div className="relative group">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              id="displayName"
              name="displayName"
              value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            maxLength={40}
            className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-sm transition-all"
            placeholder="Ketik nama Anda di sini"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 pl-1">
          Alamat Email
        </label>
        <div className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-500 shadow-sm select-none cursor-not-allowed">
          {email}
        </div>
      </div>
      </div>

      {(uploadError || state.message) && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-medium animate-fade-in-up ${
            uploadError || !state.success
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {uploadError || state.message}
        </div>
      )}

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isSaving || isUploading || !hasChanges}
          className="inline-flex h-12 w-full md:w-auto items-center justify-center gap-2.5 rounded-2xl bg-slate-900 px-8 text-[15px] font-bold text-white transition-all active:scale-[0.96] hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? <Loader2 className="size-[18px] animate-spin" /> : <Save className="size-[18px]" />}
          {isSaving ? "Menyimpan Perubahan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
