import type {
  LegalContentGuardrailDryRunBaseDecision,
  LegalContentGuardrailDryRunDecision,
  SmartFeedItemForGuardrailAudit,
} from './legal-content-guardrail-dry-run.js';

export type LegalContentGuardrailFieldLocation =
  | 'item_payload'
  | 'source_payload'
  | 'debug_only'
  | 'internal_only'
  | 'unknown';

export type LegalContentGuardrailRecommendedFix =
  | 'guard_binding'
  | 'normalize_cleanup'
  | 'source_registry_mode_review'
  | 'no_action_debug_only';

export interface LegalContentGuardrailForbiddenFieldDetail {
  field: string;
  forbidden: boolean;
  wouldStrip: boolean;
  fieldLocation: LegalContentGuardrailFieldLocation;
  userVisible: boolean;
  itemPayloadPath?: string;
  auditDerivedOnly: boolean;
}

export interface LegalContentGuardrailRcaDecisionFields {
  visibleInItemPayload: string[];
  itemPayloadFieldCount: number;
  forbiddenFieldDetails: LegalContentGuardrailForbiddenFieldDetail[];
  fieldLocation: LegalContentGuardrailFieldLocation;
  recommendedFix: LegalContentGuardrailRecommendedFix;
  rcaSummary: string;
}

interface FieldPayloadMapping {
  fieldLocation: LegalContentGuardrailFieldLocation;
  userVisible: boolean;
  itemPayloadPath?: string;
  auditDerivedOnly: boolean;
}

const FIELD_PAYLOAD_MAP: Record<string, FieldPayloadMapping> = {
  title: {
    fieldLocation: 'item_payload',
    userVisible: true,
    itemPayloadPath: 'aiTitle',
    auditDerivedOnly: false,
  },
  summary: {
    fieldLocation: 'item_payload',
    userVisible: true,
    itemPayloadPath: 'aiSummary',
    auditDerivedOnly: false,
  },
  shortDescription: {
    fieldLocation: 'item_payload',
    userVisible: true,
    itemPayloadPath: 'aiSummary',
    auditDerivedOnly: false,
  },
  description: {
    fieldLocation: 'internal_only',
    userVisible: false,
    itemPayloadPath: 'aiSummary (audit-derived duplicate)',
    auditDerivedOnly: true,
  },
  sourceName: {
    fieldLocation: 'source_payload',
    userVisible: true,
    itemPayloadPath: 'sources[0].sourceName',
    auditDerivedOnly: false,
  },
  canonicalUrl: {
    fieldLocation: 'source_payload',
    userVisible: true,
    itemPayloadPath: 'sources[0].url',
    auditDerivedOnly: false,
  },
  publishedAt: {
    fieldLocation: 'source_payload',
    userVisible: true,
    itemPayloadPath: 'sources[0].publishedAt',
    auditDerivedOnly: false,
  },
  category: {
    fieldLocation: 'item_payload',
    userVisible: true,
    itemPayloadPath: 'category',
    auditDerivedOnly: false,
  },
  image: {
    fieldLocation: 'source_payload',
    userVisible: true,
    itemPayloadPath: 'sources[0].imageUrl',
    auditDerivedOnly: false,
  },
  video: {
    fieldLocation: 'source_payload',
    userVisible: false,
    itemPayloadPath: 'sources[0].videoUrl',
    auditDerivedOnly: false,
  },
  audio: {
    fieldLocation: 'internal_only',
    userVisible: false,
    auditDerivedOnly: true,
  },
  caption: {
    fieldLocation: 'internal_only',
    userVisible: false,
    auditDerivedOnly: true,
  },
  fullText: {
    fieldLocation: 'internal_only',
    userVisible: false,
    auditDerivedOnly: true,
  },
  rawHtml: {
    fieldLocation: 'internal_only',
    userVisible: false,
    auditDerivedOnly: true,
  },
  articleText: {
    fieldLocation: 'internal_only',
    userVisible: false,
    auditDerivedOnly: true,
  },
  contentHtml: {
    fieldLocation: 'internal_only',
    userVisible: false,
    auditDerivedOnly: true,
  },
  body: {
    fieldLocation: 'internal_only',
    userVisible: false,
    auditDerivedOnly: true,
  },
  scrapedText: {
    fieldLocation: 'internal_only',
    userVisible: false,
    auditDerivedOnly: true,
  },
};

function defaultFieldMapping(field: string): FieldPayloadMapping {
  return {
    fieldLocation: 'unknown',
    userVisible: false,
    auditDerivedOnly: false,
  };
}

export function countItemPayloadFields(item: SmartFeedItemForGuardrailAudit): number {
  return Object.keys(item).filter((k) => {
    const v = (item as Record<string, unknown>)[k];
    return v !== undefined && v !== null;
  }).length;
}

export function resolveDecisionFieldLocation(
  details: LegalContentGuardrailForbiddenFieldDetail[],
): LegalContentGuardrailFieldLocation {
  if (details.some((d) => d.fieldLocation === 'item_payload' && d.userVisible)) {
    return 'item_payload';
  }
  if (details.some((d) => d.fieldLocation === 'source_payload' && d.userVisible)) {
    return 'source_payload';
  }
  if (details.some((d) => d.fieldLocation === 'item_payload')) {
    return 'item_payload';
  }
  if (details.some((d) => d.fieldLocation === 'source_payload')) {
    return 'source_payload';
  }
  if (details.every((d) => d.auditDerivedOnly)) {
    return 'internal_only';
  }
  if (details.length === 0) {
    return 'unknown';
  }
  return details[0]?.fieldLocation ?? 'unknown';
}

