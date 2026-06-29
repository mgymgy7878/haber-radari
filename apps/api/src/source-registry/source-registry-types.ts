/** Source Registry SSOT v0 — tip sözleşmesi (contract PR; production ingest'e bağlı değil). */

import {
  AGENCY_SOURCE_IDS,
  LEGAL_MODES,
  LICENSE_STATUSES,
  PRODUCTION_FORBIDDEN_FIELDS,
  REQUIRED_SSOT_V0_FIELDS,
  REVIEW_STATUSES,
  RSS_METADATA_ONLY_ALLOWED_FIELDS,
  RSS_METADATA_ONLY_FORBIDDEN_FIELDS,
  TITLE_LINK_ONLY_ALLOWED_FIELDS,
  TITLE_LINK_ONLY_FORBIDDEN_FIELDS,
  TITLE_LINK_ONLY_SUMMARY_FIELDS,
  type LegalMode,
  type LicenseStatus,
  type ReviewStatus,
} from './source-registry-schema.js';

export type { LegalMode, LicenseStatus, ReviewStatus };

export { LEGAL_MODES, LICENSE_STATUSES, REVIEW_STATUSES };

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

export interface FeedRetentionPolicy {
  feedTtlHours: number;
  maxItemsPerCategory: number;
  maxTotalItems: number;
  criticalTtlHours?: number;
  staleAfterMinutes?: number;
  dedupeWindowHours?: number;
  replacementPolicy: FeedReplacementPolicy;
}

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

export interface SportsWidgetSourceSpec {
  moduleType: 'sports_widget';
  sport: string;
  league: string;
  provider: string;
  legalMode: LegalMode;
  cacheTtlSeconds: number;
}

export interface WeatherWidgetSourceSpec {
  moduleType: 'weather_widget';
  locationMode: 'manual_city' | 'approximate_location';
  provider: string;
  legalMode: LegalMode;
  cacheTtlMinutes: number;
  dataSafetyImpact?: string;
}

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
  sourceType: SourceType;
  moduleType?: ModuleType;
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
  /** SSOT v0 — son hukuki/operasyon inceleme tarihi; incelenmediyse null */
  lastReviewedAt: string | null;
  licenseStatus: LicenseStatus;
  sourceHealthEnabled?: boolean;
  freshnessSlaMinutes?: number;
  notes: string;
}

export const REQUIRED_REGISTRY_FIELDS = REQUIRED_SSOT_V0_FIELDS;

export {
  AGENCY_SOURCE_IDS,
  PRODUCTION_FORBIDDEN_FIELDS,
  TITLE_LINK_ONLY_ALLOWED_FIELDS,
  TITLE_LINK_ONLY_FORBIDDEN_FIELDS,
  TITLE_LINK_ONLY_SUMMARY_FIELDS,
  RSS_METADATA_ONLY_ALLOWED_FIELDS,
  RSS_METADATA_ONLY_FORBIDDEN_FIELDS,
};
