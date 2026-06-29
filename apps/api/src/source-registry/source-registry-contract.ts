import type { LegalMode, SourceRegistryEntry } from './source-registry-types.js';
import {
  AGENCY_SOURCE_IDS,
  REQUIRED_REGISTRY_FIELDS,
  TITLE_LINK_ONLY_ALLOWED_FIELDS,
  TITLE_LINK_ONLY_FORBIDDEN_FIELDS,
} from './source-registry-types.js';

export interface ContractViolation {
  sourceId: string;
  rule: string;
  message: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function validateRequiredFields(entry: SourceRegistryEntry): ContractViolation[] {
  const violations: ContractViolation[] = [];

  for (const field of REQUIRED_REGISTRY_FIELDS) {
    const value = entry[field];
    if (field === 'allowedFields') {
      if (!isStringArray(value)) {
        violations.push({
          sourceId: entry.sourceId,
          rule: 'required_fields',
          message: 'allowedFields zorunlu string dizisi olmalı',
        });
      } else if (value.length === 0 && entry.legalMode !== 'DISABLED') {
        violations.push({
          sourceId: entry.sourceId,
          rule: 'required_fields',
          message: 'allowedFields boş olamaz (DISABLED hariç)',
        });
      }
      continue;
    }
    if (field === 'forbiddenFields') {
      if (!isStringArray(value) || value.length === 0) {
        violations.push({
          sourceId: entry.sourceId,
          rule: 'required_fields',
          message: 'forbiddenFields zorunlu ve boş olmayan string dizisi olmalı',
        });
      }
      continue;
    }
    if (typeof value !== 'boolean' && !isNonEmptyString(value)) {
      violations.push({
        sourceId: entry.sourceId,
        rule: 'required_fields',
        message: `${field} zorunlu`,
      });
    }
  }

  return violations;
}

export function validatePublishEligibility(entry: SourceRegistryEntry): ContractViolation[] {
  const violations: ContractViolation[] = [];

  if (entry.legalMode === 'DISABLED' && entry.publishEligible) {
    violations.push({
      sourceId: entry.sourceId,
      rule: 'publish_eligibility',
      message: 'DISABLED kaynak publishEligible=false olmalı',
    });
  }

  if (entry.legalMode === 'NEEDS_REVIEW' && entry.publishEligible) {
    violations.push({
      sourceId: entry.sourceId,
      rule: 'publish_eligibility',
      message: 'NEEDS_REVIEW kaynak publishEligible=false olmalı',
    });
  }

  if (
    entry.legalMode === 'LICENSED' &&
    entry.licenseStatus !== 'active' &&
    entry.publishEligible
  ) {
    violations.push({
      sourceId: entry.sourceId,
      rule: 'publish_eligibility',
      message: 'LICENSED kaynak licenseStatus=active olmadan publishEligible=true olamaz',
    });
  }

  const isAgency =
    entry.sourceType === 'AGENCY' ||
    entry.sourceType === 'WIRE' ||
    entry.sourceType === 'news_agency' ||
    AGENCY_SOURCE_IDS.has(entry.sourceId);

  if (isAgency && entry.licenseStatus !== 'active' && entry.publishEligible) {
    violations.push({
      sourceId: entry.sourceId,
      rule: 'agency_license',
      message: 'Lisanssız ajans kaynağı publishEligible=false olmalı',
    });
  }

  return violations;
}

export function validateTitleLinkOnlyPolicy(entry: SourceRegistryEntry): ContractViolation[] {
  if (entry.legalMode !== 'TITLE_LINK_ONLY') {
    return [];
  }

  const violations: ContractViolation[] = [];

  for (const field of entry.allowedFields) {
    if (!TITLE_LINK_ONLY_ALLOWED_FIELDS.has(field)) {
      violations.push({
        sourceId: entry.sourceId,
        rule: 'title_link_only_allowed',
        message: `TITLE_LINK_ONLY allowedFields içinde izin verilmeyen alan: ${field}`,
      });
    }
  }

  for (const forbidden of TITLE_LINK_ONLY_FORBIDDEN_FIELDS) {
    if (!entry.forbiddenFields.includes(forbidden)) {
      violations.push({
        sourceId: entry.sourceId,
        rule: 'title_link_only_forbidden',
        message: `TITLE_LINK_ONLY forbiddenFields içinde ${forbidden} zorunlu`,
      });
    }
  }

  if (entry.allowedFields.some((field) => TITLE_LINK_ONLY_FORBIDDEN_FIELDS.includes(field as never))) {
    violations.push({
      sourceId: entry.sourceId,
      rule: 'title_link_only_overlap',
      message: 'allowedFields ile forbiddenFields çakışmamalı',
    });
  }

  return violations;
}

export function validateLegalModeContract(entry: SourceRegistryEntry): ContractViolation[] {
  return [
    ...validateRequiredFields(entry),
    ...validatePublishEligibility(entry),
    ...validateTitleLinkOnlyPolicy(entry),
  ];
}

export function validateRegistry(entries: SourceRegistryEntry[]): ContractViolation[] {
  return entries.flatMap((entry) => validateLegalModeContract(entry));
}

/** legalMode sözlüğü — dokümantasyon ve test referansı. */
export const LEGAL_MODE_CONTRACT: Record<
  LegalMode,
  {
    allowedFields: string[];
    forbiddenFields: string[];
    productionIngest: string;
    publishEligibleDefault: boolean;
    example: string;
  }
> = {
  DISABLED: {
    allowedFields: [],
    forbiddenFields: ['*'],
    productionIngest: 'fetch atlanır; registry’de görünür olabilir',
    publishEligibleDefault: false,
    example: 'AA (lisans yok)',
  },
  NEEDS_REVIEW: {
    allowedFields: ['title', 'canonicalUrl', 'sourceName', 'publishedAt'],
    forbiddenFields: [...TITLE_LINK_ONLY_FORBIDDEN_FIELDS],
    productionIngest: 'production ingest kapalı; hukuki inceleme bekler',
    publishEligibleDefault: false,
    example: 'BBC Türkçe (ToS/robots inceleme öncesi)',
  },
  TITLE_LINK_ONLY: {
    allowedFields: [...TITLE_LINK_ONLY_ALLOWED_FIELDS],
    forbiddenFields: [...TITLE_LINK_ONLY_FORBIDDEN_FIELDS],
    productionIngest: 'yalnızca başlık + link-out metadata',
    publishEligibleDefault: true,
    example: 'NTV, Habertürk, TRT Haber (hedef)',
  },
  RSS_METADATA_ONLY: {
    allowedFields: ['title', 'shortDescription', 'canonicalUrl', 'sourceName', 'publishedAt', 'category'],
    forbiddenFields: ['body', 'fullText', 'contentHtml', 'rawHtml', 'articleText', 'scrapedText', 'image', 'video', 'audio', 'caption'],
    productionIngest: 'ToS/robots/lisans olumluysa kısa RSS metadata',
    publishEligibleDefault: true,
    example: 'Onaylı resmi feed (AFAD vb.)',
  },
  LICENSED: {
    allowedFields: ['title', 'shortDescription', 'canonicalUrl', 'sourceName', 'publishedAt'],
    forbiddenFields: ['body', 'fullText', 'contentHtml', 'rawHtml', 'articleText', 'scrapedText'],
    productionIngest: 'yazılı lisans kapsamında metadata; tam metin yine yasak',
    publishEligibleDefault: false,
    example: 'AA (kurumsal lisans active)',
  },
};
