export function ScoreHud({
  correct,
  total,
  streak,
  bestStreak,
}: {
  correct: number;
  total: number;
  streak: number;
  bestStreak: number;
}) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <Stat label="正解数" value={`${correct} / ${total}`} />
      <Stat label="正答率" value={`${accuracy}%`} />
      <Stat label="連続正解" value={`${streak}`} highlight={streak > 0} />
      <Stat label="ベスト連続" value={`${bestStreak}`} />
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-1.5 ${
        highlight ? "border-brass-400/50 bg-brass-400/10 text-brass-300" : "border-slate-800 bg-slate-900/60 text-slate-300"
      }`}
    >
      <span className="mr-1.5 text-slate-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