export function resolveRecommendedFix(input: {
  decision: Pick<
    LegalContentGuardrailDryRunBaseDecision,
    'legalMode' | 'reasonCode' | 'wouldStrip' | 'wouldStripFields'
  >;
  details: LegalContentGuardrailForbiddenFieldDetail[];
  hasUserVisibleStripFields: boolean;
}): LegalContentGuardrailRecommendedFix {
  const { decision, details, hasUserVisibleStripFields } = input;

  if (decision.reasonCode === 'source_unmatched' || !decision.wouldStrip) {
    return 'no_action_debug_only';
  }

  if (
    decision.legalMode === 'DISABLED' ||
    decision.legalMode === 'NEEDS_REVIEW' ||
    decision.reasonCode === 'not_production_eligible'
  ) {
    return 'source_registry_mode_review';
  }

  const onlyAuditDuplicates =
    details.length > 0 && details.every((d) => d.auditDerivedOnly || d.field === 'description');

  if (hasUserVisibleStripFields && decision.legalMode === 'TITLE_LINK_ONLY') {
    return 'normalize_cleanup';
  }

  if (hasUserVisibleStripFields) {
    return 'normalize_cleanup';
  }

  if (onlyAuditDuplicates) {
    return 'no_action_debug_only';
  }

  if (details.every((d) => d.fieldLocation === 'internal_only')) {
    return 'no_action_debug_only';
  }

  return 'guard_binding';
}

export function buildForbiddenFieldDetails(
  decision: Pick<
    LegalContentGuardrailDryRunBaseDecision,
    'forbiddenFieldsPresent' | 'wouldStripFields'
  >,
): LegalContentGuardrailForbiddenFieldDetail[] {
  const fields = [...new Set([...decision.wouldStripFields, ...decision.forbiddenFieldsPresent])];

  return fields.map((field) => {
    const mapping = FIELD_PAYLOAD_MAP[field] ?? defaultFieldMapping(field);
    return {
      field,
      forbidden: decision.forbiddenFieldsPresent.includes(field),
      wouldStrip: decision.wouldStripFields.includes(field),
      fieldLocation: mapping.fieldLocation,
      userVisible: mapping.userVisible,
      itemPayloadPath: mapping.itemPayloadPath,
      auditDerivedOnly: mapping.auditDerivedOnly,
    };
  });
}

export function buildRcaSummary(input: {
  decision: Pick<
    LegalContentGuardrailDryRunBaseDecision,
    'itemId' | 'sourceName' | 'sourceId' | 'legalMode' | 'wouldStripFields'
  >;
  visibleInItemPayload: string[];
  recommendedFix: LegalContentGuardrailRecommendedFix;
}): string {
  const stripList = input.decision.wouldStripFields.join(', ') || 'none';
  const visibleList = input.visibleInItemPayload.join(', ') || 'none';
  return (
    `item=${input.decision.itemId} source=${input.decision.sourceName}` +
    ` (${input.decision.sourceId ?? 'unmatched'}, ${input.decision.legalMode ?? 'n/a'}):` +
    ` wouldStrip=[${stripList}]; userVisible=[${visibleList}]; fix=${input.recommendedFix}`
  );
}

export function enrichLegalContentGuardrailDecisionWithRca(
  item: SmartFeedItemForGuardrailAudit,
  decision: LegalContentGuardrailDryRunBaseDecision,
): LegalContentGuardrailDryRunDecision {
  const forbiddenFieldDetails = buildForbiddenFieldDetails(decision);
  const visibleInItemPayload = forbiddenFieldDetails
    .filter((d) => d.wouldStrip && d.userVisible)
    .map((d) => d.field);
  const hasUserVisibleStripFields = visibleInItemPayload.length > 0;
  const fieldLocation = resolveDecisionFieldLocation(forbiddenFieldDetails);
  const recommendedFix = resolveRecommendedFix({
    decision,
    details: forbiddenFieldDetails,
    hasUserVisibleStripFields,
  });
  const rcaSummary = buildRcaSummary({
    decision,
    visibleInItemPayload,
    recommendedFix,
  });

  return {
    ...decision,
    visibleInItemPayload,
    itemPayloadFieldCount: countItemPayloadFields(item),
    forbiddenFieldDetails,
    fieldLocation,
    recommendedFix,
    rcaSummary,
  };
}

export interface LegalContentGuardrailRcaTableRow {
  itemId: string;
  sourceName: string;
  sourceId: string;
  legalMode: string;
  wouldStrip: boolean;
  forbiddenFieldsPresent: string;
  fieldLocation: string;
  userVisible: string;
  recommendedFix: string;
}

export function buildRcaTableRows(
  decisions: LegalContentGuardrailDryRunDecision[],
): LegalContentGuardrailRcaTableRow[] {
  return decisions.map((d) => ({
    itemId: d.itemId,
    sourceName: d.sourceName,
    sourceId: d.sourceId ?? 'unmatched',
    legalMode: d.legalMode ?? 'UNMATCHED',
    wouldStrip: d.wouldStrip,
    forbiddenFieldsPresent: d.forbiddenFieldsPresent.join(', ') || '—',
    fieldLocation: d.fieldLocation,
    userVisible: d.visibleInItemPayload.join(', ') || 'none',
    recommendedFix: d.recommendedFix,
  }));
}

export function resolveOverallRcaRecommendation(
  decisions: LegalContentGuardrailDryRunDecision[],
): LegalContentGuardrailRecommendedFix {
  const fixes = decisions.map((d) => d.recommendedFix);
  if (fixes.includes('source_registry_mode_review')) {
    return 'source_registry_mode_review';
  }
  if (fixes.includes('normalize_cleanup')) {
    return 'normalize_cleanup';
  }
  if (fixes.includes('guard_binding')) {
    return 'guard_binding';
  }
  return 'no_action_debug_only';
}
