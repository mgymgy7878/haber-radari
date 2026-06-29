import type { SourceRegistryEntry } from './source-registry-types.js';
import {
  AGENCY_SOURCE_IDS,
  PRODUCTION_FORBIDDEN_FIELDS,
  RSS_METADATA_ONLY_ALLOWED_FIELDS,
  RSS_METADATA_ONLY_FORBIDDEN_FIELDS,
  TITLE_LINK_ONLY_ALLOWED_FIELDS,
  TITLE_LINK_ONLY_FORBIDDEN_FIELDS,
  TITLE_LINK_ONLY_SUMMARY_FIELDS,
} from './source-registry-types.js';
import {
  LEGAL_MODES,
  LICENSE_STATUSES,
  REVIEW_STATUSES,
  REQUIRED_SSOT_V0_FIELDS,
  type LegalMode,
} from './source-registry-schema.js';

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

export function validateSsotV0RequiredFields(entry: SourceRegistryEntry): ContractViolation[] {
  const violations: ContractViolation[] = [];

  for (const field of REQUIRED_SSOT_V0_FIELDS) {
    const value = entry[field as keyof SourceRegistryEntry];

    if (field === 'allowedFields') {
      if (!isStringArray(value)) {
        violations.push({
          sourceId: entry.sourceId,
          rule: 'ssot_required_fields',
          message: 'allowedFields zorunlu string dizisi olmalı',
        });
      } else if (value.length === 0 && entry.legalMode !== 'DISABLED') {
        violations.push({
          sourceId: entry.sourceId,
          rule: 'ssot_required_fields',
          message: 'allowedFields boş olamaz (DISABLED hariç)',
        });
      }
      continue;
    }

    if (field === 'forbiddenFields') {
      if (!isStringArray(value) || value.length === 0) {
        violations.push({
          sourceId: entry.sourceId,
          rule: 'ssot_required_fields',
          message: 'forbiddenFields zorunlu ve boş olmayan string dizisi olmalı',
        });
      }
      continue;
    }

    if (field === 'lastReviewedAt') {
      if (value !== null && typeof value !== 'string') {
        violations.push({
          sourceId: entry.sourceId,
          rule: 'ssot_required_fields',
          message: 'lastReviewedAt null veya ISO tarih string olmalı',
        });
      }
      continue;
    }

    if (field === 'publishEligible') {
      if (typeof value !== 'boolean') {
        violations.push({
          sourceId: entry.sourceId,
          rule: 'ssot_required_fields',
          message: 'publishEligible boolean olmalı',
        });
      }
      continue;
    }

    if (!isNonEmptyString(value)) {
      violations.push({
        sourceId: entry.sourceId,
        rule: 'ssot_required_fields',
        message: `${field} zorunlu`,
      });
    }
  }

  if (!LEGAL_MODES.includes(entry.legalMode)) {
    violations.push({
      sourceId: entry.sourceId,
      rule: 'legal_mode_enum',
      message: `Geçersiz legalMode: ${entry.legalMode}`,
    });
  }

  if (!REVIEW_STATUSES.includes(entry.reviewStatus)) {
    violations.push({
      sourceId: entry.sourceId,
      rule: 'review_status_enum',
      message: `Geçersiz reviewStatus: ${entry.reviewStatus}`,
    });
  }

  if (!LICENSE_STATUSES.includes(entry.licenseStatus)) {
    violations.push({
      sourceId: entry.sourceId,
      rule: 'license_status_enum',
      message: `Geçersiz licenseStatus: ${entry.licenseStatus}`,
    });
  }

  return violations;
}

