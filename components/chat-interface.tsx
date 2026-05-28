"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Send, Loader2, Sparkles, CheckCircle, XCircle, Trash2, Mic, MicOff } from "lucide-react";
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

const STORAGE_KEY = "bonsync_chat_history";
const MAX_STORED_MESSAGES = 50;

const INITIAL_MESSAGE: ChatMessage = {
  id: 0,
  role: "ai",
  content:
    "Halo! BonSync AI di sini.\n\n" +
    "Kamu bisa:\n" +
    "• Lapor pengeluaran (misal: bayar parkir 2 ribu)\n" +
    "• Minta evaluasi (misal: roasting pengeluaranku)\n\n" +
    "Ada yang bisa dibantu?",
};

function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [INITIAL_MESSAGE];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [INITIAL_MESSAGE];
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [INITIAL_MESSAGE];
    // Reset semua pending expense yang belum dikonfirmasi (karena session baru)
    return parsed.map((m) =>
      m.pendingExpense && m.confirmed === undefined
        ? { ...m, confirmed: "no" as const }
        : m,
    );
  } catch {
    return [INITIAL_MESSAGE];
  }
}

function saveMessages(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    // Simpan hanya N pesan terakhir agar localStorage tidak penuh
    const toStore = messages.slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // localStorage penuh atau disabled — abaikan
  }
}

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

/* ─── Web Speech API typings (minimal) ─── */
interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function ChatInterface({ expenseSummary }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState("");
  const [sending, startSend] = useTransition();
  const [savingExpense, startSaveExpense] = useTransition();
  const [lastPendingId, setLastPendingId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgId = useRef(Math.max(...messages.map((m) => m.id), 0) + 1);

  /* ─── Voice Input (Web Speech API) ─── */
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const voiceSupportTimer = setTimeout(() => {
      setVoiceSupported(getSpeechRecognitionCtor() !== null);
    }, 0);
    const recognition = recognitionRef.current;
    return () => {
      clearTimeout(voiceSupportTimer);
      // Cleanup recognition saat component unmount
      try {
        recognition?.abort();
      } catch {
        // ignore
      }
    };
  }, []);

  function startListening() {
    setVoiceError(null);
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setVoiceError("Browser kamu belum support voice input.");
      return;
    }
    try {
      const recognition = new Ctor();
      recognition.lang = "id-ID";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const first = event.results?.[0]?.[0];
        const transcript = first?.transcript?.trim() ?? "";
        if (transcript) {
          // Append ke input agar user masih bisa edit sebelum kirim
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onerror = (e) => {
        const reason = e.error;
        const niceMessage =
          reason === "no-speech"
            ? "Nggak kedengeran suaramu, coba lagi ya."
            : reason === "not-allowed" || reason === "service-not-allowed"
              ? "Akses mikrofon ditolak. Izinkan di pengaturan browser."
              : reason === "audio-capture"
                ? "Mikrofon tidak terdeteksi."
                : `Voice error: ${reason}`;
        setVoiceError(niceMessage);
        setListening(false);
      };
      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal memulai voice input.";
      setVoiceError(msg);
      setListening(false);
    }
  }

  function stopListening() {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setListening(false);
  }

  function toggleListening() {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  }

  // Simpan ke localStorage setiap kali messages berubah
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const clearHistory = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    setMessages([INITIAL_MESSAGE]);
    setLastPendingId(null);
    msgId.current = 1;
  };

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
      const historyToPass = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const result = await processChatMessage(msg, expenseSummary, historyToPass);
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
      {/* Header dengan tombol clear */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <p className="text-xs font-semibold text-slate-400">
          {messages.length > 1 ? `${messages.length - 1} pesan` : "Mulai percakapan"}
        </p>
        {messages.length > 1 && (
          <button
            type="button"
            onClick={clearHistory}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-all"
            title="Hapus riwayat chat"
          >
            <Trash2 className="h-3 w-3" />
            Hapus Riwayat
          </button>
        )}
      </div>

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

      {/* Voice error toast */}
      {voiceError && (
        <div className="mb-2 mx-1 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[11px] font-bold text-rose-700 animate-fade-in-up shrink-0">
          ⚠️ {voiceError}
        </div>
      )}

      {/* Listening indicator */}
      {listening && (
        <div className="mb-2 mx-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[11px] font-bold text-emerald-700 flex items-center gap-2 animate-fade-in-up shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Mendengarkan... ngomong aja, contoh: &ldquo;bayar parkir 2 ribu&rdquo;
        </div>
      )}

      {/* Input bar */}
      <div className="flex gap-2 pt-4 pb-1 shrink-0 border-t border-slate-100 bg-white">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder={listening ? "Mendengarkan suaramu..." : "Ketik atau tap mic untuk bicara..."}
          disabled={sending || savingExpense}
          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 disabled:opacity-60 transition-all min-w-0"
          id="chat-input"
        />

        {voiceSupported && (
          <button
            type="button"
            onClick={toggleListening}
            disabled={sending || savingExpense}
            id="chat-voice-btn"
            aria-label={listening ? "Stop merekam" : "Mulai voice input"}
            className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-95 shadow-sm ${
              listening
                ? "bg-rose-500 text-white hover:bg-rose-600 ring-4 ring-rose-100"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        )}

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
