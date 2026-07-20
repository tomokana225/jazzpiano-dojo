import { Check, X } from "lucide-react";

export type FeedbackKind = "correct" | "wrong" | null;

export function FeedbackBanner({ kind }: { kind: FeedbackKind }) {
  if (!kind) return <div className="h-9" />;
  const isCorrect = kind === "correct";
  return (
    <div
      className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${
        isCorrect ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"
      }`}
    >
      {isCorrect ? <Check className="h-4 w-4" strokeWidth={2.75} aria-hidden /> : <X className="h-4 w-4" strokeWidth={2.75} aria-hidden />}
      <span>{isCorrect ? "正解！" : "もう一度"}</span>
    </div>
  );
}
