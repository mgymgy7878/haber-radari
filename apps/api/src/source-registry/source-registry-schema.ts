/**
 * Source Registry SSOT v0 — merkezi schema ve production contract sabitleri.
 * Read-only / contract PR: runtime ingest, smart-feed, Android seed bağlı değildir.
 */

export const SSOT_V0_VERSION = 'v0' as const;

/** Plan dokümantasyonu alan adları → kod alanları */
export const SSOT_FIELD_ALIASES = {
  id: 'sourceId',
  displayName: 'sourceName',
  canonicalBaseUrl: 'baseDomain',
  rssUrl: 'feedUrl',
  lastReviewedAt: 'lastReviewedAt',
} as const;

export const LEGAL_MODES = [
  'DISABLED',
  'NEEDS_REVIEW',
  'TITLE_LINK_ONLY',
  'RSS_METADATA_ONLY',
  'LICENSED',
] as const;

export type LegalMode = (typeof LEGAL_MODES)[number];

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const LICENSE_STATUSES = ['none', 'pending', 'active', 'expired'] as const;
export type LicenseStatus = (typeof LICENSE_STATUSES)[number];

/** Production source contract — varsayılan yasak alanlar */
export const PRODUCTION_FORBIDDEN_FIELDS = [
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
  'ocrText',
  'videoTranscript',
] as const;

export type ProductionForbiddenField = (typeof PRODUCTION_FORBIDDEN_FIELDS)[number];

/** TITLE_LINK_ONLY — ek user-visible özet alanları */
export const TITLE_LINK_ONLY_SUMMARY_FIELDS = [
  'description',
  'summary',
  'shortDescription',
  'aiSummary',
] as const;

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
  ...TITLE_LINK_ONLY_SUMMARY_FIELDS,
  ...PRODUCTION_FORBIDDEN_FIELDS,
] as const;

export const RSS_METADATA_ONLY_ALLOWED_FIELDS = new Set([
  'title',
  'shortDescription',
  'canonicalUrl',
  'originalLink',
  'sourceName',
  'publishedAt',
  'category',
  'section',
]);

export const RSS_METADATA_ONLY_FORBIDDEN_FIELDS = [
  ...PRODUCTION_FORBIDDEN_FIELDS,
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

/** SSOT v0 zorunlu kayıt alanları (kod adları) */
export const REQUIRED_SSOT_V0_FIELDS = [
  'sourceId',
  'sourceName',
  'sourceType',
  'baseDomain',
  'legalMode',
  'authorityTier',
  'allowedFields',
  'forbiddenFields',
  'reviewStatus',
  'publishEligible',
  'licenseStatus',
  'notes',
  'lastReviewedAt',
] as const;
