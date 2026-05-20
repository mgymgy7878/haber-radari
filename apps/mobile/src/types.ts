export type VerificationState =
  | "unverified"
  | "corroborated"
  | "verified"
  | "official"
  | "suppressed";

export type EventDecision = "show" | "notify_candidate" | "suppress" | "review";

export interface ProcessedEvent {
  id: string;
  title: string;
  summary: string;
  category: string;
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
  finalScore: number;
  decision: EventDecision;
  reasonBullets: string[];
  publishedAt: string;
  locationLabel?: string;
  tags?: string[];
}

export interface SocialSignal {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  platforms: { name: string; postCount: number }[];
  velocityScore: number;
  status: string;
  relatedEventIds: string[];
  detectedAt: string;
  verificationState: string;
}
