import type { SourceRegistryV0Document } from './source-registry-loader.js';
import {
  resolveRegistryEntryForFeedSource,
  type SmartFeedItemForGuardrailAudit,
} from './legal-content-guardrail-dry-run.js';

export const TITLE_LINK_ONLY_SUMMARY_POLICY_AUDIT_DISCLAIMER =
  'Read-only policy audit; item payload değiştirilmez. Mutlak doğruluk iddiası değildir.';

/** Runtime rss-sources.ts + registry audit hedef kaynaklar. */
export const COMMERCIAL_MEDIA_AUDIT_SOURCE_IDS = [
  'trt_haber',
  'ntv_son_dakika',
  'haberturk_ekonomi',
] as const;

export type TitleLinkOnlySummaryPolicyReasonCode =
  | 'title_link_only_user_visible_summary'
  | 'needs_review_user_visible_summary'
  | 'no_summary_present'
  | 'source_unmatched'
  | 'not_in_audit_scope';

export type TitleLinkOnlySummaryPolicyRecommendedFix =
  | 'backend_dto_cleanup'
  | 'android_fallback_then_cleanup'
  | 'source_registry_mode_review'
  | 'no_action'
  | 'unknown';

export interface TitleLinkOnlySummaryPolicyDecision {
  itemId: string;
  sourceName: string;
  sourceId?: string;
  legalMode?: string;
  dryRunOnly: true;
  aiSummaryPresent: boolean;
  summaryPresent: boolean;
  descriptionPresent: boolean;
  shortDescriptionPresent: boolean;
  userVisibleFields: string[];
  suspectedSourceFields: string[];
  recommendedFix: TitleLinkOnlySummaryPolicyRecommendedFix;
  reasonCode: TitleLinkOnlySummaryPolicyReasonCode;
  lineageNote: string;
}

export interface TitleLinkOnlySummaryPolicyAuditPayload {
  version: 'v0';
  readOnly: true;
  disclaimer: string;
  sourceRegistryVersion: string;
  evaluatedItemCount: number;
  titleLinkOnlyItemCount: number;
  needsReviewItemCount: number;
  userVisibleSummaryItemCount: number;
  forbiddenSummaryFieldCount: number;
  overallRecommendedFix: TitleLinkOnlySummaryPolicyRecommendedFix;
  bySourceId: Record<
    string,
    {
      itemCount: number;
      userVisibleSummaryItemCount: number;
      recommendedFix: TitleLinkOnlySummaryPolicyRecommendedFix;
    }
  >;
  decisions: TitleLinkOnlySummaryPolicyDecision[];
}

function isNonEmpty(value: string | null | undefined): boolean {
  return value != null && value.trim().length > 0;
}

function isAuditScope(record: { sourceId: string; legalMode: string } | undefined): boolean {
  if (!record) return false;
  return (
    COMMERCIAL_MEDIA_AUDIT_SOURCE_IDS.includes(
      record.sourceId as (typeof COMMERCIAL_MEDIA_AUDIT_SOURCE_IDS)[number],
    ) ||
    record.legalMode === 'TITLE_LINK_ONLY' ||
    record.legalMode === 'NEEDS_REVIEW'
  );
}

function buildSuspectedSourceFields(item: SmartFeedItemForGuardrailAudit): string[] {
  const fields: string[] = [];
  if (isNonEmpty(item.aiSummary)) {
    fields.push('rss-ingest.shortDescription');
    fields.push('smart-feed.aiSummary<=leadArticle.shortDescription');
  }
  const lead = item.sources?.[0];
  if (lead?.shortDescription && isNonEmpty(lead.shortDescription)) {
    fields.push('sources[0].shortDescription');
  }
  if (item.smartDigest && typeof item.smartDigest === 'object') {
    const digest = item.smartDigest as { summary?: string | null };
    if (isNonEmpty(digest.summary ?? undefined)) {
      fields.push('smartDigest.summary (LLM/metadata — ayrı blok)');
    }
  }
  return [...new Set(fields)];
}

function buildUserVisibleSummaryFields(item: SmartFeedItemForGuardrailAudit): string[] {
  const visible: string[] = [];
  if (isNonEmpty(item.aiSummary)) {
    visible.push('aiSummary');
  }
  return visible;
}

function resolveRecommendedFix(input: {
  legalMode?: string;
  userVisibleFields: string[];
  aiSummaryPresent: boolean;
}): TitleLinkOnlySummaryPolicyRecommendedFix {
  if (!input.aiSummaryPresent || input.userVisibleFields.length === 0) {
    return 'no_action';
  }
  if (input.legalMode === 'NEEDS_REVIEW') {
    return 'source_registry_mode_review';
  }
  if (input.legalMode === 'TITLE_LINK_ONLY') {
    return 'android_fallback_then_cleanup';
  }
  return 'unknown';
}

function resolveReasonCode(input: {
  legalMode?: string;
  aiSummaryPresent: boolean;
  inScope: boolean;
  matched: boolean;
}): TitleLinkOnlySummaryPolicyReasonCode {
  if (!input.matched) return 'source_unmatched';
  if (!input.inScope) return 'not_in_audit_scope';
  if (!input.aiSummaryPresent) return 'no_summary_present';
  if (input.legalMode === 'NEEDS_REVIEW') return 'needs_review_user_visible_summary';
  if (input.legalMode === 'TITLE_LINK_ONLY') return 'title_link_only_user_visible_summary';
  return 'not_in_audit_scope';
}