/** @deprecated use validateSsotV0RequiredFields */
export function validateRequiredFields(entry: SourceRegistryEntry): ContractViolation[] {
  return validateSsotV0RequiredFields(entry);
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

  if (isAgency && entry.licenseStatus === 'none' && entry.legalMode !== 'DISABLED') {
    violations.push({
      sourceId: entry.sourceId,
      rule: 'agency_license_mode',
      message: 'Lisanssız ajans kaynağı DISABLED olmalı',
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

  for (const summaryField of TITLE_LINK_ONLY_SUMMARY_FIELDS) {
    if (entry.allowedFields.includes(summaryField)) {
      violations.push({
        sourceId: entry.sourceId,
        rule: 'title_link_only_no_summary',
        message: `TITLE_LINK_ONLY allowedFields içinde özet alanı olmamalı: ${summaryField}`,
      });
    }
  }

  return violations;
}

export function validateRssMetadataOnlyPolicy(entry: SourceRegistryEntry): ContractViolation[] {
  if (entry.legalMode !== 'RSS_METADATA_ONLY') {
    return [];
  }

  const violations: ContractViolation[] = [];

  for (const field of entry.allowedFields) {
    if (!RSS_METADATA_ONLY_ALLOWED_FIELDS.has(field)) {
      violations.push({
        sourceId: entry.sourceId,
        rule: 'rss_metadata_only_allowed',
        message: `RSS_METADATA_ONLY allowedFields içinde izin verilmeyen alan: ${field}`,
      });
    }
  }

  for (const forbidden of RSS_METADATA_ONLY_FORBIDDEN_FIELDS) {
    if (!entry.forbiddenFields.includes(forbidden)) {
      violations.push({
        sourceId: entry.sourceId,
        rule: 'rss_metadata_only_forbidden',
        message: `RSS_METADATA_ONLY forbiddenFields içinde ${forbidden} zorunlu`,
      });
    }
  }

  return violations;
}

export function validateLicensedPolicy(entry: SourceRegistryEntry): ContractViolation[] {
  if (entry.legalMode !== 'LICENSED') {
    return [];
  }

  const violations: ContractViolation[] = [];

  if (!entry.licenseStatus) {
    violations.push({
      sourceId: entry.sourceId,
      rule: 'licensed_license_status',
      message: 'LICENSED kaynak licenseStatus taşımalı',
    });
  }

  return violations;
}

export function validateProductionForbiddenFields(entry: SourceRegistryEntry): ContractViolation[] {
  const violations: ContractViolation[] = [];

  for (const forbidden of PRODUCTION_FORBIDDEN_FIELDS) {
    if (!entry.forbiddenFields.includes(forbidden)) {
      violations.push({
        sourceId: entry.sourceId,
        rule: 'production_forbidden_fields',
        message: `forbiddenFields içinde ${forbidden} zorunlu`,
      });
    }
  }

  const overlap = entry.allowedFields.filter((field) =>
    entry.forbiddenFields.includes(field),
  );
  if (overlap.length > 0) {
    violations.push({
      sourceId: entry.sourceId,
      rule: 'allowed_forbidden_overlap',
      message: `allowedFields ile forbiddenFields çakışmamalı: ${overlap.join(', ')}`,
    });
  }

  const forbiddenInAllowed = entry.allowedFields.filter((field) =>
    (PRODUCTION_FORBIDDEN_FIELDS as readonly string[]).includes(field),
  );
  if (forbiddenInAllowed.length > 0) {
    violations.push({
      sourceId: entry.sourceId,
      rule: 'forbidden_in_allowed',
      message: `Production yasak alan allowedFields içinde olmamalı: ${forbiddenInAllowed.join(', ')}`,
    });
  }

  return violations;
}

export function validateLegalModeContract(entry: SourceRegistryEntry): ContractViolation[] {
  return [
    ...validateSsotV0RequiredFields(entry),
    ...validatePublishEligibility(entry),
    ...validateTitleLinkOnlyPolicy(entry),
    ...validateRssMetadataOnlyPolicy(entry),
    ...validateLicensedPolicy(entry),
    ...validateProductionForbiddenFields(entry),
  ];
}

export function validateRegistry(entries: SourceRegistryEntry[]): ContractViolation[] {
  return entries.flatMap((entry) => validateLegalModeContract(entry));
}

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
    example: 'NTV, Habertürk',
  },
  RSS_METADATA_ONLY: {
    allowedFields: [...RSS_METADATA_ONLY_ALLOWED_FIELDS],
    forbiddenFields: [...RSS_METADATA_ONLY_FORBIDDEN_FIELDS],
    productionIngest: 'ToS/robots/lisans olumluysa kısa RSS metadata',
    publishEligibleDefault: true,
    example: 'Onaylı resmi feed (AFAD vb.)',
  },
  LICENSED: {
    allowedFields: ['title', 'shortDescription', 'canonicalUrl', 'sourceName', 'publishedAt'],
    forbiddenFields: [...PRODUCTION_FORBIDDEN_FIELDS],
    productionIngest: 'yazılı lisans kapsamında metadata; tam metin yine yasak',
    publishEligibleDefault: false,
    example: 'AA (kurumsal lisans active)',
  },
};
