"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ArrowRight,
  Loader2,
  Sparkles,
  Leaf,
  Flame,
  Skull,
} from "lucide-react";
import { SetBudgetForm } from "@/components/set-budget-form";
import { setRoastLevel, type RoastLevel } from "@/actions/roast-level-actions";
import { setRoastPersona } from "@/actions/roast-persona-actions";
import type { RoastPersona } from "@/lib/roasting";

interface OnboardingFlowProps {
  monthLabel: string;
}

type Step = 1 | 2 | 3;

const LEVEL_OPTIONS: {
  value: RoastLevel;
  label: string;
  description: string;
  emoji: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "MILD",
    label: "Sopan",
    description: "Evaluasi ramah & membangun. Cocok buat yang butuh semangat.",
    emoji: "🥦",
    icon: <Leaf className="w-5 h-5" />,
  },
  {
    value: "MEDIUM",
    label: "Pedas Sedang",
    description: "Sarkastik & gaul. Nusuk tapi masih bisa ketawa.",
    emoji: "🔥",
    icon: <Flame className="w-5 h-5" />,
  },
  {
    value: "NUCLEAR",
    label: "Nuklir",
    description: "Blak-blakan total. Tidak ada ampun, tidak ada basa-basi.",
    emoji: "💀",
    icon: <Skull className="w-5 h-5" />,
  },
];

const PERSONA_OPTIONS: {
  value: RoastPersona;
  emoji: string;
  label: string;
  tagline: string;
  preview: string;
}[] = [
  {
    value: "DEFAULT",
    emoji: "✨",
    label: "Default",
    tagline: "Asisten gaul tongkrongan",
    preview: "Bro, kopi 50rb tiap hari? Lo aplikasi keuangan apa ATM Starbucks?",
  },
  {
    value: "MAMA",
    emoji: "🧕",
    label: "Mama",
    tagline: "Protektif tapi nyinyir",
    preview: "Aduh nak, kopi 50 ribu? Mama bisa masak rendang seminggu lho segitu...",
  },
  {
    value: "SULTAN",
    emoji: "💸",
    label: "Sultan",
    tagline: "Konglomerat sok kaya",
    preview: "Receh banget pengeluaranmu, pegawai aku jajan lebih dari ini.",
  },
  {
    value: "TETANGGA",
    emoji: "🏘️",
    label: "Tetangga Julid",
    tagline: "Ibu kompleks update gosip",
    preview: "Eh denger-denger Spotify-nya udah 6 bulan ya, tapi kemarin minta makan ke gua...",
  },
  {
    value: "DOSEN",
    emoji: "👨‍🏫",
    label: "Dosen Killer",
    tagline: "Selalu nyangkutin ke tugas akhir",
    preview: "Tugas akhir aja belum kelar, udah ngabisin 800rb di Tokopedia?",
  },
];

