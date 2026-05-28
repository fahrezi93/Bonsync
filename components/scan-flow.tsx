"use client";

import { useRef, useState, useTransition, useEffect } from "react";
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
  Sparkles,
  Upload,
  Scan,
  Zap,
  RotateCcw,
  CreditCard,
  Check,
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
import { createClient } from "@/utils/supabase/client";
import {
  addTransferAccount,
  deleteTransferAccount,
  getTransferAccounts,
} from "@/actions/transfer-account-actions";

type Step = "upload" | "loading" | "review" | "split-assign" | "done";
type Mode = "self" | "split" | null;
type TransferAccount = Awaited<ReturnType<typeof getTransferAccounts>>[number];

const SELF_NAME = "Saya";

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function normalizeName(n: string) {
  return n.trim().replace(/\s+/g, " ");
}

const loadingMessages = [
  "Gemini lagi memelototi struk jajan boba kamu…",
  "Menghitung pajak yang lebih besar dari ekspektasi…",
  "Sabar ya, AI-nya lagi pusing baca struk lecek…",
  "Sedikit lagi, moga-moga saldo masih aman…",
];

export function ScanFlow() {
  const { push } = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [draft, setDraft] = useState<ReceiptDraft | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const modeRef = useRef<Mode>(null);
  const [friends, setFriends] = useState<string[]>([]);
  const [friendInput, setFriendInput] = useState("");
  const [assignments, setAssignments] = useState<SplitAssignments>({});
  const [transferNote, setTransferNote] = useState("Transfer ke BCA 123456 ya!");
  const [transferAccounts, setTransferAccounts] = useState<TransferAccount[]>([]);
  const [selectedTransferAccountId, setSelectedTransferAccountId] = useState("");
  const [accountLabel, setAccountLabel] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountSaving, startAccountSave] = useTransition();
  const [accountDeleting, startAccountDelete] = useTransition();
  const [statusMsg, setStatusMsg] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const selectedFileRef = useRef<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [extracting, startExtract] = useTransition();
  const [saving, startSave] = useTransition();
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      selectedFileRef.current = file;
      setSelectedFileName(file.name);
      // Revoke lama kalau ada
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      selectedFileRef.current = null;
      setSelectedFileName(null);
      setPreviewUrl(null);
    }
    // Reset nilai input agar file yang sama bisa dipilih ulang
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    setErrorMsg("");
  };

  const participants = [SELF_NAME, ...friends];

  const totals = draft ? computeReceiptTotals(draft) : { subtotal: 0, discount: 0, extraCharges: 0, total: 0 };

  const split = draft
    ? computeParticipantSplit(draft, participants, assignments)
    : {
      participants: [],
      subtotalAssigned: 0,
      fullSubtotal: 0,
      extraCharges: 0,
      fullTotal: 0,
      unassignedIndexes: [],
    };

  const selfTotal = split.participants.find((p) => p.name === SELF_NAME)?.total ?? 0;

  /* ── useEffect for funny loading texts ── */
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    if (step === "loading") {
      const interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [step]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (statusMsg) {
      const timer = setTimeout(() => setStatusMsg(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);

  // Clear error message when user modifies split bill configuration or inputs
  useEffect(() => {
    setErrorMsg("");
  }, [assignments, friends, transferNote, friendInput, draft?.items]);

  useEffect(() => {
    let cancelled = false;

    getTransferAccounts()
      .then((accounts) => {
        if (!cancelled) setTransferAccounts(accounts);
      })
      .catch(() => {
        if (!cancelled) setTransferAccounts([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);
  /* ── handlers ── */
  const handleExtract = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFileRef.current) {
      setErrorMsg("Pilih foto nota dulu ya.");
      return;
    }
    setErrorMsg("");
    setStep("loading");

    const finalFormData = new FormData();
    finalFormData.append("receipt", selectedFileRef.current);

    startExtract(async () => {
      const result = await extractReceiptDraft(finalFormData);
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

  /**
   * Assign semua item ke semua participants sekaligus.
   * Kalau hanya 2 orang (Saya + 1 teman) → setiap item dibagi 50/50.
   * Kalau N orang → setiap item dibagi rata ke N orang.
   */
  const assignAll = () => {
    if (!draft || participants.length === 0) return;
    const next: SplitAssignments = {};
    draft.items.forEach((_, idx) => {
      next[idx] = [...participants];
    });
    setAssignments(next);
  };

  /** Reset semua assignment ke kosong */
  const clearAll = () => {
    setAssignments({});
  };

  /**
   * Cek apakah semua item sudah di-assign ke semua participants
   * (kondisi "bagi rata semua" aktif).
   */
  const isAllAssignedToAll = (() => {
    if (!draft || draft.items.length === 0 || participants.length === 0) return false;
    return draft.items.every((_, idx) => {
      const owners = assignments[idx] ?? [];
      return (
        owners.length === participants.length &&
        participants.every((p) => owners.includes(p))
      );
    });
  })();

  const handleChooseMode = (chosen: "self" | "split") => {
    modeRef.current = chosen;
    if (chosen === "self") {
      saveSelf();
    } else {
      setStep("split-assign");
    }
  };

  const uploadReceiptImage = async (file: File): Promise<string | null> => {
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Upload auth error:", userError?.message);
        return null;
      }

      const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
      if (!allowedTypes.has(file.type)) {
        console.error("Unsupported receipt image type:", file.type);
        return null;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { data, error } = await supabase.storage
        .from("receipts")
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return null;
      }

      return data.path;
    } catch (e) {
      console.error("Upload exception:", e);
      return null;
    }
  };

  const saveSelf = () => {
    if (!draft) return;
    startSave(async () => {
      let finalDraft = draft;
      if (selectedFileRef.current) {
        const imageUrl = await uploadReceiptImage(selectedFileRef.current);
        if (imageUrl) {
          finalDraft = { ...draft, imageUrl };
        }
      }

      const result = await saveQuickReceiptExpense(finalDraft);
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
      const firstUnassignedIdx = split.unassignedIndexes[0];
      const el = document.getElementById(`item-card-${firstUnassignedIdx}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    if (selfTotal <= 0) {
      setErrorMsg("Tandai dulu item milikmu.");
      const el = document.getElementById("item-card-0");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setErrorMsg("");
    startSave(async () => {
      let finalDraft = draft;
      if (selectedFileRef.current) {
        const imageUrl = await uploadReceiptImage(selectedFileRef.current);
        if (imageUrl) {
          finalDraft = { ...draft, imageUrl };
        }
      }

      const result = await saveSplitBillExpense(finalDraft, assignments, SELF_NAME);
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
    const lines = split.participants.reduce<string[]>((acc, p) => {
      if (p.total > 0) acc.push(`${p.name}: ${idr.format(p.total)}`);
      return acc;
    }, []);
    const text = [`Split Bill — ${draft.merchantName}`, ...lines, transferNote].join("\n");
    await navigator.clipboard.writeText(text);
    setStatusMsg("Rincian berhasil disalin!");
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const applyTransferAccount = (accountId: string) => {
    setSelectedTransferAccountId(accountId);
    const account = transferAccounts.find((item) => item.id === accountId);
    if (!account) return;

    setTransferNote(
      `Transfer ke ${account.bankName} ${account.accountNumber} a/n ${account.accountHolder}`,
    );
  };

  const saveTransferAccount = () => {
    setErrorMsg("");
    setStatusMsg("");

    startAccountSave(async () => {
      const result = await addTransferAccount({
        label: accountLabel,
        bankName,
        accountNumber,
        accountHolder,
      });

      if (!result.success) {
        setErrorMsg(result.message);
        return;
      }

      const accounts = await getTransferAccounts();
      setTransferAccounts(accounts);
      const saved = accounts.find((account) => account.label === accountLabel.trim().replace(/\s+/g, " "));
      if (saved) {
        applyTransferAccount(saved.id);
      }
      setAccountLabel("");
      setBankName("");
      setAccountNumber("");
      setAccountHolder("");
      setStatusMsg(result.message);
      setShowAccountModal(false);
    });
  };

  const removeTransferAccount = () => {
    if (!selectedTransferAccountId) return;

    setErrorMsg("");
    setStatusMsg("");

    startAccountDelete(async () => {
      const result = await deleteTransferAccount(selectedTransferAccountId);
      if (!result.success) {
        setErrorMsg(result.message);
        return;
      }

      const accounts = await getTransferAccounts();
      setTransferAccounts(accounts);
      setSelectedTransferAccountId("");
      setStatusMsg(result.message);
    });
  };

  /* Step: Upload */
  if (step === "upload") {
    return (
      <div className="animate-fade-in-up pt-4 md:pt-12 max-w-xl mx-auto w-full px-4">
        <div className="premium-card p-6 md:p-8 flex flex-col items-center text-center">
          <div className="mb-8 flex flex-col items-center gap-y-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 mb-2">
              <Scan className="size-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Scan Nota</h1>
            <p className="text-sm text-slate-500 font-medium max-w-sm">
              Unggah foto nota belanjamu, kami akan mengekstrak daftar item dan totalnya secara otomatis.
            </p>
          </div>

          <form onSubmit={handleExtract} className="w-full flex flex-col items-center">
            <input
              ref={fileInputRef}
              id="receipt-file"
              name="receipt_gallery"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={cameraInputRef}
              id="receipt-camera"
              name="receipt_camera"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {previewUrl ? (
              <div className="w-full relative rounded-[20px] overflow-hidden bg-slate-50 border border-slate-200 aspect-[4/3] flex flex-col items-center justify-center mb-8 group">
                <img
                  src={previewUrl}
                  alt="Preview nota"
                  className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-[1.02]"
                />

                {/* Floating Action Buttons */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <label
                    htmlFor="receipt-camera"
                    className="cursor-pointer flex items-center justify-center gap-2 bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-300 rounded-full px-4 py-2.5 text-xs font-bold shadow-sm transition-all flex-1 max-w-[140px]"
                  >
                    <Camera className="size-4" /> Kamera
                  </label>
                  <label
                    htmlFor="receipt-file"
                    className="cursor-pointer flex items-center justify-center gap-2 bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-300 rounded-full px-4 py-2.5 text-xs font-bold shadow-sm transition-all flex-1 max-w-[140px]"
                  >
                    <Upload className="size-4" /> Galeri
                  </label>
                </div>
              </div>
            ) : (
              <div className="w-full flex gap-4 mb-8">
                <label
                  htmlFor="receipt-camera"
                  className="flex-1 flex flex-col items-center justify-center gap-4 p-6 rounded-[20px] border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer transition-all active:scale-95 group"
                >
                  <div className="size-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors">
                    <Camera className="size-5" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-700 group-hover:text-emerald-700">Kamera</span>
                </label>

                <label
                  htmlFor="receipt-file"
                  className="flex-1 flex flex-col items-center justify-center gap-4 p-6 rounded-[20px] border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer transition-all active:scale-95 group"
                >
                  <div className="size-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors">
                    <Upload className="size-5" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-700 group-hover:text-emerald-700">Galeri</span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedFileName}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed shadow-sm"
            >
              Lanjutkan
            </button>
          </form>

          {errorMsg && (
            <div className="relative mt-4 w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 pr-10 text-xs font-bold text-rose-700 text-left animate-fade-in-up">
              ⚠️ {errorMsg}
              <button
                type="button"
                onClick={() => setErrorMsg("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 hover:text-rose-750 text-sm font-semibold shrink-0 cursor-pointer p-1"
                aria-label="Tutup"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* Step: Loading */
  if (step === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center animate-fade-in-up">
        <div className="relative">
          <div className="absolute inset-0 rounded-[28px] bg-emerald-500/20 animate-ping" />
          <div className="relative flex size-20 items-center justify-center rounded-[28px] bg-emerald-50 border border-emerald-100 shadow-xl shadow-emerald-500/10">
            <Loader2 className="size-8 text-emerald-500 animate-spin" strokeWidth={2.5} />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Membaca Nota…</h2>
          <p className="text-sm font-medium text-slate-500 transition-opacity duration-300 max-w-[250px] mx-auto">
            {loadingMessages[loadingMsgIdx]}
          </p>
        </div>
      </div>
    );
  }

  /* Step: Review items */
  if (step === "review" && draft) {
    return (
      <div className="animate-fade-in-up pt-4 md:pt-12 max-w-5xl mx-auto w-full px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

          {/* Left Column: Item List & Add Button */}
          <div className="md:col-span-7 flex flex-col gap-4 order-1">
            <div className="px-2">
              <h2 className="text-lg font-bold text-slate-800">Daftar Item Belanja</h2>
              <p className="text-sm text-slate-500">Klik teks atau harga untuk mengedit jika ada yang kurang tepat.</p>
            </div>

            <div className="premium-card p-3 md:p-4 flex flex-col gap-2 md:gap-3">
              {draft.items.map((item, idx) => (
                <div
                  key={`${idx}-${item.itemName}`}
                  className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-[16px] border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors group animate-fade-in-up"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="hidden md:flex size-8 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-[11px] font-bold text-slate-500">
                    {String(idx + 1).padStart(2, "0")}
                  </div>

                  <div className="flex-1 min-w-0">
                    <input
                      value={item.itemName}
                      onChange={(e) => updateItemName(idx, e.target.value)}
                      className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-400 focus:outline-none py-1 text-xs md:text-[13px] font-bold text-slate-800 transition-colors"
                      placeholder="Nama item"
                    />
                  </div>

                  <div className="flex shrink-0 items-center gap-1 bg-white border border-slate-200 rounded-lg md:rounded-xl px-2 md:px-3 py-1 md:py-1.5 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-400 transition-all w-24 md:w-32 justify-end shadow-sm">
                    <span className="text-[10px] md:text-[11px] font-bold text-slate-400">Rp</span>
                    <CurrencyInput
                      name={`_item_price_${idx}`}
                      value={item.price}
                      onChange={(num) => updateItemPrice(idx, num)}
                      className="w-full bg-transparent text-right font-bold text-slate-800 text-xs md:text-sm focus:outline-none"
                      minimal={true}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1.5 md:p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors active:scale-90"
                    title="Hapus Item"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                className="w-full flex items-center justify-center gap-2 py-3 mt-1 md:mt-2 rounded-[16px] border-2 border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 text-slate-500 text-xs md:text-[13px] font-bold transition-colors active:scale-[0.98]"
              >
                <Plus className="size-4" strokeWidth={3} /> Tambah Item Baru
              </button>
            </div>
          </div>

          {/* Right Column: Summary & Actions */}
          <div className="md:col-span-5 flex flex-col gap-6 order-2">
            <div className="px-2">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight line-clamp-1">{draft.merchantName}</h2>
              <p className="text-sm text-slate-500">Ringkasan Tagihan</p>
            </div>

            <div className="premium-card p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between text-[13px] font-semibold text-slate-500">
                <span>Subtotal Item</span>
                <span className="font-bold text-slate-800">{idr.format(totals.subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-[13px]">
                <span className="font-semibold text-slate-600">Diskon</span>
                <div className="flex shrink-0 items-center gap-1 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-400 transition-all w-32 justify-end">
                  <span className="text-[11px] font-bold text-emerald-500">-Rp</span>
                  <CurrencyInput
                    name="_discount"
                    value={draft.discount}
                    onChange={(num) => setDraft((prev) => prev ? { ...prev, discount: Math.max(0, num) } : prev)}
                    className="w-full bg-transparent text-right font-bold text-emerald-600 focus:outline-none"
                    minimal={true}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[13px]">
                <span className="font-semibold text-slate-600">Pajak (PPN)</span>
                <div className="flex shrink-0 items-center gap-1 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-400 transition-all w-32 justify-end">
                  <span className="text-[11px] font-bold text-slate-400">+Rp</span>
                  <CurrencyInput
                    name="_tax"
                    value={draft.tax}
                    onChange={(num) => setDraft((prev) => prev ? { ...prev, tax: Math.max(0, num) } : prev)}
                    className="w-full bg-transparent text-right font-bold text-slate-700 focus:outline-none"
                    minimal={true}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[13px]">
                <span className="font-semibold text-slate-600">Biaya Layanan</span>
                <div className="flex shrink-0 items-center gap-1 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-400 transition-all w-32 justify-end">
                  <span className="text-[11px] font-bold text-slate-400">+Rp</span>
                  <CurrencyInput
                    name="_service"
                    value={draft.serviceCharge}
                    onChange={(num) => setDraft((prev) => prev ? { ...prev, serviceCharge: Math.max(0, num) } : prev)}
                    className="w-full bg-transparent text-right font-bold text-slate-700 focus:outline-none"
                    minimal={true}
                  />
                </div>
              </div>

              <div className="h-px bg-slate-100 my-2 w-full" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">Total Nota</span>
                <span className="text-2xl font-black text-emerald-600 tracking-tight">{idr.format(totals.total)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <p className="text-[13px] font-bold text-slate-800 px-2">Metode Penyimpanan</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleChooseMode("self")}
                  disabled={saving}
                  className="flex flex-col items-center justify-center gap-3 premium-card p-5 hover:border-emerald-400 hover:shadow-md transition-all disabled:opacity-50 active:scale-95"
                >
                  <div className="size-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <User className="size-5" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-700">Milikku Semua</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChooseMode("split")}
                  className="flex flex-col items-center justify-center gap-3 premium-card p-5 hover:border-emerald-400 hover:shadow-md transition-all active:scale-95"
                >
                  <div className="size-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center">
                    <Users className="size-5" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-700">Bagi Tagihan</span>
                </button>
              </div>
            </div>

            {saving && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm font-semibold text-slate-500 animate-pulse">
                <Loader2 className="size-4 animate-spin text-emerald-500" /> Menyimpan data...
              </div>
            )}

            {errorMsg && (
              <div className="relative rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 pr-10 text-xs font-bold text-rose-700 animate-fade-in-up">
                ⚠️ {errorMsg}
                <button
                  type="button"
                  onClick={() => setErrorMsg("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 hover:text-rose-750 text-sm font-semibold shrink-0 cursor-pointer p-1"
                  aria-label="Tutup"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* Step: Split assign */
  if (step === "split-assign" && draft) {
    return (
      <div className="pt-4 md:pt-12 max-w-5xl mx-auto w-full px-4">
        <div className="animate-fade-in-up flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => setStep("review")}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 transition-colors active:scale-95"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Split Bill</p>
            <h2 className="text-lg font-bold text-slate-800 leading-tight truncate">{draft.merchantName}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* ── PARTISIPAN ── mobile: order-1 (atas), desktop: kolom kanan baris 1 */}
          <div className="md:col-span-5 md:row-start-1 flex flex-col gap-6 order-1 md:order-2">
            <div className="premium-card p-5 space-y-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-mono">Daftar Partisipan</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-xl bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                  {SELF_NAME} (kamu)
                </span>
                {friends.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => removeFriend(f)}
                    className="group rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors cursor-pointer select-none animate-fade-in-up flex items-center gap-1"
                  >
                    <span>{f}</span>
                    <span className="text-slate-400 group-hover:text-rose-500">×</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={friendInput}
                  onChange={(e) => setFriendInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addFriend()}
                  placeholder="Ketik nama teman (Enter)"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white px-3.5 py-2.5 text-[13px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={addFriend}
                  className="rounded-xl bg-slate-800 px-4 py-2.5 text-white hover:bg-slate-900 transition-colors flex items-center justify-center cursor-pointer select-none active:scale-95"
                >
                  <Plus className="size-4" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>

          {/* ── ITEM LIST ── mobile: order-2, desktop: kolom kiri span 2 baris */}
          <div className="md:col-span-7 md:row-start-1 md:row-span-2 flex flex-col gap-4 order-2 md:order-1">
            <div className="px-2 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Bagi Tagihan</h2>
                <p className="text-sm text-slate-500">Pilih siapa saja yang patungan untuk tiap item.</p>
              </div>

              {/* Shortcut buttons — hanya tampil kalau ada minimal 1 teman */}
              {friends.length > 0 && (
                <div className="flex items-center gap-2 shrink-0 mt-0.5">
                  {!isAllAssignedToAll ? (
                    <button
                      type="button"
                      onClick={assignAll}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-[11px] font-bold transition-all active:scale-95 shadow-sm"
                      title={`Assign semua item ke semua ${participants.length} orang (bagi rata)`}
                    >
                      <Zap className="size-3.5" strokeWidth={2.5} />
                      Bagi Rata
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 px-3.5 py-2 text-[11px] font-bold transition-all active:scale-95"
                      title="Reset semua assignment"
                    >
                      <RotateCcw className="size-3.5" strokeWidth={2.5} />
                      Reset
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Info banner kalau belum ada teman */}
            {friends.length === 0 && (
              <div className="mx-2 rounded-2xl border border-amber-200/70 bg-amber-50/60 px-4 py-3 flex items-center gap-3">
                <Users className="size-4 text-amber-600 shrink-0" />
                <p className="text-[12px] font-bold text-amber-700">
                  Tambah nama teman dulu di atas, baru bisa bagi item.
                </p>
              </div>
            )}

            <div className="premium-card p-3 md:p-4 flex flex-col gap-3">
              {draft.items.map((item, idx) => {
                const owners = assignments[idx] ?? [];
                const perOwner = owners.length > 0 ? item.price / owners.length : 0;
                const unassigned = owners.length === 0;
                const isEvenSplit =
                  owners.length === participants.length &&
                  participants.length >= 2 &&
                  participants.every((p) => owners.includes(p));
                const splitLabel =
                  owners.length === 2 && isEvenSplit
                    ? "50:50"
                    : owners.length >= 2 && isEvenSplit
                      ? `Rata (${owners.length} orang)`
                      : null;

                return (
                  <div
                    key={`${idx}-${item.itemName}`}
                    id={`item-card-${idx}`}
                    className={`rounded-[16px] border p-3.5 space-y-3 transition-all duration-300 ${unassigned
                        ? "border-amber-300 bg-amber-50/40 ring-1 ring-amber-200"
                        : isEvenSplit
                          ? "border-emerald-200/60 bg-emerald-50/20"
                          : "border-slate-100 bg-slate-50/30 hover:border-slate-200"
                      }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <span className="text-[13px] font-bold text-slate-800 leading-snug">{item.itemName}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {splitLabel && (
                          <span className="rounded-full bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 tracking-wide">
                            {splitLabel}
                          </span>
                        )}
                        <span className="text-[13px] font-black text-slate-800">{idr.format(item.price)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {participants.map((name) => {
                        const selected = owners.includes(name);
                        return (
                          <button
                            key={`${idx}-${name}`}
                            type="button"
                            onClick={() => toggleOwner(idx, name)}
                            className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer select-none active:scale-95 ${selected
                                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 border border-emerald-500"
                                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                    {owners.length > 0 && (
                      <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                        <div className="size-1 rounded-full bg-slate-300" />
                        <span>{idr.format(perOwner)} per orang ({owners.length})</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── SUMMARY + ACTIONS ── mobile: order-3 (bawah), desktop: kolom kanan baris 2 */}
          <div className="md:col-span-5 md:row-start-2 flex flex-col gap-6 order-3 md:order-2">

            {/* Summary bagianku */}
            {selfTotal > 0 && (() => {
              const selfLine = split.participants.find((p) => p.name === SELF_NAME);
              if (!selfLine) return null;
              const hasAdjustments = selfLine.discountShare > 0 || selfLine.taxShare > 0 || selfLine.serviceShare > 0;
              return (
                <div className="premium-card p-5 space-y-3 animate-fade-in-up bg-emerald-50/30 border-emerald-100">
                  <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600 font-mono">Bagianmu (Proporsional)</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[13px] font-bold text-slate-600">
                      <span>Subtotal Item</span>
                      <span className="text-slate-800">{idr.format(selfLine.subtotal)}</span>
                    </div>
                    {selfLine.discountShare > 0 && (
                      <div className="flex justify-between text-[13px] font-bold text-emerald-600">
                        <span>Diskon (proporsional)</span>
                        <span>− {idr.format(selfLine.discountShare)}</span>
                      </div>
                    )}
                    {selfLine.taxShare > 0 && (
                      <div className="flex justify-between text-[13px] font-bold text-slate-500">
                        <span>PPN (proporsional)</span>
                        <span>+ {idr.format(selfLine.taxShare)}</span>
                      </div>
                    )}
                    {selfLine.serviceShare > 0 && (
                      <div className="flex justify-between text-[13px] font-bold text-slate-500">
                        <span>Service (proporsional)</span>
                        <span>+ {idr.format(selfLine.serviceShare)}</span>
                      </div>
                    )}
                    {hasAdjustments && <div className="border-t border-emerald-100 my-2" />}
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[13px] font-black text-slate-800">Total Bayarmu</span>
                      <span className="text-xl font-black text-emerald-600 tracking-tight">{idr.format(selfLine.total)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="space-y-3">
              <div className="premium-card p-5 space-y-4 bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-slate-50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-4 text-emerald-500" />
                    <label htmlFor="transfer-note" className="text-xs font-bold tracking-tight text-slate-700 font-sora">
                      Catatan Transfer
                    </label>
                  </div>
                  
                  {/* Plus button to open popup modal */}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg("");
                      setStatusMsg("");
                      setShowAccountModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition-all active:scale-95 cursor-pointer shadow-sm select-none"
                  >
                    <Plus className="size-3.5 text-emerald-500" strokeWidth={2.5} />
                    <span>Rekening Baru</span>
                  </button>
                </div>

                {/* Dropdown Rekening Tersimpan */}
                {transferAccounts.length > 0 && (
                  <div className="flex items-center gap-2 bg-slate-50/50 p-1.5 rounded-xl border border-slate-100/60">
                    <select
                      value={selectedTransferAccountId}
                      onChange={(e) => applyTransferAccount(e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border-0 bg-transparent px-2 text-[12px] font-bold text-slate-700 focus:outline-none cursor-pointer"
                      aria-label="Pilih rekening tersimpan"
                    >
                      <option value="">Pilih rekening tersimpan</option>
                      {transferAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.label} - {account.bankName} {account.accountNumber}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={removeTransferAccount}
                      disabled={!selectedTransferAccountId || accountDeleting}
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-rose-100 bg-white text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-50 transition-colors cursor-pointer"
                      aria-label="Hapus rekening tersimpan"
                    >
                      {accountDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </button>
                  </div>
                )}

                {/* Catatan Transfer Teks Input */}
                <input
                  id="transfer-note"
                  value={transferNote}
                  onChange={(e) => {
                    setTransferNote(e.target.value);
                    setSelectedTransferAccountId("");
                  }}
                  placeholder="Contoh: Transfer ke BCA 1234567 a/n Budi"
                  maxLength={120}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-[13px] font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all hover:border-slate-300"
                />

                <p className="text-[10px] text-slate-400 font-medium px-1 leading-relaxed">
                  Teks catatan transfer ini akan ikut tersalin saat kamu mengklik &quot;Salin Tagihan&quot;.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={saveSplit}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 rounded-[20px] bg-emerald-500 border border-emerald-400 px-4 py-3.5 text-[13px] font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 disabled:opacity-60 active:scale-95 transition-all cursor-pointer select-none w-full"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  <span>{saving ? "Menyimpan..." : "Simpan Bagianku"}</span>
                </button>
                <button
                  type="button"
                  onClick={copyBilling}
                  className={`flex-1 flex items-center justify-center gap-2 premium-card px-4 py-3.5 text-[13px] font-bold transition-all cursor-pointer select-none active:scale-95 w-full bg-white ${
                    copied
                      ? "border-emerald-300 bg-emerald-50/30 text-emerald-700"
                      : "text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="size-4 text-emerald-500" />
                      <span>Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-4 text-slate-500" />
                      <span>Salin Tagihan</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="relative rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3.5 pr-10 text-xs font-bold text-rose-700 animate-fade-in-up">
                ⚠️ {errorMsg}
                <button
                  type="button"
                  onClick={() => setErrorMsg("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 hover:text-rose-750 text-sm font-semibold shrink-0 cursor-pointer p-1"
                  aria-label="Tutup"
                >
                  ×
                </button>
              </div>
            )}
            {statusMsg && (
              <div className="relative rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3.5 pr-10 text-xs font-bold text-emerald-800 animate-fade-in-up">
                ✅ {statusMsg}
                <button
                  type="button"
                  onClick={() => setStatusMsg("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 hover:text-emerald-800 text-sm font-semibold shrink-0 cursor-pointer p-1"
                  aria-label="Tutup"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      </div> {/* ── Penutup dari <div className="animate-fade-in-up flex flex-col gap-6"> ── */}

      {/* ── Add New Account Modal Popup ── */}
      {showAccountModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 overflow-y-auto bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
          {/* Blur background overlay */}
          <div 
            onClick={() => setShowAccountModal(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-fade-in-up z-10 max-h-[90vh] overflow-y-auto md:overflow-visible">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="size-4.5 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-800 font-sora">Tambah Rekening Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-semibold shrink-0 cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider pl-1">Nama Simpanan</label>
                <input
                  value={accountLabel}
                  onChange={(e) => setAccountLabel(e.target.value)}
                  placeholder="Contoh: BCA Utama"
                  maxLength={40}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider pl-1">Nama Bank</label>
                <input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Contoh: BCA, Mandiri, dll"
                  maxLength={32}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider pl-1">Nomor Rekening</label>
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Masukkan nomor rekening"
                  inputMode="numeric"
                  maxLength={40}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider pl-1">Atas Nama (Pemilik)</label>
                <input
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Masukkan nama lengkap pemilik"
                  maxLength={60}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Error Message inside Modal */}
            {errorMsg && (
              <div className="relative rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 pr-8 text-[11px] font-bold text-rose-700 animate-fade-in-up">
                ⚠️ {errorMsg}
                <button
                  type="button"
                  onClick={() => setErrorMsg("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-rose-500 hover:text-rose-750 text-xs font-semibold shrink-0 cursor-pointer p-0.5"
                  aria-label="Tutup"
                >
                  ×
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-1.5 border-t border-slate-150 pt-3">
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-98 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveTransferAccount}
                disabled={accountSaving}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60 active:scale-98 transition-colors cursor-pointer"
              >
                {accountSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    );
  }

  /* Step: Done */
  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-16 text-center pt-4 md:pt-12">
        <div className="size-20 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle className="size-10 text-emerald-500" />
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
              modeRef.current = null;
              setFriends([]);
              setAssignments({});
              setErrorMsg("");
              setStatusMsg("");
              setSelectedFileName(null);
              selectedFileRef.current = null;
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
            onClick={() => push("/")}
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
