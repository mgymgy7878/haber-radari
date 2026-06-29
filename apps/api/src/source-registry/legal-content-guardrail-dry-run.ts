import type { SourceRegistryEntry } from './source-registry-types.js';
import type { SourceRegistryV0Document } from './source-registry-loader.js';
import {
  getAllowedFieldsForLegalMode,
  getForbiddenFieldsForLegalMode,
  stripDisallowedFieldsForSource,
  type LegalFieldPayload,
} from './legal-field-guard.js';
import {
  enrichLegalContentGuardrailDecisionWithRca,
  resolveOverallRcaRecommendation,
  type LegalContentGuardrailForbiddenFieldDetail,
  type LegalContentGuardrailFieldLocation,
  type LegalContentGuardrailRecommendedFix,
} from './legal-content-guardrail-rca.js';

export const LEGAL_CONTENT_GUARDRAIL_DRY_RUN_DISCLAIMER =
  'Dry-run yalnızca simülasyon; gerçek item payload strip edilmez. Mutlak doğruluk iddiası değildir.';

export type LegalContentGuardrailReasonCode =
  | 'ok'
  | 'would_strip_forbidden_fields'
  | 'would_strip_disallowed_fields'
  | 'not_production_eligible'
  | 'source_unmatched';

export interface LegalContentGuardrailDryRunBaseDecision {
  itemId: string;
  sourceName: string;
  sourceId?: string;
  legalMode?: string;
  dryRunOnly: true;
  wouldStrip: boolean;
  fieldsPresent: string[];
  forbiddenFieldsPresent: string[];
  wouldStripFields: string[];
  allowedFields: string[];
  reasonCode: LegalContentGuardrailReasonCode;
}

export interface LegalContentGuardrailDryRunDecision extends LegalContentGuardrailDryRunBaseDecision {
  visibleInItemPayload: string[];
  itemPayloadFieldCount: number;
  forbiddenFieldDetails: LegalContentGuardrailForbiddenFieldDetail[];
  fieldLocation: LegalContentGuardrailFieldLocation;
  recommendedFix: LegalContentGuardrailRecommendedFix;
  rcaSummary: string;
}

export interface LegalContentGuardrailDryRunByLegalMode {
  evaluatedCount: number;
  wouldStripItemCount: number;
  wouldStripFieldCount: number;
}

export interface LegalContentGuardrailDryRunPayload {
  version: 'v0';
  readOnly: true;
  disclaimer: string;
  sourceRegistryVersion: string;
  rcaVersion: 'v0';
  overallRecommendedFix: LegalContentGuardrailRecommendedFix;
  evaluatedItemCount: number;
  sourceMatchedCount: number;
  sourceUnmatchedCount: number;
  wouldStripItemCount: number;
  wouldStripFieldCount: number;
  byLegalMode: Record<string, LegalContentGuardrailDryRunByLegalMode>;
  decisions: LegalContentGuardrailDryRunDecision[];
}

export interface SmartFeedItemForGuardrailAudit {
  id: string;
  aiTitle?: string;
  aiSummary?: string | null;
  sources?: Array<{
    sourceName?: string;
    originalTitle?: string;
    url?: string;
    publishedAt?: number;
    imageUrl?: string | null;
    videoUrl?: string | null;
    shortDescription?: string;
  }>;
  mediaHints?: unknown;
  fullText?: unknown;
  rawHtml?: unknown;
  articleText?: unknown;
  contentHtml?: unknown;
  smartDigest?: unknown;
}

const RUNTIME_SOURCE_NAME_TO_ID: Record<string, string> = {
  'anadolu ajansı': 'aa_guncel',
  aa: 'aa_guncel',
  'trt haber': 'trt_haber',
  ntv: 'ntv_son_dakika',
  habertürk: 'haberturk_ekonomi',
};

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

export function resolveRegistryEntryForFeedSource(
  registry: SourceRegistryV0Document,
  sourceName: string,
  sourceUrl?: string,
): SourceRegistryEntry | undefined {
  const normalized = normalizeName(sourceName);
  const aliasId = RUNTIME_SOURCE_NAME_TO_ID[normalized];
  if (aliasId) {
    const byAlias = registry.sources.find((s) => s.sourceId === aliasId);
    if (byAlias) return byAlias;
  }

  const byExactName = registry.sources.find(
    (s) => normalizeName(s.sourceName) === normalized,
  );
  if (byExactName) return byExactName;

  const byPartialName = registry.sources.find((s) => {
    const regName = normalizeName(s.sourceName);
    return normalized.includes(regName) || regName.includes(normalized);
  });
  if (byPartialName) return byPartialName;

  if (sourceUrl) {
    const domain = extractDomain(sourceUrl);
    if (domain) {
      return registry.sources.find(
        (s) => domain === s.baseDomain || domain.endsWith(`.${s.baseDomain}`),
      );
    }
  }

  return undefined;
}

