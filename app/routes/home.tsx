import { Link } from "react-router";
import {
  BookOpen,
  Drum,
  Flame,
  Layers,
  Repeat,
  Search,
  Shuffle,
  SlidersHorizontal,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "./+types/home";
import { Card } from "~/components/ui/Card";
import { useProgressContext } from "~/lib/context/ProgressProvider";
import { useMidiContext } from "~/lib/context/MidiProvider";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Jazz Piano Dojo - ホーム" },
    { name: "description", content: "MIDIキーボードで学ぶジャズピアノ練習アプリのホーム画面" },
  ];
}

const MODES: { to: string; icon: LucideIcon; title: string; description: string }[] = [
  {
    to: "/chords",
    icon: Layers,
    title: "コード",
    description: "maj7・m7・7・m7b5・dim7 など全12キーのコードを瞬時に押さえる反射神経を鍛える。",
  },
  {
    to: "/scales",
    icon: TrendingUp,
    title: "スケール",
    description: "モードスケール・ビバップスケール・ペンタトニックを順番に演奏して耳と指に覚え込ませる。",
  },
  {
    to: "/voicings",
    icon: SlidersHorizontal,
    title: "ボイシング",
    description: "シェル・ルートレスA/B・ドロップ2など実戦的な左手/両手ボイシングを正確に再現する。",
  },
  {
    to: "/ii-v-i",
    icon: Repeat,
    title: "II-V-Iリック",
    description: "定番のii-V-Iフレーズをテンポに合わせてタイミングよく演奏するリズムゲーム。",
  },
  {
    to: "/chromatic-approach",
    icon: Target,
    title: "クロマチックアプローチ",
    description: "半音アプローチやエンクロージャーなど、コードトーンへ寄り道して着地するアドリブ語法を練習する。",
  },
  {
    to: "/comping",
    icon: Drum,
    title: "コンピング・リズム",
    description: "チャールストン等の定番リズムで、コードトーンを正しいタイミングで弾く「いつ弾くか」の練習。",
  },
  {
    to: "/substitutions",
    icon: Shuffle,
    title: "代理コード",
    description: "トライトーン代理・セカンダリードミナント・裏コード・ディミニッシュパッシングを進行の文脈で見つけて弾く。",
  },
  {
    to: "/standards",
    icon: BookOpen,
    title: "スタンダード バッキング",
    description: "ベース&ドラムの伴奏に合わせてコードチェンジを追いかけながらコンピングする実践練習。",
  },
  {
    to: "/identify",
    icon: Search,
    title: "逆引き",
    description: "自分でコードやスケールを弾いて、それが何なのかアプリに当ててもらう耳トレ&確認ツール。",
  },
];

export default function Home() {
  const { state, level, levelProgress } = useProgressContext();
  const { status, devices } = useMidiContext();

  const modeStats = MODES.map((m) => {
    const key = m.to.replace("/", "");
    const bucket = state.roundsByMode[key];
    const accuracy = bucket && bucket.total > 0 ? Math.round((bucket.correct / bucket.total) * 100) : null;
    return { ...m, accuracy, total: bucket?.total ?? 0 };
  });

  return (
    <div className="space-y-10">
      <Card className="overflow-hidden p-6 sm:p-8">
        <p className="text-sm font-semibold tracking-wide text-brass-300">Jazz Piano Dojo</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
          MIDIキーボードを繋いで、ジャズピアノの語彙をゲーム感覚で身につけよう
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          コード・スケール・ii-V-Iリック・ボイシング・スタンダードのバッキングを、実際に鍵盤を弾きながら判定してくれる練習アプリです。
          MIDIキーボードが無い場合は各画面の鍵盤をクリック/タップしても練習できます。
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
            <div className="text-xl font-bold text-brass-300">Lv.{level}</div>
            <div>
              <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brass-400 to-brass-300"
                  style={{ width: `${(levelProgress.current / levelProgress.needed) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {levelProgress.current} / {levelProgress.needed} XP
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm">
            <span className="text-slate-500">連続練習日数</span>
            <span className="flex items-center gap-1 font-semibold text-orange-400">
              <Flame className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              {state.streakDays}日
            </span>
          </div>
          <MidiHint status={status} deviceCount={devices.length} />
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight text-slate-200">練習モード</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modeStats.map((mode) => (
            <Link
              key={mode.to}
              to={mode.to}
              className="group flex flex-col justify-between rounded-xl border border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-900/30 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] transition-colors hover:border-brass-400/40 hover:from-slate-900/80 hover:to-slate-900/50"
            >
              <div>
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/80 text-brass-300 transition-colors group-hover:bg-brass-400/15">
                  <mode.icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </div>
                <h3 className="text-base font-semibold text-slate-100 group-hover:text-brass-300">{mode.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{mode.description}</p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>{mode.total > 0 ? `プレイ回数 ${mode.total}` : "未プレイ"}</span>
                {mode.accuracy !== null && <span className="font-semibold text-emerald-400">正答率 {mode.accuracy}%</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Card className="p-5 text-sm text-slate-400">
        <h2 className="mb-2 text-sm font-semibold text-slate-200">MIDIキーボードの接続方法</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>MIDIキーボードをUSBケーブルでパソコンに接続する(クラスコンプライアント機種はドライバ不要)。</li>
          <li>Chrome / Edge などWeb MIDI対応ブラウザでこのページを開く。</li>
          <li>ブラウザからMIDIアクセスの許可を求められたら「許可」を選ぶ。</li>
          <li>ヘッダーの「MIDI接続中」表示が出れば準備完了。キーボードが無い場合は画面上の鍵盤をクリックしても練習できます。</li>
        </ol>
      </Card>
    </div>
  );
}

function MidiHint({ status, deviceCount }: { status: string; deviceCount: number }) {
  if (status === "ready") {
    return (
      <div className="rounded-xl border border-emerald-700/50 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
        MIDIキーボード接続済み ({deviceCount}台)
      </div>
    );
  }
  if (status === "unsupported") {
    return (
      <div className="rounded-xl border border-red-700/50 bg-red-400/10 px-4 py-3 text-sm text-red-300">
        このブラウザはWeb MIDIに対応していません。Chrome / Edgeでお試しください。
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-sky-700/40 bg-sky-400/10 px-4 py-3 text-sm text-sky-300">
      MIDIキーボード未接続 (画面上の鍵盤でも練習できます)
    </div>
  );
}
