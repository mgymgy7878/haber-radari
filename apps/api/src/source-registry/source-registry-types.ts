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
  | 'WIRE';

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
