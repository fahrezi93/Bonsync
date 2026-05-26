"use client";

import { useState, useTransition } from "react";
import { setRoastPersona } from "@/actions/roast-persona-actions";
import type { RoastPersona } from "@/lib/roasting";
import { Sparkles } from "lucide-react";

interface RoastPersonaSelectorProps {
  currentPersona: RoastPersona;
}

interface PersonaOption {
  value: RoastPersona;
  emoji: string;
  label: string;
  tagline: string;
  preview: string;
}

const personas: PersonaOption[] = [
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
    tagline: "Protektif tapi nyinyir, suka bandingin sama harga dapur",
    preview: "Aduh nak, kopi 50 ribu? Mama bisa masak rendang seminggu lho segitu...",
  },
  {
    value: "SULTAN",
    emoji: "💸",
    label: "Sultan",
    tagline: "Konglomerat sok kaya, nganggep semua pengeluaranmu receh",
    preview: "Receh banget pengeluaranmu, pegawai aku jajan lebih dari ini.",
  },
  {
    value: "TETANGGA",
    emoji: "🏘️",
    label: "Tetangga Julid",
    tagline: "Ibu kompleks update gosip, kepo banget urusan kamu",
    preview: "Eh denger-denger Spotify-nya udah 6 bulan ya, tapi kemarin minta makan ke gua...",
  },
  {
    value: "DOSEN",
    emoji: "👨‍🏫",
    label: "Dosen Killer",
    tagline: "Selalu nyangkutin pengeluaran ke tugas akhir & IPK",
    preview: "Tugas akhir aja belum kelar, udah ngabisin 800rb di Tokopedia?",
  },
];

export function RoastPersonaSelector({ currentPersona }: RoastPersonaSelectorProps) {
  const [selected, setSelected] = useState<RoastPersona>(currentPersona);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null);

  function handleSelect(p: RoastPersona) {
    if (p === selected || isPending) return;

    setSelected(p);
    startTransition(async () => {
      const result = await setRoastPersona(p);
      setToast(result);
      setTimeout(() => setToast(null), 3000);
    });
  }

  return (
    <div className="w-full premium-card p-6 md:p-8 relative overflow-hidden transition-all duration-300">
      <div className="mb-8 flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-slate-400" />
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
            Persona AI Roaster
          </h2>
        </div>
        <p className="text-sm text-slate-500">
          Pilih karakter AI yang akan mengomentari pengeluaranmu.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {personas.map((p) => {
          const isActive = selected === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => handleSelect(p.value)}
              disabled={isPending}
              className={`
                group w-full text-left rounded-2xl p-5 transition-all duration-300 cursor-pointer border
                ${isActive
                  ? "border-slate-900 bg-white ring-1 ring-slate-900 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                }
                ${isPending ? "opacity-60 cursor-not-allowed" : "active:scale-[0.99]"}
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
                      {isActive && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-900 text-white">
                          Aktif
                        </span>
                      )}
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
                    "{p.preview}"
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {toast && (
        <div
          className={`
            mt-5 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium
            transition-all duration-300 animate-fade-in-up
            ${toast.success
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
            }
          `}
        >
          <span>{toast.success ? "✅" : "❌"}</span>
          {toast.message}
        </div>
      )}

      {isPending && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] rounded-[24px] flex items-center justify-center z-10">
          <div className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200 text-sm font-medium text-slate-600">
            <span className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin" />
            Menyimpan...
          </div>
        </div>
      )}
    </div>
  );
}
