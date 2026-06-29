import type { LegalMode, ReviewStatus, SourceRegistryEntry } from './source-registry-types.js';
import { validateLegalModeContract, type ContractViolation } from './source-registry-contract.js';
import type { SourceRegistryV0Document } from './source-registry-loader.js';

const LEGAL_MODES: LegalMode[] = [
  'DISABLED',
  'NEEDS_REVIEW',
  'TITLE_LINK_ONLY',
  'RSS_METADATA_ONLY',
  'LICENSED',
];

const REVIEW_STATUSES: ReviewStatus[] = ['pending', 'approved', 'rejected'];

const CORE_FORBIDDEN_FIELDS = [
  'fullText',
  'rawHtml',
  'articleText',
  'scrapedText',
  'image',
  'video',
  'audio',
  'caption',
] as const;

export interface RegistryValidationIssue {
  sourceId: string;
  rule: string;
  message: string;
}

function toIssue(v: ContractViolation): RegistryValidationIssue {
  return { sourceId: v.sourceId, rule: v.rule, message: v.message };
}

export function validateSourceRegistryEntry(entry: SourceRegistryEntry): RegistryValidationIssue[] {
  const issues: RegistryValidationIssue[] = validateLegalModeContract(entry).map(toIssue);

  if (!LEGAL_MODES.includes(entry.legalMode)) {
    issues.push({
      sourceId: entry.sourceId,
      rule: 'legal_mode_enum',
      message: `Geçersiz legalMode: ${entry.legalMode}`,
    });
  }

  if (!REVIEW_STATUSES.includes(entry.reviewStatus)) {
    issues.push({
      sourceId: entry.sourceId,
      rule: 'review_status_enum',
      message: `Geçersiz reviewStatus: ${entry.reviewStatus}`,
    });
  }

  if (!entry.baseDomain?.trim()) {
    issues.push({
      sourceId: entry.sourceId,
      rule: 'base_domain',
      message: 'baseDomain boş olamaz',
    });
  }

  for (const field of CORE_FORBIDDEN_FIELDS) {
    if (!entry.forbiddenFields.includes(field)) {
      issues.push({
        sourceId: entry.sourceId,
        rule: 'core_forbidden_fields',
        message: `forbiddenFields içinde ${field} zorunlu`,
      });
    }
  }

  return issues;
}

export function validateSourceRegistryV0(
  registry: SourceRegistryV0Document,
): RegistryValidationIssue[] {
  const issues: RegistryValidationIssue[] = [];
  const seenIds = new Set<string>();

  for (const entry of registry.sources) {
    if (seenIds.has(entry.sourceId)) {
      issues.push({
        sourceId: entry.sourceId,
        rule: 'unique_source_id',
        message: `Yinelenen sourceId: ${entry.sourceId}`,
      });
    }
    seenIds.add(entry.sourceId);
    issues.push(...validateSourceRegistryEntry(entry));
  }

  return issues;
}

export function assertValidSourceRegistryV0(registry: SourceRegistryV0Document): void {
  const issues = validateSourceRegistryV0(registry);
  if (issues.length > 0) {
    const summary = issues.map((i) => `${i.sourceId}:${i.rule}`).join(', ');
    throw new Error(`Source registry v0 geçersiz: ${summary}`);
  }
}
