export enum EmotionalTone {
  POSITIVE = 'POSITIVE',
  NEUTRAL = 'NEUTRAL',
  NEGATIVE = 'NEGATIVE',
  TRAGIC = 'TRAGIC',
  INSPIRING = 'INSPIRING'
}

export enum VisibilityRecommendation {
  VISIBLE = 'VISIBLE',
  SUPPRESSED = 'SUPPRESSED',
  BOOSTED = 'BOOSTED',
  NEEDS_REVIEW = 'NEEDS_REVIEW'
}

export interface AiReaderSummary {
  articleId: string;
  sourceUrl: string;
  sourceName: string;
  shortAiSummary: string;
  detailedAiSummary: string;
  whatHappened: string;
  whyItMatters: string;
  keyActors: string[];
  location: string | null;
  timeline: string[];
  publicInterestReason: string | null;
  emotionalTone: EmotionalTone;
  visibilityRecommendation: VisibilityRecommendation;
  confidenceScore: number; // 0.0 to 1.0
  sourceAttribution: string;
  generatedAt: number; // timestamp
  expiresAt: number; // timestamp
}
