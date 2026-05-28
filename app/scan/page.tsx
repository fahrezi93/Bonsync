import { ScanFlow } from "@/components/scan-flow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan Nota — BonSync",
  description: "Foto nota struk, AI baca otomatis. Pilih sendiri semua atau split bill bareng teman.",
};

import { requireOnboarding } from "@/lib/auth";

export default async function ScanPage() {
  await requireOnboarding();

  return (
    <div className="mx-auto w-full max-w-md md:max-w-5xl px-4 py-8 flex flex-col flex-1 min-h-0 overflow-y-auto hide-scrollbar">
      <ScanFlow />
    </div>
  );
}