export function extractAuditFieldsFromFeedItem(
  item: SmartFeedItemForGuardrailAudit,
): LegalFieldPayload {
  const fields: LegalFieldPayload = {};

  if (item.aiTitle) fields.title = item.aiTitle;
  if (item.aiSummary) {
    fields.summary = item.aiSummary;
    fields.shortDescription = item.aiSummary;
    fields.description = item.aiSummary;
  }
  if (item.fullText) fields.fullText = item.fullText;
  if (item.rawHtml) fields.rawHtml = item.rawHtml;
  if (item.articleText) fields.articleText = item.articleText;
  if (item.contentHtml) fields.contentHtml = item.contentHtml;

  const lead = item.sources?.[0];
  if (lead?.sourceName) fields.sourceName = lead.sourceName;
  if (lead?.originalTitle && !fields.title) fields.title = lead.originalTitle;
  if (lead?.url) fields.canonicalUrl = lead.url;
  if (lead?.publishedAt) fields.publishedAt = lead.publishedAt;
  if (lead?.shortDescription) {
    fields.shortDescription = lead.shortDescription;
    fields.summary = lead.shortDescription;
    fields.description = lead.shortDescription;
  }
  if (lead?.imageUrl) fields.image = lead.imageUrl;
  if (lead?.videoUrl) fields.video = lead.videoUrl;

  if (item.mediaHints && typeof item.mediaHints === 'object') {
    const hints = item.mediaHints as Record<string, unknown>;
    if (hints.image) fields.image = hints.image;
    if (hints.video) fields.video = hints.video;
    if (hints.audio) fields.audio = hints.audio;
    if (hints.caption) fields.caption = hints.caption;
  }

  return fields;
}

function isProductionEligible(record: SourceRegistryEntry): boolean {
  if (record.legalMode === 'DISABLED' || record.legalMode === 'NEEDS_REVIEW') {
    return false;
  }
  if (!record.publishEligible) return false;
  if (record.legalMode === 'LICENSED' && record.licenseStatus !== 'active') {
    return false;
  }
  return true;
}

export function evaluateLegalContentGuardrailDryRunForItem(
  item: SmartFeedItemForGuardrailAudit,
  registry: SourceRegistryV0Document,
): LegalContentGuardrailDryRunDecision {
  const leadSourceName = item.sources?.[0]?.sourceName ?? 'unknown';
  const leadUrl = item.sources?.[0]?.url;
  const record = resolveRegistryEntryForFeedSource(registry, leadSourceName, leadUrl);
  const fields = extractAuditFieldsFromFeedItem(item);
  const fieldsPresent = Object.keys(fields).filter(
    (k) => fields[k] !== undefined && fields[k] !== null && fields[k] !== '',
  );

  if (!record) {
    return enrichLegalContentGuardrailDecisionWithRca(item, {
      itemId: item.id,
      sourceName: leadSourceName,
      dryRunOnly: true,
      wouldStrip: false,
      fieldsPresent,
      forbiddenFieldsPresent: [],
      wouldStripFields: [],
      allowedFields: [],
      reasonCode: 'source_unmatched',
    });
  }

  const allowedFields = getAllowedFieldsForLegalMode(record);
  const forbiddenFields = getForbiddenFieldsForLegalMode(record);
  const forbiddenFieldsPresent = fieldsPresent.filter((f) => forbiddenFields.includes(f));
  const stripped = stripDisallowedFieldsForSource(record, fields);
  const wouldStripFields = fieldsPresent.filter((f) => !(f in stripped));

  let reasonCode: LegalContentGuardrailReasonCode = 'ok';
  let wouldStrip = wouldStripFields.length > 0;

  if (!isProductionEligible(record)) {
    reasonCode = 'not_production_eligible';
    if (fieldsPresent.length > 0) {
      wouldStrip = true;
    }
  } else if (forbiddenFieldsPresent.length > 0) {
    reasonCode = 'would_strip_forbidden_fields';
    wouldStrip = true;
  } else if (wouldStripFields.length > 0) {
    reasonCode = 'would_strip_disallowed_fields';
    wouldStrip = true;
  }

  return enrichLegalContentGuardrailDecisionWithRca(item, {
    itemId: item.id,
    sourceName: leadSourceName,
    sourceId: record.sourceId,
    legalMode: record.legalMode,
    dryRunOnly: true,
    wouldStrip,
    fieldsPresent,
    forbiddenFieldsPresent,
    wouldStripFields,
    allowedFields,
    reasonCode,
  });
}

export function buildLegalContentGuardrailDryRun(input: {
  items: SmartFeedItemForGuardrailAudit[];
  registry: SourceRegistryV0Document;
}): LegalContentGuardrailDryRunPayload {
  const decisions = input.items.map((item) =>
    evaluateLegalContentGuardrailDryRunForItem(item, input.registry),
  );

  const byLegalMode: Record<string, LegalContentGuardrailDryRunByLegalMode> = {};
  let sourceMatchedCount = 0;
  let sourceUnmatchedCount = 0;
  let wouldStripItemCount = 0;
  let wouldStripFieldCount = 0;

  for (const decision of decisions) {
    if (decision.sourceId) {
      sourceMatchedCount += 1;
    } else {
      sourceUnmatchedCount += 1;
    }
    if (decision.wouldStrip) {
      wouldStripItemCount += 1;
    }
    wouldStripFieldCount += decision.wouldStripFields.length;

    const modeKey = decision.legalMode ?? 'UNMATCHED';
    if (!byLegalMode[modeKey]) {
      byLegalMode[modeKey] = {
        evaluatedCount: 0,
        wouldStripItemCount: 0,
        wouldStripFieldCount: 0,
      };
    }
    byLegalMode[modeKey].evaluatedCount += 1;
    if (decision.wouldStrip) {
      byLegalMode[modeKey].wouldStripItemCount += 1;
    }
    byLegalMode[modeKey].wouldStripFieldCount += decision.wouldStripFields.length;
  }

  return {
    version: 'v0',
    readOnly: true,
    disclaimer: LEGAL_CONTENT_GUARDRAIL_DRY_RUN_DISCLAIMER,
    sourceRegistryVersion: input.registry.version,
    rcaVersion: 'v0',
    overallRecommendedFix: resolveOverallRcaRecommendation(decisions),
    evaluatedItemCount: decisions.length,
    sourceMatchedCount,
    sourceUnmatchedCount,
    wouldStripItemCount,
    wouldStripFieldCount,
    byLegalMode,
    decisions,
  };
}
