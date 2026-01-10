"use client"

export function ScoreRing({ score }: { score: number }) {
  // Color logic: Green if > 80, Yellow if > 50, Red if low
  const getColor = (s: number) => {
    if (s >= 80) return "text-emerald-500";
    if (s >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const circumference = 2 * Math.PI * 40; // Radius 40
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center h-48 w-48">
      {/* Background Circle */}
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx="96"
          cy="96"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-slate-100"
        />
        {/* Progress Circle */}
        <circle
          cx="96"
          cy="96"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${getColor(score)} transition-all duration-1000 ease-out`}
        />
      </svg>
      {/* Center Text */}
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-bold ${getColor(score)}`}>{Math.round(score)}%</span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Health</span>
      </div>
    </div>
  );
}