export function OnboardingFlow({ monthLabel }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>(1);
  const router = useRouter();
  const [savingLevel, startSaveLevel] = useTransition();
  const [savingPersona, startSavePersona] = useTransition();
  const [selectedLevel, setSelectedLevel] = useState<RoastLevel>("MEDIUM");
  const [selectedPersona, setSelectedPersona] = useState<RoastPersona>("DEFAULT");
  const [errorMsg, setErrorMsg] = useState("");

  function handleLevelContinue() {
    setErrorMsg("");
    startSaveLevel(async () => {
      const r = await setRoastLevel(selectedLevel);
      if (!r.success) {
        setErrorMsg(r.message);
        return;
      }
      setStep(3);
    });
  }

  function handlePersonaFinish() {
    setErrorMsg("");
    startSavePersona(async () => {
      const r = await setRoastPersona(selectedPersona);
      if (!r.success) {
        setErrorMsg(r.message);
        return;
      }
      // Selesai → bawa user ke dashboard utama
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:py-14 flex flex-col gap-6 animate-fade-in-up">
      <Stepper current={step} />

      {step === 1 && (
        <BudgetStep monthLabel={monthLabel} onSaved={() => setStep(2)} />
      )}

      {step === 2 && (
        <Step2RoastLevel
          options={LEVEL_OPTIONS}
          selected={selectedLevel}
          onSelect={setSelectedLevel}
          onContinue={handleLevelContinue}
          saving={savingLevel}
          errorMsg={errorMsg}
        />
      )}

      {step === 3 && (
        <Step3Persona
          options={PERSONA_OPTIONS}
          selected={selectedPersona}
          onSelect={setSelectedPersona}
          onFinish={handlePersonaFinish}
          saving={savingPersona}
          errorMsg={errorMsg}
        />
      )}
    </div>
  );
}

/* ─── Step 1: budget — pakai callback onSaved langsung ─── */
import { skipBudgetSetup } from "@/actions/budget-actions";

function BudgetStep({
  monthLabel,
  onSaved,
}: {
  monthLabel: string;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  // Tambahkan delay 800ms supaya user sempat lihat pesan sukses sebelum
  // berpindah ke step selanjutnya.
  function handleSaved() {
    setTimeout(() => onSaved(), 800);
  }

  function handleSkip() {
    startTransition(async () => {
      await skipBudgetSetup();
      onSaved();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="premium-card p-6 border-emerald-100">
        <SetBudgetForm
          monthLabel={monthLabel}
          onSaved={handleSaved}
          hideCard={true}
        />
        
        <div className="mt-6 border-t border-slate-100 pt-6 text-center">
          <p className="text-sm font-medium text-slate-500 mb-3">Belum gajian?</p>
          <button
            onClick={handleSkip}
            disabled={isPending}
            className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            {isPending ? "Melewati..." : "Lewati sementara"}
          </button>
        </div>
      </div>

      <p className="text-center text-xs font-medium text-slate-500 px-2 mt-2">
        Setelah simpan budget, kamu akan lanjut ke pengaturan AI roasting.
      </p>
    </div>
  );
}

/* ─── Stepper indicator ─── */
function Stepper({ current }: { current: Step }) {
  const steps = [
    { num: 1 as Step, label: "Budget" },
    { num: 2 as Step, label: "Level" },
    { num: 3 as Step, label: "Persona" },
  ];
  return (
    <div className="flex items-start justify-center w-full max-w-md mx-auto mb-6 px-4 select-none">
      {steps.map((s, idx) => {
        const isDone = current > s.num;
        const isActive = current === s.num;
        return (
          <div key={s.num} className="flex items-center flex-1 last:flex-none">
            {/* Step Node */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 shrink-0 ${
                  isDone
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : isActive
                      ? "bg-white border-emerald-500 text-emerald-700 ring-4 ring-emerald-100"
                      : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                {isDone ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <span className="text-xs font-bold">{s.num}</span>
                )}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-bold mt-2 transition-colors duration-300 text-center font-sora ${
                  isActive ? "text-slate-800" : isDone ? "text-emerald-700" : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {/* Connector Line */}
            {idx < steps.length - 1 && (
              <div className="flex-1 h-[2px] bg-slate-200 mx-2 -translate-y-4">
                <div
                  className={`h-full bg-emerald-500 transition-all duration-500 ${
                    isDone ? "w-full" : "w-0"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Step 2: pilih roast level ─── */
interface Step2Props {
  options: typeof LEVEL_OPTIONS;
  selected: RoastLevel;
  onSelect: (lvl: RoastLevel) => void;
  onContinue: () => void;
  saving: boolean;
  errorMsg: string;
}
function Step2RoastLevel({
  options,
  selected,
  onSelect,
  onContinue,
  saving,
  errorMsg,
}: Step2Props) {
  return (
    <div className="premium-card p-6 md:p-8 flex flex-col gap-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">
          Seberapa Pedas AI-mu?
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Pilih intensitas roasting. Bisa diubah lagi di Profil kapan saja.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {options.map((opt) => {
          const isActive = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={`group w-full text-left rounded-2xl p-5 transition-all duration-300 cursor-pointer border
                ${isActive
                  ? "border-slate-900 bg-white ring-1 ring-slate-900 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 text-white transition-all
                  ${isActive ? "bg-slate-900 scale-105" : "bg-slate-800 opacity-90 group-hover:opacity-100 group-hover:scale-105"}
                `}>
                  {opt.icon}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-base font-semibold ${isActive ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900"}`}>
                      {opt.emoji} {opt.label}
                    </span>
                    <div className={`
                      w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0
                      ${isActive ? "border-slate-900 bg-slate-900" : "border-slate-300 group-hover:border-slate-400"}
                    `}>
                      {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 leading-snug">
                    {opt.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          ⚠️ {errorMsg}
        </div>
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-emerald-500 transition-all active:scale-[0.98] disabled:opacity-60 shadow-sm"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
          </>
        ) : (
          <>
            Lanjut <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}

/* ─── Step 3: pilih persona ─── */
interface Step3Props {
  options: typeof PERSONA_OPTIONS;
  selected: RoastPersona;
  onSelect: (p: RoastPersona) => void;
  onFinish: () => void;
  saving: boolean;
  errorMsg: string;
}
function Step3Persona({
  options,
  selected,
  onSelect,
  onFinish,
  saving,
  errorMsg,
}: Step3Props) {
  return (
    <div className="premium-card p-6 md:p-8 flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-slate-400" />
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Pilih Karakter AI
          </h2>
        </div>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Persona ini yang bakal mengomentari pengeluaranmu setiap hari.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {options.map((p) => {
          const isActive = selected === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onSelect(p.value)}
              className={`group w-full text-left rounded-2xl p-5 transition-all duration-300 cursor-pointer border
                ${isActive
                  ? "border-slate-900 bg-white ring-1 ring-slate-900 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                }
              `}
            >
              <div className="flex items-start gap-4 md:gap-5">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 text-2xl transition-colors
                  ${isActive ? "bg-slate-100" : "bg-slate-50 group-hover:bg-slate-100/50"}
                `}>
                  {p.emoji}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-3">
                      <span className={`text-base font-semibold ${isActive ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900"}`}>
                        {p.label}
                      </span>
                    </div>
                    <div className={`
                      w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0
                      ${isActive ? "border-slate-900 bg-slate-900" : "border-slate-300 group-hover:border-slate-400"}
                    `}>
                      {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-500 mb-3 leading-relaxed">
                    {p.tagline}
                  </p>
                  
                  <div className={`
                    text-sm italic leading-relaxed pl-3.5 border-l-2 transition-colors
                    ${isActive ? 'text-slate-700 border-slate-900' : 'text-slate-400 border-slate-200'}
                  `}>
                    &quot;{p.preview}&quot;
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          ⚠️ {errorMsg}
        </div>
      )}

      <button
        type="button"
        onClick={onFinish}
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-emerald-500 transition-all active:scale-[0.98] disabled:opacity-60 shadow-sm"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
          </>
        ) : (
          <>
            Mulai Pakai BonSync <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
