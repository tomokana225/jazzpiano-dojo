import { Link } from "react-router";
import type { Route } from "./+types/home";
import { useProgressContext } from "~/lib/context/ProgressProvider";
import { useMidiContext } from "~/lib/context/MidiProvider";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Jazz Piano Dojo - ホーム" },
    { name: "description", content: "MIDIキーボードで学ぶジャズピアノ練習アプリのホーム画面" },
  ];
}

const MODES = [
  {
    to: "/chords",
    icon: "🎵",
    title: "コード",
    description: "maj7・m7・7・m7b5・dim7 など全12キーのコードを瞬時に押さえる反射神経を鍛える。",
  },
  {
    to: "/scales",
    icon: "🪜",
    title: "スケール",
    description: "モードスケール・ビバップスケール・ペンタトニックを順番に演奏して耳と指に覚え込ませる。",
  },
  {
    to: "/voicings",
    icon: "🎼",
    title: "ボイシング",
    description: "シェル・ロートレスA/B・ドロップ2など実戦的な左手/両手ボイシングを正確に再現する。",
  },
  {
    to: "/ii-v-i",
    icon: "🔁",
    title: "II-V-Iリック",
    description: "定番のii-V-Iフレーズをテンポに合わせてタイミングよく演奏するリズムゲーム。",
  },
  {
    to: "/standards",
    icon: "🎷",
    title: "スタンダード バッキング",
    description: "ベース&ドラムの伴奏に合わせてコードチェンジを追いかけながらコンピングする実践練習。",
  },
] as const;

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
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8">
        <p className="text-sm font-medium text-amber-300">Jazz Piano Dojo</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          MIDIキーボードを繋いで、ジャズピアノの語彙をゲーム感覚で身につけよう
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          コード・スケール・ii-V-Iリック・ボイシング・スタンダードのバッキングを、実際に鍵盤を弾きながら判定してくれる練習アプリです。
          MIDIキーボードが無い場合は各画面の鍵盤をクリック/タップしても練習できます。
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
            <div className="text-xl font-bold text-amber-300">Lv.{level}</div>
            <div>
              <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: `${(levelProgress.current / levelProgress.needed) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {levelProgress.current} / {levelProgress.needed} XP
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm">
            <span className="text-slate-500">連続練習日数 </span>
            <span className="font-semibold text-amber-300">🔥 {state.streakDays}日</span>
          </div>
          <MidiHint status={status} deviceCount={devices.length} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-200">練習モード</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modeStats.map((mode) => (
            <Link
              key={mode.to}
              to={mode.to}
              className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition-colors hover:border-amber-400/50 hover:bg-slate-900"
            >
              <div>
                <div className="mb-2 text-2xl">{mode.icon}</div>
                <h3 className="text-base font-semibold text-slate-100 group-hover:text-amber-300">{mode.title}</h3>
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

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-400">
        <h2 className="mb-2 text-sm font-semibold text-slate-200">MIDIキーボードの接続方法</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>MIDIキーボードをUSBケーブルでパソコンに接続する(クラスコンプライアント機種はドライバ不要)。</li>
          <li>Chrome / Edge などWeb MIDI対応ブラウザでこのページを開く。</li>
          <li>ブラウザからMIDIアクセスの許可を求められたら「許可」を選ぶ。</li>
          <li>ヘッダーの「MIDI接続中」表示が出れば準備完了。キーボードが無い場合は画面上の鍵盤をクリックしても練習できます。</li>
        </ol>
      </section>
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
    <div className="rounded-xl border border-amber-700/50 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">
      MIDIキーボード未接続 (画面上の鍵盤でも練習できます)
    </div>
  );
}
