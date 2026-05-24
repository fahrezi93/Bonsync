"use client";

import { useActionState, useState, useTransition } from "react";
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
    <form action={formAction} className="premium-card p-6 flex flex-col gap-6 w-full animate-fade-in-up">
      <input type="hidden" name="avatarPath" value={currentAvatarPath} />

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-800 text-balance">Profil Pengguna</h2>
        <p className="text-sm text-slate-500 text-pretty">
          Atur nama tampilan dan foto profil yang muncul di navigasi BonSync.
        </p>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar profil"
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-slate-800 text-2xl font-bold text-white">
              {initial}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <label className="inline-flex w-fit cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-transform active:scale-[0.96] hover:bg-slate-50">
            {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            {isUploading ? "Mengunggah..." : "Ganti Foto"}
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
          <p className="text-xs font-medium text-slate-500 text-pretty">
            JPG, PNG, atau WebP. Maksimal 2 MB.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="displayName" className="text-[13px] font-bold text-slate-700">
          Nama tampilan
        </label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="displayName"
            name="displayName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            maxLength={40}
            className="w-full rounded-xl border border-slate-200/60 bg-slate-50/50 px-11 py-3 text-[13px] font-semibold text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 shadow-sm"
            placeholder="Nama kamu"
            required
          />
        </div>
        <p className="text-xs font-medium text-slate-500 truncate">{email}</p>
      </div>

      {(uploadError || state.message) && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-bold ${
            uploadError || !state.success
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {uploadError || state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving || isUploading}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition-transform active:scale-[0.96] hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {isSaving ? "Menyimpan..." : "Simpan Profil"}
      </button>
    </form>
  );
}
