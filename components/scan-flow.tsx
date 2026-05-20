"use client";

import { useMemo, useRef, useState, useTransition, useEffect } from "react";
import {
  Camera,
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  Users,
  User,
  ArrowLeft,
  Save,
  Copy,
} from "lucide-react";
import {
  extractReceiptDraft,
  saveQuickReceiptExpense,
  saveSplitBillExpense,
} from "@/actions/expense-actions";
import {
  computeReceiptTotals,
  computeParticipantSplit,
  type ReceiptDraft,
  type SplitAssignments,
} from "@/lib/receipt-utils";
import { useRouter } from "next/navigation";
import { CurrencyInput } from "@/components/currency-input";

type Step = "upload" | "loading" | "review" | "split-assign" | "done";
type Mode = "self" | "split" | null;

const SELF_NAME = "Saya";

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function normalizeName(n: string) {
  return n.trim().replace(/\s+/g, " ");
}

export function ScanFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [draft, setDraft] = useState<ReceiptDraft | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [mode, setMode] = useState<Mode>(null);
  const [friends, setFriends] = useState<string[]>([]);
  const [friendInput, setFriendInput] = useState("");
  const [assignments, setAssignments] = useState<SplitAssignments>({});
  const [transferNote, setTransferNote] = useState("Transfer ke BCA 123456 ya!");
  const [statusMsg, setStatusMsg] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extracting, startExtract] = useTransition();
  const [saving, startSave] = useTransition();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      // Revoke lama kalau ada
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedFileName(null);
      setPreviewUrl(null);
    }
    setErrorMsg("");
  };

  const participants = useMemo(() => [SELF_NAME, ...friends], [friends]);

  const totals = useMemo(
    () => (draft ? computeReceiptTotals(draft) : { subtotal: 0, discount: 0, extraCharges: 0, total: 0 }),
    [draft],
  );

  const split = useMemo(
    () =>
      draft
        ? computeParticipantSplit(draft, participants, assignments)
        : {
            participants: [],
            subtotalAssigned: 0,
            fullSubtotal: 0,
            extraCharges: 0,
            fullTotal: 0,
            unassignedIndexes: [],
          },
    [draft, participants, assignments],
  );

  const selfTotal = split.participants.find((p) => p.name === SELF_NAME)?.total ?? 0;

  /* ── useEffect for funny loading texts ── */
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const loadingMessages = [
    "Gemini lagi memelototi struk jajan boba kamu...",
    "Menghitung pajak yang lebih besar dari ekspektasi...",
    "Sabar ya, AI-nya lagi pusing baca struk lecek...",
    "Sedikit lagi, moga-moga saldo masih aman...",
  ];

  useEffect(() => {
    if (step === "loading") {
      const interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [step]);
  /* ── handlers ── */
  const handleExtract = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("receipt") as File | null;
    if (!file || file.size === 0) {
      setErrorMsg("Pilih foto nota dulu ya.");
      return;
    }
    setErrorMsg("");
    setStep("loading");
    startExtract(async () => {
      const result = await extractReceiptDraft(formData);
      if (!result.success || !result.data) {
        setErrorMsg(result.message ?? "Gagal membaca nota.");
        setStep("upload");
        return;
      }
      setDraft(result.data);
      setStep("review");
    });
  };

  const updateItemName = (idx: number, val: string) =>
    setDraft((prev) => {
      if (!prev) return prev;
      const items = [...prev.items];
      items[idx] = { ...items[idx], itemName: val };
      return { ...prev, items };
    });

  const updateItemPrice = (idx: number, num: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const items = [...prev.items];
      items[idx] = { ...items[idx], price: Math.max(0, num) };
      return { ...prev, items };
    });
  };

  const removeItem = (idx: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, items: prev.items.filter((_, i) => i !== idx) };
    });
    setAssignments((prev) => {
      const next: SplitAssignments = {};
      for (const [rawIdx, owners] of Object.entries(prev)) {
        const i = Number(rawIdx);
        if (i === idx) continue;
        next[i > idx ? i - 1 : i] = owners;
      }
      return next;
    });
  };

  const addItem = () =>
    setDraft((prev) =>
      prev ? { ...prev, items: [...prev.items, { itemName: "Item baru", price: 0 }] } : prev,
    );

  const addFriend = () => {
    const name = normalizeName(friendInput);
    if (!name || name === SELF_NAME || participants.includes(name)) return;
    setFriends((prev) => [...prev, name]);
    setFriendInput("");
  };

  const removeFriend = (name: string) => {
    setFriends((prev) => prev.filter((n) => n !== name));
    setAssignments((prev) => {
      const next: SplitAssignments = {};
      for (const [rawIdx, owners] of Object.entries(prev)) {
        next[Number(rawIdx)] = owners.filter((o) => o !== name);
      }
      return next;
    });
  };

  const toggleOwner = (itemIdx: number, name: string) => {
    setAssignments((prev) => {
      const current = prev[itemIdx] ?? [];
      const has = current.includes(name);
      return {
        ...prev,
        [itemIdx]: has ? current.filter((n) => n !== name) : [...current, name],
      };
    });
  };

  const handleChooseMode = (chosen: "self" | "split") => {
    setMode(chosen);
    if (chosen === "self") {
      saveSelf();
    } else {
      setStep("split-assign");
    }
  };

  const saveSelf = () => {
    if (!draft) return;
    startSave(async () => {
      const result = await saveQuickReceiptExpense(draft);
      if (!result.success) {
        setErrorMsg(result.message);
        return;
      }
      setStatusMsg(result.message);
      setStep("done");
    });
  };

  const saveSplit = () => {
    if (!draft) return;
    if (split.unassignedIndexes.length > 0) {
      setErrorMsg("Masih ada item yang belum ada pemiliknya.");
      return;
    }
    if (selfTotal <= 0) {
      setErrorMsg("Tandai dulu item milikmu.");
      return;
    }
    setErrorMsg("");
    startSave(async () => {
      const result = await saveSplitBillExpense(draft, assignments, SELF_NAME);
      if (!result.success) {
        setErrorMsg(result.message);
        return;
      }
      setStatusMsg(result.message);
      setStep("done");
    });
  };

  const copyBilling = async () => {
    if (!draft) return;
    const lines = split.participants
      .filter((p) => p.total > 0)
      .map((p) => `${p.name}: ${idr.format(p.total)}`);
    const text = [`Split Bill — ${draft.merchantName}`, ...lines, transferNote].join("\n");
    await navigator.clipboard.writeText(text);
    setStatusMsg("Rincian berhasil disalin!");
  };

  /* ── RENDER ── */

  /* Step: Upload */
  if (step === "upload") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <Camera className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Scan Nota</h1>
          <p className="text-sm text-slate-500">Foto nota struk, AI akan membaca itemnya otomatis</p>
        </div>

        <form onSubmit={handleExtract} className="space-y-4">

          {/* File input — tersembunyi, dipicu oleh label di bawah */}
          <input
            ref={fileInputRef}
            id="receipt-file"
            name="receipt"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Drop zone — label htmlFor adalah cara paling reliable cross-browser */}
          <label
            htmlFor="receipt-file"
            className={`relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
              previewUrl
                ? "border-emerald-400 bg-emerald-50"
                : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50"
            }`}
            style={{ minHeight: "11rem" }}
          >
            {previewUrl ? (
              /* Preview gambar */
              <>
                <img
                  src={previewUrl}
                  alt="Preview nota"
                  className="h-44 w-full object-contain p-2"
                />
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 bg-emerald-500/90 py-1.5 text-xs font-semibold text-white">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span className="max-w-[70%] truncate">{selectedFileName}</span>
                  <span className="opacity-70">· Tap ganti</span>
                </div>
              </>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Camera className="h-7 w-7 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600">Tap untuk pilih foto nota</p>
                  <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, WebP</p>
                </div>
              </div>
            )}
          </label>

          <button
            type="submit"
            disabled={!selectedFileName}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-white font-bold text-base shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Camera className="h-5 w-5" />
            Baca Nota Sekarang
          </button>
        </form>

        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMsg}
          </div>
        )}
      </div>
    );
  }

  /* Step: Loading */
  if (step === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
        </div>
        <p className="text-lg font-bold text-slate-800">Membaca Nota...</p>
        <p className="text-sm text-slate-500 transition-opacity duration-300">
          {loadingMessages[loadingMsgIdx]}
        </p>
      </div>
    );
  }

  /* Step: Review items */
  if (step === "review" && draft) {
    return (
      <div className="space-y-5">
        <div className="text-center space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Hasil Scan</p>
          <h2 className="text-xl font-bold text-slate-800">{draft.merchantName}</h2>
          <p className="text-sm text-slate-500">Cek daftar item — edit jika ada yang salah</p>
        </div>

        {/* Item list */}
        <div className="space-y-2">
          {draft.items.map((item, idx) => (
            <div key={`${idx}-${item.itemName}`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
              <input
                value={item.itemName}
                onChange={(e) => updateItemName(idx, e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
              />
              <CurrencyInput
                name={`_item_price_${idx}`}
                value={item.price}
                onChange={(num) => updateItemPrice(idx, num)}
                className="w-28 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="rounded-lg border border-rose-100 bg-rose-50 p-2 text-rose-500 hover:bg-rose-100 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Plus className="h-4 w-4" /> Tambah Item
        </button>

        {/* Breakdown biaya */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
          <div className="px-4 py-2 bg-slate-100 border-b border-slate-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Rincian Biaya</p>
          </div>
          <div className="divide-y divide-slate-100">
            {/* Subtotal items */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-slate-600">Subtotal item</span>
              <span className="text-sm font-semibold text-slate-800">{idr.format(totals.subtotal)}</span>
            </div>
            {/* Voucher Diskon */}
            <div className="flex items-center gap-3 px-4 py-2">
              <span className="text-sm text-rose-600 w-28 shrink-0">🏷 Diskon</span>
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-sm text-rose-500">−</span>
                <CurrencyInput
                  name="_discount"
                  value={draft.discount}
                  onChange={(num) => setDraft((prev) => prev ? { ...prev, discount: Math.max(0, num) } : prev)}
                  className="w-28 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-sm text-rose-700 font-semibold text-right focus:outline-none focus:ring-2 focus:ring-rose-400/20"
                />
              </div>
            </div>
            {/* Pajak */}
            <div className="flex items-center gap-3 px-4 py-2">
              <span className="text-sm text-amber-700 w-28 shrink-0">📋 Pajak</span>
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-sm text-amber-600">+</span>
                <CurrencyInput
                  name="_tax"
                  value={draft.tax}
                  onChange={(num) => setDraft((prev) => prev ? { ...prev, tax: Math.max(0, num) } : prev)}
                  className="w-28 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-sm text-amber-700 font-semibold text-right focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
            </div>
            {/* Biaya tambahan */}
            <div className="flex items-center gap-3 px-4 py-2">
              <span className="text-sm text-sky-700 w-28 shrink-0 leading-tight">🛎 Biaya lain<br/><span className="text-xs font-normal text-sky-500">(layanan+pack)</span></span>
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-sm text-sky-600">+</span>
                <CurrencyInput
                  name="_service"
                  value={draft.serviceCharge}
                  onChange={(num) => setDraft((prev) => prev ? { ...prev, serviceCharge: Math.max(0, num) } : prev)}
                  className="w-28 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1.5 text-sm text-sky-700 font-semibold text-right focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                />
              </div>
            </div>
            {/* Total */}
            <div className="flex items-center justify-between px-4 py-3 bg-white">
              <span className="text-sm font-bold text-slate-800">Total</span>
              <span className="text-lg font-bold text-emerald-700">{idr.format(totals.total)}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 text-center -mt-2">Tap angka untuk koreksi jika AI salah baca</p>


        {/* Mode picker */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <p className="text-sm font-semibold text-slate-700 text-center">
            Nota ini milikmu semua, atau bareng teman?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleChooseMode("self")}
              disabled={saving}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-5 font-semibold text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 transition-all disabled:opacity-60"
            >
              <User className="h-7 w-7" />
              <span className="text-sm">Milikku Semua</span>
              <span className="text-xs text-slate-400 font-normal">{idr.format(totals.total)} masuk</span>
            </button>
            <button
              type="button"
              onClick={() => handleChooseMode("split")}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-5 font-semibold text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 transition-all"
            >
              <Users className="h-7 w-7" />
              <span className="text-sm">Split Bill</span>
              <span className="text-xs text-slate-400 font-normal">Pilih item milikmu</span>
            </button>
          </div>
        </div>

        {saving && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMsg}
          </div>
        )}
      </div>
    );
  }

  /* Step: Split assign */
  if (step === "split-assign" && draft) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setStep("review")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div className="text-center space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Split Bill</p>
          <h2 className="text-xl font-bold text-slate-800">{draft.merchantName}</h2>
          {/* Badge diskon / pajak / service */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {draft.discount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-600">
                🏷 Diskon {idr.format(draft.discount)}
              </span>
            )}
            {draft.tax > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                📋 PPN {idr.format(draft.tax)}
              </span>
            )}
            {draft.serviceCharge > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                🛎 Service {idr.format(draft.serviceCharge)}
              </span>
            )}
            {draft.discount === 0 && draft.tax === 0 && draft.serviceCharge === 0 && (
              <span className="text-xs text-slate-400">Tandai item milik siapa saja</span>
            )}
          </div>
        </div>

        {/* Friend management */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Partisipan</p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {SELF_NAME} (kamu)
            </span>
            {friends.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => removeFriend(f)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors"
              >
                {f} ×
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={friendInput}
              onChange={(e) => setFriendInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFriend()}
              placeholder="Nama teman (Enter)"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            />
            <button
              type="button"
              onClick={addFriend}
              className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Item assignment */}
        <div className="space-y-2">
          {draft.items.map((item, idx) => {
            const owners = assignments[idx] ?? [];
            const perOwner = owners.length > 0 ? item.price / owners.length : 0;
            const unassigned = owners.length === 0;
            return (
              <div key={`${idx}-${item.itemName}`} className={`rounded-xl border p-3 space-y-2 ${unassigned ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-800">{item.itemName}</span>
                  <span className="text-sm font-bold text-slate-700">{idr.format(item.price)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {participants.map((name) => {
                    const selected = owners.includes(name);
                    return (
                      <button
                        key={`${idx}-${name}`}
                        type="button"
                        onClick={() => toggleOwner(idx, name)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                          selected
                            ? "bg-emerald-500 text-white"
                            : "border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
                {owners.length > 0 && (
                  <p className="text-xs text-slate-500">
                    {idr.format(perOwner)} per orang ({owners.length} orang)
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary bagianku — breakdown transparan */}
        {selfTotal > 0 && (() => {
          const selfLine = split.participants.find((p) => p.name === SELF_NAME);
          if (!selfLine) return null;
          const hasAdjustments = selfLine.discountShare > 0 || selfLine.taxShare > 0 || selfLine.serviceShare > 0;
          return (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Bagianmu</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm text-slate-700">
                  <span>Subtotal item</span>
                  <span className="font-medium">{idr.format(selfLine.subtotal)}</span>
                </div>
                {selfLine.discountShare > 0 && (
                  <div className="flex justify-between text-sm text-rose-600">
                    <span>Potongan diskon</span>
                    <span className="font-medium">− {idr.format(selfLine.discountShare)}</span>
                  </div>
                )}
                {selfLine.taxShare > 0 && (
                  <div className="flex justify-between text-sm text-amber-700">
                    <span>PPN (proporsional)</span>
                    <span className="font-medium">+ {idr.format(selfLine.taxShare)}</span>
                  </div>
                )}
                {selfLine.serviceShare > 0 && (
                  <div className="flex justify-between text-sm text-sky-700">
                    <span>Service charge</span>
                    <span className="font-medium">+ {idr.format(selfLine.serviceShare)}</span>
                  </div>
                )}
                {hasAdjustments && (
                  <div className="border-t border-emerald-200 pt-1.5" />
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-emerald-800">Total bayarmu</span>
                  <span className="text-lg font-bold text-emerald-800">{idr.format(selfLine.total)}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Transfer note */}
        <input
          value={transferNote}
          onChange={(e) => setTransferNote(e.target.value)}
          placeholder="Catatan transfer (opsional)"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={copyBilling}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Copy className="h-4 w-4" /> Salin Tagihan
          </button>
          <button
            type="button"
            onClick={saveSplit}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 disabled:opacity-60 active:scale-95 transition-all"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Bagianku
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMsg}
          </div>
        )}
        {statusMsg && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {statusMsg}
          </div>
        )}
      </div>
    );
  }

  /* Step: Done */
  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-emerald-500" />
        </div>
        <div className="space-y-1">
          <p className="text-xl font-bold text-slate-800">Tersimpan!</p>
          <p className="text-sm text-slate-500">{statusMsg}</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setStep("upload");
              setDraft(null);
              setMode(null);
              setFriends([]);
              setAssignments({});
              setErrorMsg("");
              setStatusMsg("");
              setSelectedFileName(null);
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Scan Lagi
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 active:scale-95 transition-all"
          >
            Ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
}
