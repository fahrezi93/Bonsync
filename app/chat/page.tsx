import { ChatInterface } from "@/components/chat-interface";
import { getExpenseSummaryForChat } from "@/actions/chat-actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat AI — BonSync",
  description:
    "Catat pengeluaran lewat chat atau minta AI roasting pola belanjamu bulan ini.",
};

export default async function ChatPage() {
  const expenseSummary = await getExpenseSummaryForChat();

  return (
    <div className="mx-auto max-w-[600px] w-full px-4 pt-4 md:pt-6 pb-4 flex flex-col h-[calc(100dvh-160px)] md:h-[calc(100dvh-100px)] min-h-0 relative">
      <div className="mb-4 flex items-center justify-between shrink-0 animate-fade-in-up">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Chat AI</h1>
          <p className="text-[13px] font-medium text-slate-500 mt-0.5">
            Lapor pengeluaran atau minta evaluasi, bebas!
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden relative">
         <ChatInterface expenseSummary={expenseSummary} />
      </div>
    </div>
  );
}
