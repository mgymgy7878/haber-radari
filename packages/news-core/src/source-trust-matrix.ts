import type { SourceType } from "./source-metadata.js";
import type { RawEventInput } from "./schemas.js";

/** Güven sıralaması: yüksek → düşük */
export type SourceQualityTier =
  | "official"
  | "market"
  | "editorial"
  | "aggregator"
  | "social";

const TIER_TRUST: Record<SourceQualityTier, number> = {
  official: 0.95,
  market: 0.88,
  editorial: 0.82,
  aggregator: 0.75,
  social: 0.35,
};

const TYPE_TO_TIER: Record<SourceType, SourceQualityTier> = {
  official: "official",
  market: "market",
  editorial: "editorial",
  factcheck: "editorial",
  aggregator: "aggregator",
  social: "social",
};

export function getSourceQualityTier(event: RawEventInput): SourceQualityTier {
  if (
    event.isOfficialSource ||
    event.verificationState === "official" ||
    event.category === "official"
  ) {
    return "official";
  }

  const metaType = event.sourceMetadata?.sourceType;
  if (metaType) return TYPE_TO_TIER[metaType];

  if (event.category === "social_signal") return "social";
  if (event.category === "finance") return "market";
  const names = event.sourceNames.join(" ");
  if (/tcmb|kap|fed|borsa/i.test(names)) return "market";
  if (/afad|reuters|bbc|aa\b|trt/i.test(names)) return "editorial";

  return "editorial";
}

export function trustScoreFromTier(tier: SourceQualityTier): number {
  return TIER_TRUST[tier];
}

/** Yalnızca sosyal / doğrulanmamış erken sinyal */
export function isSocialOnlySource(event: RawEventInput): boolean {
  const tier = getSourceQualityTier(event);
  if (tier === "social") return true;
  if (event.category === "social_signal") return true;
  if (
    event.sourceMetadata?.sourceType === "social" &&
    event.verificationState === "unverified"
  ) {
    return true;
  }
  return (
    event.socialVelocityScore >= 0.55 &&
    event.verificationScore < 0.45 &&
    event.sourceTrustScore < 0.5 &&
    !event.isOfficialSource
  );
}

export function applySourceTrustMatrix(event: RawEventInput): RawEventInput {
  const tier = getSourceQualityTier(event);
  const matrixTrust = trustScoreFromTier(tier);
  const blended = Math.max(
    event.sourceTrustScore,
    matrixTrust * 0.7 + event.sourceTrustScore * 0.3
  );
  return {
    ...event,
    sourceTrustScore: Number(Math.min(1, blended).toFixed(3)),
  };
}
