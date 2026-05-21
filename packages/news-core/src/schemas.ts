import type { SourceMetadata } from "./source-metadata.js";
import type { NewsAgeBand } from "./news-age.js";
import type { SourceQualityTier } from "./source-trust-matrix.js";

export type EventCategory =
  | "flash"
  | "turkey"
  | "world"
  | "finance"
  | "official"
  | "disaster"
  | "geopolitics"
  | "politics"
  | "celebrity"
  | "local"
  | "social_signal";

export type VerificationState =
  | "unverified"
  | "corroborated"
  | "verified"
  | "official"
  | "suppressed";

export type EventDecision = "show" | "notify_candidate" | "suppress" | "review";

export type { SourceFetchMode, SourceMetadata, SourceRef, SourceType } from "./source-metadata.js";
export {
  SOURCE_TRUST_BY_TYPE,
  defaultVerificationForSourceType,
  resolveSourceTrustScore,
} from "./source-metadata.js";

export interface RawEventInput {
  id: string;
  title: string;
  summary: string;
  category: EventCategory;
  sourceNames: string[];
  sourceTrustScore: number;
  verificationState: VerificationState;
  importanceScore: number;
  verificationScore: number;
  locationRelevance: number;
  marketImpactScore: number;
  socialVelocityScore: number;
  noveltyScore: number;
  clickbaitPenalty: number;
  tabloidPenalty: number;
  localCrimePenalty: number;
  publishedAt: string;
  tags?: string[];
  locationLabel?: string;
  isLocalViolentCrime?: boolean;
  involvesPublicFigure?: boolean;
  isOfficialSource?: boolean;
  sourceMetadata?: SourceMetadata;
}

export interface EventClusterInfo {
  clusterId: string;
  fingerprint: string;
  topicKey: string;
  clusterSize: number;
  isClusterPrimary: boolean;
  duplicateReason?: string;
}

export type { NewsAgeBand } from "./news-age.js";
export type { SourceQualityTier } from "./source-trust-matrix.js";

export interface ProcessedEvent extends RawEventInput {
  finalScore: number;
  decision: EventDecision;
  reasonBullets: string[];
  newsAgeBand: NewsAgeBand;
  newsAgePenalty: number;
  sourceQualityTier: SourceQualityTier;
  isSocialOnly: boolean;
  suppressReason?: string;
  cluster?: EventClusterInfo;
}

export type SignalStatus = "tracking" | "corroborating" | "verified" | "debunked";

export interface SocialSignal {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  platforms: { name: string; postCount: number }[];
  velocityScore: number;
  status: SignalStatus;
  relatedEventIds: string[];
  detectedAt: string;
  verificationState: "unverified" | "corroborated";
}

export interface NotificationCandidate {
  event: ProcessedEvent;
  pushEligible: boolean;
  reasons: string[];
  suggestedTitle: string;
}
