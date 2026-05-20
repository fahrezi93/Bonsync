export interface ReceiptDraftItem {
  itemName: string;
  price: number;
}

export interface ReceiptDraft {
  merchantName: string;
  items: ReceiptDraftItem[];
  discount: number;
  tax: number;
  serviceCharge: number;
}

export type SplitAssignments = Record<number, string[]>;

function toNonNegativeNumber(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, num);
}

export function sanitizeReceiptDraft(payload: unknown): ReceiptDraft {
  const raw = payload as {
    merchantName?: string;
    items?: Array<{ itemName?: string; price?: number }>;
    discount?: number;
    tax?: number;
    serviceCharge?: number;
  };

  const items = Array.isArray(raw.items)
    ? raw.items
        .map((item) => ({
          itemName: item.itemName?.trim() || "Unnamed item",
          price: toNonNegativeNumber(item.price),
        }))
        .filter((item) => item.price > 0)
    : [];

  return {
    merchantName: raw.merchantName?.trim() || "Unknown Merchant",
    items,
    discount: toNonNegativeNumber(raw.discount),
    tax: toNonNegativeNumber(raw.tax),
    serviceCharge: toNonNegativeNumber(raw.serviceCharge),
  };
}

export function computeReceiptTotals(draft: ReceiptDraft): {
  subtotal: number;
  discount: number;
  extraCharges: number;
  total: number;
} {
  const subtotal = draft.items.reduce((sum, item) => sum + toNonNegativeNumber(item.price), 0);
  const discount = toNonNegativeNumber(draft.discount);
  const extraCharges = toNonNegativeNumber(draft.tax) + toNonNegativeNumber(draft.serviceCharge);
  return {
    subtotal,
    discount,
    extraCharges,
    total: Math.max(0, subtotal - discount + extraCharges),
  };
}

export function normalizeSelectedIndexes(selectedIndexes: number[], itemCount: number): number[] {
  const unique = new Set<number>();
  for (const idx of selectedIndexes) {
    if (Number.isInteger(idx) && idx >= 0 && idx < itemCount) {
      unique.add(idx);
    }
  }
  return Array.from(unique).sort((a, b) => a - b);
}

export function computeSplitShare(
  draft: ReceiptDraft,
  selectedIndexes: number[],
): {
  pickedSubtotal: number;
  fullSubtotal: number;
  discount: number;
  extraCharges: number;
  share: number;
  normalizedSelectedIndexes: number[];
} {
  const { subtotal: fullSubtotal, extraCharges, discount } = computeReceiptTotals(draft);
  const normalized = normalizeSelectedIndexes(selectedIndexes, draft.items.length);
  const selectedSet = new Set(normalized);

  const pickedSubtotal = draft.items.reduce(
    (sum, item, idx) => (selectedSet.has(idx) ? sum + toNonNegativeNumber(item.price) : sum),
    0,
  );

  if (fullSubtotal <= 0) {
    return {
      pickedSubtotal,
      fullSubtotal,
      discount,
      extraCharges,
      share: 0,
      normalizedSelectedIndexes: normalized,
    };
  }

  const ratio = pickedSubtotal / fullSubtotal;
  const share = Math.max(0, pickedSubtotal - discount * ratio + extraCharges * ratio);

  return {
    pickedSubtotal,
    fullSubtotal,
    discount,
    extraCharges,
    share,
    normalizedSelectedIndexes: normalized,
  };
}

export interface ParticipantSplitLine {
  name: string;
  subtotal: number;
  ratio: number;
  discountShare: number;
  taxShare: number;
  serviceShare: number;
  total: number;
}

export interface ParticipantSplitResult {
  participants: ParticipantSplitLine[];
  subtotalAssigned: number;
  fullSubtotal: number;
  extraCharges: number;
  fullTotal: number;
  unassignedIndexes: number[];
}

function normalizeParticipantName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function normalizeParticipantNames(participants: string[]): string[] {
  const unique = new Set<string>();
  for (const name of participants) {
    const normalized = normalizeParticipantName(name);
    if (!normalized) continue;
    unique.add(normalized);
  }
  return Array.from(unique);
}

export function computeParticipantSplit(
  draft: ReceiptDraft,
  participantsInput: string[],
  assignments: SplitAssignments,
): ParticipantSplitResult {
  const participants = normalizeParticipantNames(participantsInput);
  const participantSet = new Set(participants);
  const lines = new Map<string, ParticipantSplitLine>();
  const unassignedIndexes: number[] = [];

  for (const name of participants) {
    lines.set(name, {
      name,
      subtotal: 0,
      ratio: 0,
      discountShare: 0,
      taxShare: 0,
      serviceShare: 0,
      total: 0,
    });
  }

  draft.items.forEach((item, idx) => {
    const rawOwners = assignments[idx] ?? [];
    const owners = Array.from(
      new Set(rawOwners.map((name) => normalizeParticipantName(name)).filter((name) => participantSet.has(name))),
    );

    if (owners.length === 0) {
      unassignedIndexes.push(idx);
      return;
    }

    const splitAmount = toNonNegativeNumber(item.price) / owners.length;
    owners.forEach((owner) => {
      const line = lines.get(owner);
      if (!line) return;
      line.subtotal += splitAmount;
    });
  });

  const { subtotal: fullSubtotal, extraCharges, total: fullTotal } = computeReceiptTotals(draft);
  const subtotalAssigned = Array.from(lines.values()).reduce((sum, line) => sum + line.subtotal, 0);

  for (const line of lines.values()) {
    line.ratio = subtotalAssigned > 0 ? line.subtotal / subtotalAssigned : 0;
    line.discountShare = toNonNegativeNumber(draft.discount) * line.ratio;
    line.taxShare = toNonNegativeNumber(draft.tax) * line.ratio;
    line.serviceShare = toNonNegativeNumber(draft.serviceCharge) * line.ratio;
    line.total = Math.max(0, line.subtotal - line.discountShare + line.taxShare + line.serviceShare);
  }

  return {
    participants: Array.from(lines.values()),
    subtotalAssigned,
    fullSubtotal,
    extraCharges,
    fullTotal,
    unassignedIndexes,
  };
}
