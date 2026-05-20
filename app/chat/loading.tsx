import { Bot } from "lucide-react";

export default function ChatLoading() {
  return (
    <div className="mx-auto max-w-md px-4 py-4 animate-pulse">
      <div className="mb-4 space-y-2">
        <div className="h-5 w-32 bg-slate-200 rounded-full" />
        <div className="h-3 w-56 bg-slate-200 rounded-full" />
      </div>
      <div className="flex flex-col h-[calc(100vh-9rem)] max-h-[700px]">
        <div className="flex-1 space-y-4 pb-2">
          {/* AI welcome bubble skeleton */}
          <div className="flex justify-start gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-1">
              <Bot className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 w-64 h-24" />
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <div className="flex-1 h-11 bg-slate-100 rounded-2xl" />
          <div className="w-11 h-11 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
