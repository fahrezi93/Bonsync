import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { OnboardingFlow } from "@/components/onboarding-flow";

const monthLabelFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
});

/**
 * Dedicated route untuk onboarding flow 3-step.
 *
 * Ditempatkan di route terpisah supaya:
 * - Server action di tiap step boleh revalidatePath dengan bebas — Next.js akan
 *   refresh `/onboarding` (route ini) yang SELALU render OnboardingFlow,
 *   sehingga client component TIDAK ke-unmount. Step state yang dipegang
 *   di client tetap aman → user bisa lanjut step 1 → 2 → 3 dengan mulus.
 * - Setelah step 3 selesai, OnboardingFlow akan router.push("/") ke dashboard.
 *
 * Catatan: kita SENGAJA tidak guard "kalau budget sudah ada → redirect ke /",
 * karena guard itu akan trigger setelah server action step 1 (budget) sukses,
 * yang akan unmount OnboardingFlow dan break flow ke step 2/3. User yang sudah
 * pernah onboarding tetap bisa akses /onboarding lagi untuk re-setup
 * (re-set budget akan auto-trigger flow lengkap lagi).
 */
export default async function OnboardingPage() {
  const userId = await getCurrentUserId();

  // Belum login → ke login
  if (!userId) {
    redirect("/login");
  }

  const monthLabel = monthLabelFormatter.format(new Date());

  return <OnboardingFlow monthLabel={monthLabel} />;
}
