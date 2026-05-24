import { createClient } from "@/utils/supabase/server";

export type UserProfileMetadata = {
  displayName: string;
  avatarPath: string | null;
};

export function getProfileMetadata(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}): UserProfileMetadata {
  const metadata = user.user_metadata ?? {};
  const rawDisplayName = metadata.display_name;
  const rawAvatarPath = metadata.avatar_path;
  const emailPrefix = user.email?.split("@")[0] ?? "Pengguna";

  return {
    displayName:
      typeof rawDisplayName === "string" && rawDisplayName.trim()
        ? rawDisplayName.trim()
        : emailPrefix,
    avatarPath:
      typeof rawAvatarPath === "string" && rawAvatarPath.trim()
        ? rawAvatarPath.trim()
        : null,
  };
}

export async function getSignedAvatarUrl(avatarPath: string | null) {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
    return avatarPath;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(avatarPath, 60 * 10);

  if (error) {
    console.error("[profile-avatar] signed URL failed:", error.message);
    return null;
  }

  return data.signedUrl;
}
