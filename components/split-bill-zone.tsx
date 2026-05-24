"use client";

import { useMemo, useState, useTransition } from "react";
import { Copy, Loader2, Plus, ReceiptText, Save, Trash2, Users } from "lucide-react";
import { extractReceiptDraft, saveSplitBillExpense } from "@/actions/expense-actions";
import { computeParticipantSplit, type ReceiptDraft, type SplitAssignments } from "@/lib/receipt-utils";
import { useRouter } from "next/navigation";
import { CurrencyInput } from "@/components/currency-input";

const SELF_NAME = "Saya";

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function SplitBillZone() {
  const router = useRouter();
  const [draft, setDraft] = useState<ReceiptDraft | null>(null);
  const [friendNameInput, setFriendNameInput] = useState("");
  const [friends, setFriends] = useState<string[]>([]);
  const [assignmentState, setAssignmentState] = useState<Record<number, Record<string, boolean>>>({});
  const [transferNote, setTransferNote] = useState("Transfer ke BCA 123456 ya!");
  const [status, setStatus] = useState<string>("");
  const [extracting, startExtract] = useTransition();
  const [saving, startSave] = useTransition();

  const participants = useMemo(() => [SELF_NAME, ...friends], [friends]);

  const assignments = useMemo<SplitAssignments>(() => {
    const result: SplitAssignments = {};
    Object.entries(assignmentState).forEach(([rawIdx, ownerMap]) => {
      const idx = Number(rawIdx);
      result[idx] = Object.entries(ownerMap)
        .filter(([, selected]) => selected)
        .map(([name]) => name);
    });
    return result;
  }, [assignmentState]);

  const split = useMemo(
    () =>
      draft
        ? computeParticipantSplit(draft, participants, assignments)
        : {
            participants: participants.map((name) => ({
              name,
              subtotal: 0,
              ratio: 0,
              discountShare: 0,
              taxShare: 0,
              serviceShare: 0,
              total: 0,
            })),
            subtotalAssigned: 0,
            fullSubtotal: 0,
            extraCharges: 0,
            fullTotal: 0,
            unassignedIndexes: [],
          },
    [draft, participants, assignments],
  );

  const selfLine = split.participants.find((line) => line.name === SELF_NAME);
  const myTotal = selfLine?.total ?? 0;

  const handleExtract = (formData: FormData) => {
    setStatus("");
    startExtract(async () => {
      const result = await extractReceiptDraft(formData);
      if (!result.success || !result.data) {
        setStatus(result.message ?? "Gagal ekstrak nota.");
        return;
      }
      setDraft(result.data);
      setAssignmentState({});
      setStatus(
        result.message ?? "Nota berhasil dibaca. Tambahkan partisipan lalu mapping item ke masing-masing orang.",
      );
    });
  };

  const updateMerchant = (value: string) => {
    setDraft((prev) => (prev ? { ...prev, merchantName: value } : prev));
  };

  const updateTax = (num: number) => {
    setDraft((prev) => (prev ? { ...prev, tax: Math.max(0, num) } : prev));
  };

  const updateDiscount = (num: number) => {
    setDraft((prev) => (prev ? { ...prev, discount: Math.max(0, num) } : prev));
  };

  const updateService = (num: number) => {
    setDraft((prev) =>
      prev ? { ...prev, serviceCharge: Math.max(0, num) } : prev,
    );
  };

  const updateItemName = (index: number, value: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const items = [...prev.items];
      items[index] = { ...items[index], itemName: value };
      return { ...prev, items };
    });
  };

  const updateItemPrice = (index: number, num: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const items = [...prev.items];
      items[index] = { ...items[index], price: Math.max(0, num) };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, items: [...prev.items, { itemName: "Item baru", price: 0 }] };
    });
  };

  const removeItem = (removeIndex: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, items: prev.items.filter((_, idx) => idx !== removeIndex) };
    });

    setAssignmentState((prev) => {
      const next: Record<number, Record<string, boolean>> = {};
      for (const [rawIdx, ownerMap] of Object.entries(prev)) {
        const idx = Number(rawIdx);
        if (idx === removeIndex) continue;
        next[idx > removeIndex ? idx - 1 : idx] = ownerMap;
      }
      return next;
    });
  };

  const addFriend = () => {
    const normalized = normalizeName(friendNameInput);
    if (!normalized) return;
    if (normalized === SELF_NAME) {
      setStatus(`Nama "${SELF_NAME}" sudah dipakai untuk kamu.`);
      return;
    }
    if (participants.includes(normalized)) {
      setStatus(`"${normalized}" sudah ada di daftar partisipan.`);
      return;
    }

    setFriends((prev) => [...prev, normalized]);
    setFriendNameInput("");
  };

  const removeFriend = (name: string) => {
    setFriends((prev) => prev.filter((n) => n !== name));
    setAssignmentState((prev) => {
      const next: Record<number, Record<string, boolean>> = {};
      for (const [rawIdx, ownerMap] of Object.entries(prev)) {
        const copy = { ...ownerMap };
        delete copy[name];
        next[Number(rawIdx)] = copy;
      }
      return next;
    });
  };

  const toggleOwner = (itemIdx: number, participant: string) => {
    setAssignmentState((prev) => {
      const currentItem = prev[itemIdx] ?? {};
      return {
        ...prev,
        [itemIdx]: {
          ...currentItem,
          [participant]: !currentItem[participant],
        },
      };
    });
  };

  const copyBillingDetails = async () => {
    if (!draft) return;
    if (split.unassignedIndexes.length > 0) {
      setStatus("Masih ada item yang belum punya pemilik.");
      return;
    }

    const billLines = split.participants
      .filter((line) => line.total > 0)
      .map((line) => `${line.name} ${idr.format(line.total)}`);

    const text = [
      `Split Bill - ${draft.merchantName}`,
      `Total patungan: ${billLines.join(", ")}`,
      transferNote.trim() || "Tolong transfer ya!",
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setStatus("Rincian penagihan berhasil disalin.");
  };

  const saveMyShare = () => {
    if (!draft) return;
    if (split.unassignedIndexes.length > 0) {
      setStatus("Masih ada item yang belum punya pemilik.");
      return;
    }
    if (myTotal <= 0) {
      setStatus("Bagian kamu masih Rp 0. Tandai dulu item milik kamu.");
      return;
    }

    startSave(async () => {
      const result = await saveSplitBillExpense(draft, assignments, SELF_NAME);
      if (!result.success) {
        setStatus(result.message);
        return;
      }
      setStatus(result.aiAdvice ? `${result.message} | Roast: ${result.aiAdvice}` : result.message);
      router.refresh();
    });
  };

  return (
    <div className="premium-card p-6">
      <div className="mb-1 flex items-center gap-2 text-slate-800">
        <ReceiptText className="h-5 w-5 text-emerald-500" />
        <h2 className="text-lg font-semibold">Split Bill</h2>
      </div>
      <p className="mb-5 text-sm text-slate-500">
        Gaya GoPay untuk web: mapping item ke partisipan, pajak prorata otomatis, lalu salin tagihan.
      </p>

      <form action={handleExtract} className="space-y-4">
        <input
          name="receipt"
          type="file"
          accept="image/*"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 transition-colors"
          required
        />
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600 disabled:opacity-70"
          disabled={extracting}
        >
          {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ReceiptText className="h-4 w-4" />}
          {extracting ? "Membaca nota..." : "Scan Nota Split Bill"}
        </button>
      </form>

      {draft ? (
        <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              value={draft.merchantName}
              onChange={(e) => updateMerchant(e.target.value)}
              className="sm:col-span-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Nama merchant"
            />
            <CurrencyInput
              name="_discount"
              value={draft.discount}
              onChange={updateDiscount}
              placeholder="Potongan"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <CurrencyInput
              name="_tax"
              value={draft.tax}
              onChange={updateTax}
              placeholder="Tax"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <CurrencyInput
              name="_service"
              value={draft.serviceCharge}
              onChange={updateService}
              placeholder="Service"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Tambah Item
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Users className="h-4 w-4" /> Partisipan
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {SELF_NAME} (kamu)
              </span>
              {friends.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => removeFriend(name)}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  title="Hapus partisipan"
                >
                  {name} x
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={friendNameInput}
                onChange={(e) => setFriendNameInput(e.target.value)}
                placeholder="Tambah nama teman (contoh: Rian)"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={addFriend}
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900"
              >
                Tambah
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {draft.items.map((item, idx) => {
              const owners = assignments[idx] ?? [];
              const perOwner = owners.length > 0 ? item.price / owners.length : 0;

              return (
                <div key={`${idx}-${item.itemName}`} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="grid grid-cols-12 gap-2">
                    <input
                      value={item.itemName}
                      onChange={(e) => updateItemName(idx, e.target.value)}
                      className="col-span-7 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                    />
                    <CurrencyInput
                      name={`_item_price_${idx}`}
                      value={item.price}
                      onChange={(num) => updateItemPrice(idx, num)}
                      className="col-span-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="col-span-1 inline-flex items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100"
                      title="Hapus item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {participants.map((name) => {
                      const selected = (assignmentState[idx] ?? {})[name] ?? false;
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
                  <p className="mt-2 text-xs text-slate-500">
                    {owners.length > 0
                      ? `Dibagi ${owners.length} orang: ${idr.format(perOwner)} per orang`
                      : "Belum ada pemilik item ini"}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal nota:</span>
              <span className="font-medium text-slate-800">{idr.format(split.fullSubtotal)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Potongan:</span>
              <span className="font-medium text-slate-800">-{idr.format(draft.discount)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Tax + Service:</span>
              <span className="font-medium text-slate-800">{idr.format(split.extraCharges)}</span>
            </div>
            <div className="mt-3 border-t border-slate-200 pt-3">
              <p className="mb-2 text-sm font-semibold text-slate-800">Ringkasan per orang</p>
              <div className="space-y-1">
                {split.participants.map((line) => (
                  <div key={line.name} className="flex justify-between text-sm">
                    <span>
                      {line.name}
                      <span className="ml-2 text-xs text-slate-500">
                        (sub {idr.format(line.subtotal)} / disc -{idr.format(line.discountShare)} / pajak+svc{" "}
                        {idr.format(line.taxShare + line.serviceShare)})
                      </span>
                    </span>
                    <span className={line.name === SELF_NAME ? "font-semibold text-emerald-700" : "text-slate-800"}>
                      {idr.format(line.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <input
            value={transferNote}
            onChange={(e) => setTransferNote(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder="Contoh: Transfer ke BCA 123456 ya!"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={copyBillingDetails}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <Copy className="h-4 w-4" /> Salin Rincian Penagihan
            </button>
            <button
              type="button"
              onClick={saveMyShare}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600 disabled:opacity-70"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Menyimpan..." : "Simpan Bagianku ke Dasbor"}
            </button>
          </div>

          {split.unassignedIndexes.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Masih ada {split.unassignedIndexes.length} item yang belum diberi pemilik.
            </div>
          )}
        </div>
      ) : null}

      {status ? (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-800">
          {status}
        </div>
      ) : null}
    </div>
  );
}