function buildLineageNote(item: SmartFeedItemForGuardrailAudit): string {
  if (!isNonEmpty(item.aiSummary)) {
    return 'aiSummary yok; RSS shortDescription boş veya publish edilmemiş.';
  }
  return (
    'aiSummary RSS shortDescription türevi (rss-ingest: contentSnippet/content/summary → ' +
    'shortDescription; smart-feed: aiSummary=leadArticle.shortDescription). LLM değil.'
  );
}

export function evaluateTitleLinkOnlySummaryPolicyForItem(
  item: SmartFeedItemForGuardrailAudit & { smartDigest?: unknown },
  registry: SourceRegistryV0Document,
): TitleLinkOnlySummaryPolicyDecision | null {
  const leadSourceName = item.sources?.[0]?.sourceName ?? 'unknown';
  const leadUrl = item.sources?.[0]?.url;
  const record = resolveRegistryEntryForFeedSource(registry, leadSourceName, leadUrl);

  if (!record || !isAuditScope(record)) {
    return null;
  }

  const aiSummaryPresent = isNonEmpty(item.aiSummary ?? undefined);
  const summaryPresent = aiSummaryPresent;
  const shortDescriptionPresent =
    aiSummaryPresent || isNonEmpty(item.sources?.[0]?.shortDescription);
  const descriptionPresent = aiSummaryPresent;
  const userVisibleFields = buildUserVisibleSummaryFields(item);
  const suspectedSourceFields = buildSuspectedSourceFields(item);

  const recommendedFix = resolveRecommendedFix({
    legalMode: record.legalMode,
    userVisibleFields,
    aiSummaryPresent,
  });
  const reasonCode = resolveReasonCode({
    legalMode: record.legalMode,
    aiSummaryPresent,
    inScope: true,
    matched: true,
  });

  return {
    itemId: item.id,
    sourceName: leadSourceName,
    sourceId: record.sourceId,
    legalMode: record.legalMode,
    dryRunOnly: true,
    aiSummaryPresent,
    summaryPresent,
    descriptionPresent,
    shortDescriptionPresent,
    userVisibleFields,
    suspectedSourceFields,
    recommendedFix,
    reasonCode,
    lineageNote: buildLineageNote(item),
  };
}

export function resolveOverallSummaryPolicyFix(
  decisions: TitleLinkOnlySummaryPolicyDecision[],
): TitleLinkOnlySummaryPolicyRecommendedFix {
  const fixes = decisions.map((d) => d.recommendedFix);
  if (fixes.includes('source_registry_mode_review')) {
    return 'source_registry_mode_review';
  }
  if (fixes.includes('android_fallback_then_cleanup')) {
    return 'android_fallback_then_cleanup';
  }
  if (fixes.includes('backend_dto_cleanup')) {
    return 'backend_dto_cleanup';
  }
  if (fixes.every((f) => f === 'no_action')) {
    return 'no_action';
  }
  return 'unknown';
}

export function buildTitleLinkOnlySummaryPolicyAudit(input: {
  items: Array<SmartFeedItemForGuardrailAudit & { smartDigest?: unknown }>;
  registry: SourceRegistryV0Document;
}): TitleLinkOnlySummaryPolicyAuditPayload {
  const decisions: TitleLinkOnlySummaryPolicyDecision[] = [];

  for (const item of input.items) {
    const decision = evaluateTitleLinkOnlySummaryPolicyForItem(item, input.registry);
    if (decision) {
      decisions.push(decision);
    }
  }

  let titleLinkOnlyItemCount = 0;
  let needsReviewItemCount = 0;
  let userVisibleSummaryItemCount = 0;
  let forbiddenSummaryFieldCount = 0;
  const bySourceId: TitleLinkOnlySummaryPolicyAuditPayload['bySourceId'] = {};

  for (const d of decisions) {
    if (d.legalMode === 'TITLE_LINK_ONLY') titleLinkOnlyItemCount += 1;
    if (d.legalMode === 'NEEDS_REVIEW') needsReviewItemCount += 1;
    if (d.userVisibleFields.includes('aiSummary')) {
      userVisibleSummaryItemCount += 1;
      forbiddenSummaryFieldCount += 1;
      if (d.summaryPresent) forbiddenSummaryFieldCount += 1;
      if (d.descriptionPresent) forbiddenSummaryFieldCount += 1;
      if (d.shortDescriptionPresent) forbiddenSummaryFieldCount += 1;
    }

    const key = d.sourceId ?? 'unmatched';
    if (!bySourceId[key]) {
      bySourceId[key] = {
        itemCount: 0,
        userVisibleSummaryItemCount: 0,
        recommendedFix: d.recommendedFix,
      };
    }
    bySourceId[key].itemCount += 1;
    if (d.userVisibleFields.includes('aiSummary')) {
      bySourceId[key].userVisibleSummaryItemCount += 1;
    }
  }

  return {
    version: 'v0',
    readOnly: true,
    disclaimer: TITLE_LINK_ONLY_SUMMARY_POLICY_AUDIT_DISCLAIMER,
    sourceRegistryVersion: input.registry.version,
    evaluatedItemCount: input.items.length,
    titleLinkOnlyItemCount,
    needsReviewItemCount,
    userVisibleSummaryItemCount,
    forbiddenSummaryFieldCount,
    overallRecommendedFix: resolveOverallSummaryPolicyFix(decisions),
    bySourceId,
    decisions,
  };
}
