export type FeedbackKind = "correct" | "wrong" | null;

export function FeedbackBanner({ kind }: { kind: FeedbackKind }) {
  if (!kind) return <div className="h-9" />;
  const isCorrect = kind === "correct";
  return (
    <div
      className={`flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${
        isCorrect ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"
      }`}
    >
      <span>{isCorrect ? "🎉 正解！" : "❌ もう一度"}</span>
    </div>
  );
}
