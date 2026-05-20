"use client";

interface SurvivalScoreProps {
  score: number;
}

export function SurvivalScore({ score }: SurvivalScoreProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 34; // smaller radius
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const danger = clamped < 30;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-2 relative">
      <div className="relative">
        <svg width="84" height="84" viewBox="0 0 84 84" className="shrink-0 -rotate-90">
          <circle cx="42" cy="42" r={radius} stroke="currentColor" className="text-slate-100" strokeWidth="10" fill="none" />
          <circle
            cx="42"
            cy="42"
            r={radius}
            stroke="currentColor"
            className={danger ? "text-rose-500" : "text-emerald-500"}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
           <span className="text-[22px] font-extrabold text-slate-900 tracking-tight">
             {Math.round(clamped)}
           </span>
        </div>
      </div>
      <p className={`text-[10px] font-bold uppercase tracking-widest text-center mt-1 ${danger ? "text-rose-600" : "text-slate-400"}`}>
        Survival Score
      </p>
    </div>
  );
}
