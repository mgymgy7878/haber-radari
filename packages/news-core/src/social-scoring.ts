import type { RawEventInput } from "./schemas.js";
import { isSocialOnlySource } from "./source-trust-matrix.js";

export interface SocialScoreFields {
  socialVelocityScore: number;
  socialConfidence: number;
  isSocialOnly: boolean;
  verifiedSourceMatch: boolean;
}

const EDITORIAL_SOURCE_PATTERN =
  /trt|aa\b|reuters|bbc|afad|resmi|tcmb|kap|editorial|haber/i;

/** Sosyal kayıt + editoryal/resmî kaynak adı birlikte mi */
export function hasVerifiedSourceMatch(
  sourceNames: string[],
  isVerifiedSource: boolean
): boolean {
  if (isVerifiedSource) return true;
  return sourceNames.some((n) => EDITORIAL_SOURCE_PATTERN.test(n));
}

export function scoreSocialSignal(input: {
  confidence: number;
  engagement?: number;
  isVerifiedSource: boolean;
  sourceNames?: string[];
  hasEditorialCorroboration?: boolean;
}): SocialScoreFields {
  const engagementBoost = Math.min(0.25, (input.engagement ?? 0) / 1000);
  const socialVelocityScore = Math.min(
    1,
    Number((input.confidence * 0.7 + engagementBoost).toFixed(3))
  );
  const socialConfidence = Number(input.confidence.toFixed(3));
  const verifiedSourceMatch =
    input.hasEditorialCorroboration ??
    hasVerifiedSourceMatch(input.sourceNames ?? [], input.isVerifiedSource);

  const isSocialOnly = !verifiedSourceMatch;

  return {
    socialVelocityScore,
    socialConfidence,
    isSocialOnly,
    verifiedSourceMatch,
  };
}

/** Raw olaya sosyal skor alanlarını uygular */
export function applySocialScoresToRaw(
  raw: RawEventInput,
  scores: SocialScoreFields
): RawEventInput {
  return {
    ...raw,
    socialVelocityScore: Math.max(raw.socialVelocityScore, scores.socialVelocityScore),
    sourceTrustScore: scores.verifiedSourceMatch
      ? Math.max(raw.sourceTrustScore, 0.55)
      : raw.sourceTrustScore,
  };
}

/** Policy sonrası: sosyal-only asla bildirim adayı olamaz */
export function assertSocialOnlyNotNotifyCandidate(
  event: RawEventInput & { decision?: string; isSocialOnly?: boolean }
): boolean {
  if (event.decision !== "notify_candidate") return true;
  return !isSocialOnlySource(event);
}

export function socialOnlyBlockReason(): string {
  return "Bildirim yok: yalnızca sosyal sinyal; bağımsız haber teyidi gerekir.";
}
