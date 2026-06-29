/** Source Registry SSOT v0 — tip sözleşmesi (pre-implementation; production ingest'e bağlı değil). */

export type LegalMode =
  | 'DISABLED'
  | 'NEEDS_REVIEW'
  | 'TITLE_LINK_ONLY'
  | 'RSS_METADATA_ONLY'
  | 'LICENSED';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export type LicenseStatus = 'none' | 'pending' | 'active' | 'expired';

export type SourceType =
  | 'AGENCY'
  | 'COMMERCIAL_MEDIA'
  | 'PUBLIC_BROADCASTER'
  | 'OFFICIAL'
  | 'WIRE'
  | 'news_media'
  | 'news_agency'
  | 'official_institution'
  | 'regulator'
  | 'market_data'
  | 'sports_data'
  | 'weather_data'
  | 'municipality'
  | 'event_source';

/** Haber feed dışı modül türleri (pre-implementation; runtime bağlı değil). */
export type ModuleType =
  | 'news_feed'
  | 'market_ticker'
  | 'sports_widget'
  | 'weather_widget'
  | 'notification_rule';

export type FeedReplacementPolicy =
  | 'oldest_first'
  | 'lowest_signal_first'
  | 'category_quota_first';

/** Feed retention policy — docs/spec referansı (henüz runtime bağlı değil). */
export interface FeedRetentionPolicy {
  feedTtlHours: number;
  maxItemsPerCategory: number;
  maxTotalItems: number;
  criticalTtlHours?: number;
  staleAfterMinutes?: number;
  dedupeWindowHours?: number;
  replacementPolicy: FeedReplacementPolicy;
}

/** Market ticker widget spec (haber kaynağı değil). */
export interface MarketTickerSourceSpec {
  moduleType: 'market_ticker';
  tickerType: 'fx' | 'gold' | 'crypto' | 'index';
  symbol: string;
  provider: string;
  legalMode: LegalMode;
  updateIntervalSeconds: number;
  cacheTtlSeconds: number;
  displayDelayLabel?: string;
  sourceAttribution: string;
}

/** Sports widget spec (scraping yok). */
export interface SportsWidgetSourceSpec {
  moduleType: 'sports_widget';
  sport: string;
  league: string;
  provider: string;
  legalMode: LegalMode;
  cacheTtlSeconds: number;
}

/** Weather widget spec. */
export interface WeatherWidgetSourceSpec {
  moduleType: 'weather_widget';
  locationMode: 'manual_city' | 'approximate_location';
  provider: string;
  legalMode: LegalMode;
  cacheTtlMinutes: number;
  dataSafetyImpact?: string;
}

/** Bildirim kuralı spec. */
export interface NotificationRuleSpec {
  moduleType: 'notification_rule';
  notificationCategory: string;
  enabled: boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';
  rateLimitPerHour: number;
  quietHours?: { start: string; end: string };
  sourceAttributionRequired: boolean;
  legalDisclaimerRequired: boolean;
}

export interface SourceRegistryEntry {
  sourceId: string;
  sourceName: string;
  baseDomain: string;
  feedUrl?: string;
  canonicalUrlPattern?: string;
  country?: string;
  language?: string;
  category?: string;
  sourceType?: SourceType;
  moduleType?: ModuleType;
  /** İç profil notu; UI’da ideolojik etiket olarak kullanılmaz. */
  sourceProfile?: string;
  editorialProfileReview?: 'pending' | 'reviewed';
  legalMode: LegalMode;
  authorityTier: string;
  reviewStatus: ReviewStatus;
  publishEligible: boolean;
  allowedFields: string[];
  forbiddenFields: string[];
  imagePolicy?: 'forbidden' | 'link_only' | 'licensed_only';
  summaryPolicy?: 'forbidden' | 'rss_short_only' | 'licensed_only';
  robotsRisk?: 'unknown' | 'low' | 'medium' | 'high';
  termsReviewedAt?: string | null;
  licenseStatus?: LicenseStatus;
  sourceHealthEnabled?: boolean;
  freshnessSlaMinutes?: number;
  notes?: string;
}

export const REQUIRED_REGISTRY_FIELDS: Array<keyof SourceRegistryEntry> = [
  'sourceId',
  'sourceName',
  'baseDomain',
  'legalMode',
  'authorityTier',
  'reviewStatus',
  'publishEligible',
  'allowedFields',
  'forbiddenFields',
];

export const TITLE_LINK_ONLY_ALLOWED_FIELDS = new Set([
  'title',
  'canonicalUrl',
  'originalLink',
  'sourceName',
  'publishedAt',
  'category',
  'section',
]);

export const TITLE_LINK_ONLY_FORBIDDEN_FIELDS = [
  'description',
  'summary',
  'body',
  'fullText',
  'contentHtml',
  'rawHtml',
  'articleText',
  'scrapedText',
  'image',
  'video',
  'audio',
  'caption',
] as const;

export const AGENCY_SOURCE_IDS = new Set([
  'aa_guncel',
  'dha',
  'iha',
  'anka',
  'reuters',
  'ap',
  'afp',
]);
