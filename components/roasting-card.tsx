"use client";

import { useEffect, useState } from "react";
import { Bot } from "lucide-react";

interface RoastingCardProps {
  advice: string;
}

function parseMarkdown(text: string): React.ReactNode {
  if (!text) return "";
  
  const regex = /(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return (
        <strong key={index} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return (
        <em key={index} className="italic font-medium text-slate-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-rose-600 font-mono text-[12px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function RoastingCard({ advice }: RoastingCardProps) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(advice.substring(0, i + 1));
      i++;
      if (i >= advice.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [advice]);

  return (
    <div className="bento-card relative overflow-hidden bg-gradient-to-br from-emerald-50/80 to-white shadow-[0_8px_32px_rgba(0,0,0,0.05)] border-emerald-100">
      {/* Background glow effect */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="mb-4 inline-flex items-center gap-3 text-[13px] font-bold tracking-tight text-slate-800">
        <span className="p-2 bg-emerald-100/50 rounded-[12px]">
           <Bot className="h-4 w-4 text-emerald-600" />
        </span>
        Insight & Roasting AI
      </div>
      
      <div className="rounded-2xl border border-emerald-100 bg-white/80 shadow-sm backdrop-blur-sm p-5 text-[13px] font-medium leading-relaxed text-slate-700 min-h-[100px] whitespace-pre-line">
        {parseMarkdown(displayedText)}
        <span className="animate-pulse text-emerald-500 font-bold ml-0.5">_</span>
      </div>
    </div>
  );
}
