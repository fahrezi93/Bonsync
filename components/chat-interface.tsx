"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Send, Loader2, Sparkles, CheckCircle, XCircle } from "lucide-react";
import { processChatMessage, saveChatExpense } from "@/actions/chat-actions";

interface ChatMessage {
  id: number;
  role: "user" | "ai";
  content: string;
  /** Ada expense menunggu konfirmasi */
  pendingExpense?: { description: string; amount: number };
  /** Konfirmasi sudah ditangani */
  confirmed?: "yes" | "no";
}

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const QUICK_PROMPTS = [
  "Pengeluaranku bulan ini parah nggak?",
  "Roasting deh pola belanjaku",
  "Kasih saran hemat dong",
];

function parseMarkdown(text: string): React.ReactNode {
  if (!text) return "";
  
  const regex = /(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return (
        <strong key={index} className="font-bold text-slate-800">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return (
        <em key={index} className="italic text-slate-700">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[12px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

interface ChatInterfaceProps {
  expenseSummary: string;
}

export function ChatInterface({ expenseSummary }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "ai",
      content:
        "Halo! BonSync AI di sini.\n\n" +
        "Kamu bisa:\n" +
        "• Lapor pengeluaran (misal: bayar parkir 2 ribu)\n" +
        "• Minta evaluasi (misal: roasting pengeluaranku)\n\n" +
        "Ada yang bisa dibantu?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, startSend] = useTransition();
  const [savingExpense, startSaveExpense] = useTransition();
  const [lastPendingId, setLastPendingId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgId = useRef(1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isConfirmReply = (text: string) =>
    /^(ya|iya|yep|ok|sip|oke|yes|betul|bener|yoi|lanjut|catat)$/i.test(text.trim());

  const isCancelReply = (text: string) =>
    /^(tidak|nggak|ngga|ga|cancel|batal|gak|jangan|nope|no)$/i.test(text.trim());

  const sendMessage = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput("");

    const userMsg: ChatMessage = { id: msgId.current++, role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);

    // Cek apakah ini konfirmasi untuk pending expense
    const currentPending = lastPendingId !== null
      ? messages.find((m) => m.id === lastPendingId)?.pendingExpense
      : null;

    if (currentPending && isConfirmReply(msg)) {
      // User confirm → simpan
      setMessages((prev) =>
        prev.map((m) =>
          m.id === lastPendingId ? { ...m, confirmed: "yes" } : m,
        ),
      );
      setLastPendingId(null);

      startSaveExpense(async () => {
        const result = await saveChatExpense(currentPending.description, currentPending.amount);
        const aiMsg: ChatMessage = {
          id: msgId.current++,
          role: "ai",
          content: result.success
            ? `✅ ${result.message}`
            : `❌ Gagal nyimpen: ${result.message}`,
        };
        setMessages((prev) => [...prev, aiMsg]);
      });
      return;
    }

    if (currentPending && isCancelReply(msg)) {
      // User cancel
      setMessages((prev) =>
        prev.map((m) =>
          m.id === lastPendingId ? { ...m, confirmed: "no" } : m,
        ),
      );
      setLastPendingId(null);
      const aiMsg: ChatMessage = {
        id: msgId.current++,
        role: "ai",
        content: "Oke, dibatalin deh. Ada yang lain?",
      };
      setMessages((prev) => [...prev, aiMsg]);
      return;
    }

    // Normal message → proses AI
    startSend(async () => {
      const result = await processChatMessage(msg, expenseSummary);
      const aiMsg: ChatMessage = {
        id: msgId.current++,
        role: "ai",
        content: result.aiReply,
        pendingExpense: result.pendingExpense,
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (result.pendingExpense) {
        setLastPendingId(aiMsg.id);
      }
    });
  };

  return (
    <div className="flex flex-col h-full absolute inset-0 premium-card p-4 md:p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-5 pb-4 pr-1 custom-scrollbar min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "ai" && (
              <div className="mr-3 shrink-0 w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-slate-500" />
              </div>
            )}

            <div className={`max-w-[85%] flex flex-col gap-2`}>
              <div
                className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-slate-800 text-white"
                    : "bg-slate-50 border border-slate-100 text-slate-700"
                }`}
              >
                {parseMarkdown(msg.content)}
              </div>

              {/* Pending expense confirmation card */}
              {msg.pendingExpense && msg.confirmed === undefined && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-[13px] font-medium text-slate-700 space-y-3 shadow-sm">
                  <p className="font-bold text-slate-800 tracking-tight">Konfirmasi Pencatatan</p>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">{msg.pendingExpense.description}</span>
                    <span className="font-bold text-slate-900">{idr.format(msg.pendingExpense.amount)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => sendMessage("ya")}
                      disabled={savingExpense}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors shadow-sm active:scale-95"
                    >
                      {savingExpense ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5" />
                      )}
                      Catat ini
                    </button>
                    <button
                      type="button"
                      onClick={() => sendMessage("tidak")}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Confirmed state */}
              {msg.pendingExpense && msg.confirmed === "yes" && (
                <p className="text-[11px] text-emerald-600 font-bold px-1 tracking-wide">✅ Sedang dicatat...</p>
              )}
              {msg.pendingExpense && msg.confirmed === "no" && (
                <p className="text-[11px] text-slate-400 font-bold px-1 tracking-wide">✗ Batal dicatat</p>
              )}
            </div>
          </div>
        ))}

        {(sending || savingExpense) && (
          <div className="flex justify-start">
            <div className="mr-3 shrink-0 w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-slate-500" />
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
              <div className="flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="flex gap-2 overflow-x-auto pb-3 pt-2 hide-scrollbar mt-2 shrink-0">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => sendMessage(p)}
            disabled={sending}
            className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-100 transition-all disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="flex gap-3 pt-4 pb-1 shrink-0 border-t border-slate-100 bg-white">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ketik pesan..."
          disabled={sending || savingExpense}
          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 disabled:opacity-60 transition-all"
          id="chat-input"
        />
        <button
          type="button"
          onClick={() => sendMessage()}
          disabled={!input.trim() || sending || savingExpense}
          id="chat-send-btn"
          className="shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 active:scale-95 transition-all shadow-sm"
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5 ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
}
