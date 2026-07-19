// Chord substitution / reharmonization logic: given a chord progression and
// a position within it, compute what a specific substitution technique
// would put there (or null when that technique doesn't apply at that
// position). Operates on the same StandardChord[] shape STANDARDS/custom
// progressions already use, so it works over either source unmodified.

import type { ChordQualityId } from "./chords";
import { pc, type PitchClass } from "./notes";
import type { StandardChord } from "./standards";

export type SubstitutionKind = "tritoneSub" | "secondaryDominant" | "backdoorDominant" | "diminishedPassing";

export interface SubstitutionResult {
  root: PitchClass;
  quality: ChordQualityId;
  /** Whether the substitute chord replaces progression[index], or is inserted just before progression[index+1]. */
  relation: "replaces" | "precedes";
  explanationJa: string;
}

export interface SubstitutionKindDef {
  id: SubstitutionKind;
  nameJa: string;
  descriptionJa: string;
}

export const SUBSTITUTION_KINDS: Record<SubstitutionKind, SubstitutionKindDef> = {
  tritoneSub: {
    id: "tritoneSub",
    nameJa: "トライトーン代理",
    descriptionJa: "ドミナント7thを、ルートが増4度(トライトーン)離れたドミナント7thに置き換える。",
  },
  secondaryDominant: {
    id: "secondaryDominant",
    nameJa: "セカンダリードミナント",
    descriptionJa: "次のコードの5度上をルートとするドミナント7thを、次のコードの手前に挿入する。",
  },
  backdoorDominant: {
    id: "backdoorDominant",
    nameJa: "裏コード(バックドア・ドミナント)",
    descriptionJa: "次のメジャー系コードへ、その短7度上(bVII)のドミナント7thから解決する。",
  },
  diminishedPassing: {
    id: "diminishedPassing",
    nameJa: "ディミニッシュ・パッシングコード",
    descriptionJa: "全音離れた2つのコードの間に、低い方の半音上をルートとするdim7を挿入してつなぐ。",
  },
};

export const SUBSTITUTION_KIND_ORDER: SubstitutionKind[] = [
  "tritoneSub",
  "secondaryDominant",
  "backdoorDominant",
  "diminishedPassing",
];

const DOMINANT_LIKE: ChordQualityId[] = ["dom7", "sus7"];
const MAJOR_LIKE: ChordQualityId[] = ["maj7", "maj6", "maj"];

function isDominantLike(quality: ChordQualityId): boolean {
  return DOMINANT_LIKE.includes(quality);
}

function isMajorLike(quality: ChordQualityId): boolean {
  return MAJOR_LIKE.includes(quality);
}

export function computeSubstitution(
  progression: StandardChord[],
  index: number,
  kind: SubstitutionKind,
): SubstitutionResult | null {
  const current = progression[index];
  if (!current) return null;
  const next = progression[index + 1];

  if (kind === "tritoneSub") {
    if (!isDominantLike(current.quality)) return null;
    return {
      root: pc(current.root + 6),
      quality: "dom7",
      relation: "replaces",
      explanationJa: `${current.quality}のルートから増4度(6半音)離れたドミナント7th。ガイドトーン(3rd/7th)が元のコードと入れ替わるだけで機能が保たれる。`,
    };
  }

  if (kind === "backdoorDominant") {
    if (!next || !isMajorLike(next.quality)) return null;
    return {
      root: pc(next.root + 10),
      quality: "dom7",
      relation: "replaces",
      explanationJa: "次のコードの短7度上(bVII)をルートとするドミナント7th。半音下降で解決する裏コードならではの滑らかな進行を作る。",
    };
  }

  if (kind === "diminishedPassing") {
    if (!next) return null;
    const up = pc(next.root - current.root) === 2; // current -> next is a whole step up
    const down = pc(current.root - next.root) === 2; // current -> next is a whole step down
    if (!up && !down) return null;
    const lowerRoot = up ? current.root : next.root;
    return {
      root: pc(lowerRoot + 1),
      quality: "dim7",
      relation: "precedes",
      explanationJa: "全音離れた2つのコードの間を、低い方の半音上に置いたdim7で半音階的につなぐ。",
    };
  }

  if (kind === "secondaryDominant") {
    if (!next) return null;
    if (isDominantLike(next.quality)) return null; // already dominant, nothing to tonicize
    return {
      root: pc(next.root + 7),
      quality: "dom7",
      relation: "precedes",
      explanationJa: "次のコードを一時的なトニックとみなし、その完全5度上をルートとするV7を手前に挿入して強く導く。",
    };
  }

  return null;
}
