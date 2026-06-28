export type SmartDigestStatus = 'DISABLED' | 'MOCKED' | 'CACHED' | 'GENERATED' | 'FAILED';

export type SmartDigestConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type SmartDigestModelProvider = 'mock' | 'disabled' | 'external';

/** Metadata-only source slice — tam metin alanı yok. */
export interface SmartDigestSourceInput {
  sourceName: string;
  title: string;
  shortDescription: string;
  originalUrl: string;
  publishedAt: number;
}

/** LLM/digest servisine giden normalize edilmiş girdi. */
export interface SmartDigestInput {
  clusterId: string;
  title: string;
  shortDescription: string;
  category: string;
  publishDecision: string;
  publishReason: string | null;
  sourceCount: number;
  sourceNames: string[];
  publishedAt: number;
  sources: SmartDigestSourceInput[];
  importance?: string;
  evidenceStatus?: string;
  contentType?: string;
  topicQuality?: string;
}

export interface SmartDigest {
  status: SmartDigestStatus;
  summary: string | null;
  keyPoints: string[];
  whyItMatters: string | null;
  confidence: SmartDigestConfidence;
  sourcePolicy: 'METADATA_ONLY';
  modelProvider: SmartDigestModelProvider;
  cacheKey: string;
  generatedAt: string | null;
  errorCode?: string;
}

export interface SmartDigestCacheEntry {
  cacheKey: string;
  digest: Omit<SmartDigest, 'status' | 'cacheKey'>;
  createdAt: string;
  expiresAt: string;
}

/** Internal service counters (debug). */
export interface SmartDigestStats {
  requested: number;
  cacheHits: number;
  cacheMisses: number;
  disabled: number;
  mocked: number;
  cached: number;
  generated: number;
  failed: number;
  budgetDenied: number;
}

/** Smart Feed response stats (v0.6.1). */
export interface SmartDigestFeedStats {
  enabled: boolean;
  provider: 'disabled' | 'mock' | 'external';
  eligibleCount: number;
  generatedCount: number;
  cachedCount: number;
  failedCount: number;
  budgetDeniedCount: number;
  externalCallCount: number;
}

export interface SmartDigestProviderResult {
  summary: string;
  keyPoints: string[];
  whyItMatters: string;
  confidence: SmartDigestConfidence;
}

export interface BudgetDayStats {
  date: string;
  externalCalls: number;
  cacheHits: number;
  failures: number;
  budgetDenied: number;
}

export interface MockDigestPayload {
  summary: string;
  keyPoints: string[];
  whyItMatters: string;
  confidence: SmartDigestConfidence;
}

/** Tam metin / scrape alanları — digest pipeline'a asla girmez. */
export const FORBIDDEN_DIGEST_FIELDS = [
  'fullText',
  'body',
  'contentHtml',
  'articleText',
  'htmlContent',
  'rawContent',
  'scrapedText',
  'rawHtml',
] as const;

export interface ProviderLogEvent {
  cacheKey: string;
  provider: string;
  status: string;
  elapsedMs?: number;
  errorCode?: string;
}
