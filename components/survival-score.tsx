"use client";

interface SurvivalScoreProps {
  score: number;
}

export function SurvivalScore({ score }: SurvivalScoreProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const danger = clamped < 30;
  const warning = clamped < 60 && clamped >= 30;

  // Select gradient id based on health state
  const gradientId = danger ? "roseGrad" : warning ? "amberGrad" : "emeraldGrad";

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-3.5 relative">
      <div className={`relative flex items-center justify-center w-24 h-24 rounded-full bg-white border border-slate-100 shadow-sm transition-all duration-300`}>
        <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0 -rotate-90">
          <defs>
            <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
            <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {/* Underlay track */}
          <circle 
            cx="44" 
            cy="44" 
            r={radius} 
            stroke="#f1f5f9" 
            strokeWidth="8" 
            fill="none" 
          />

          {/* Glowing blur backing (glow effect behind active stroke) */}
          <circle
            cx="44"
            cy="44"
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            className="opacity-20 blur-[1px]"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />

          {/* Active foreground stroke */}
          <circle
            cx="44"
            cy="44"
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Centered score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
           <span className="text-[24px] font-black text-slate-800 tracking-tight leading-none">
             {Math.round(clamped)}
           </span>
           <span className="text-[10px] font-medium text-slate-400 mt-0.5 tracking-wider">hp</span>
        </div>
      </div>
      <p className={`text-[11px] font-bold text-center ${danger ? "text-rose-600 animate-pulse" : warning ? "text-amber-600" : "text-emerald-700"}`}>
        Survival Score
      </p>
    </div>
  );
}
