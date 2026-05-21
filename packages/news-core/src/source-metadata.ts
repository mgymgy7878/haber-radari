/** Kaynak tipi — policy skorları için güven katmanı */
export type SourceType =
  | "official"
  | "editorial"
  | "market"
  | "social"
  | "factcheck"
  | "aggregator";

export type SourceFetchMode = "live" | "fallback" | "mock";

/** Tip bazlı varsayılan güven skoru (0–1) */
export const SOURCE_TRUST_BY_TYPE: Record<SourceType, number> = {
  official: 0.95,
  editorial: 0.82,
  market: 0.88,
  factcheck: 0.9,
  social: 0.35,
  aggregator: 0.75,
};

export interface SourceRef {
  id: string;
  name: string;
  type: SourceType;
  trustScore: number;
}

export interface SourceMetadata {
  connectorId: string;
  sourceType: SourceType;
  fetchMode: SourceFetchMode;
  refs: SourceRef[];
  externalUrl?: string;
  ingestedAt: string;
}

export function resolveSourceTrustScore(
  metadata: SourceMetadata,
  explicitScore?: number
): number {
  const fromRefs =
    metadata.refs.length > 0
      ? Math.max(...metadata.refs.map((r) => r.trustScore))
      : SOURCE_TRUST_BY_TYPE[metadata.sourceType];
  const base = explicitScore ?? fromRefs;
  return Math.max(0, Math.min(1, Number(base.toFixed(3))));
}

export function defaultVerificationForSourceType(
  type: SourceType
): "unverified" | "corroborated" | "verified" | "official" {
  if (type === "official") return "official";
  if (type === "editorial" || type === "aggregator") return "corroborated";
  if (type === "market" || type === "factcheck") return "verified";
  return "unverified";
}
