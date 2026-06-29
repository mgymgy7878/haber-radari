import type { SourceRegistryEntry } from './source-registry-types.js';
import { LEGAL_MODE_CONTRACT } from './source-registry-contract.js';

export type LegalFieldPayload = Record<string, unknown>;

export class LegalFieldGuardError extends Error {
  constructor(
    message: string,
    readonly sourceId?: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = 'LegalFieldGuardError';
  }
}

export function getAllowedFieldsForLegalMode(record: SourceRegistryEntry): string[] {
  if (record.allowedFields.length > 0) {
    return [...record.allowedFields];
  }
  return [...LEGAL_MODE_CONTRACT[record.legalMode].allowedFields];
}

export function getForbiddenFieldsForLegalMode(record: SourceRegistryEntry): string[] {
  if (record.forbiddenFields.length > 0) {
    return [...record.forbiddenFields];
  }
  return [...LEGAL_MODE_CONTRACT[record.legalMode].forbiddenFields];
}

export function stripDisallowedFieldsForSource(
  record: SourceRegistryEntry,
  input: LegalFieldPayload,
): LegalFieldPayload {
  if (record.legalMode === 'DISABLED') {
    return {};
  }

  const allowed = new Set(getAllowedFieldsForLegalMode(record));
  const result: LegalFieldPayload = {};

  for (const [key, value] of Object.entries(input)) {
    if (allowed.has(key)) {
      result[key] = value;
    }
  }

  return result;
}

export function assertNoForbiddenFields(
  record: SourceRegistryEntry,
  input: LegalFieldPayload,
): void {
  if (record.legalMode === 'DISABLED') {
    throw new LegalFieldGuardError(
      'DISABLED kaynak publish edilemez',
      record.sourceId,
    );
  }

  if (record.legalMode === 'NEEDS_REVIEW' && !record.publishEligible) {
    throw new LegalFieldGuardError(
      'NEEDS_REVIEW kaynak production publish eligible değil',
      record.sourceId,
    );
  }

  if (record.legalMode === 'LICENSED' && record.licenseStatus !== 'active') {
    throw new LegalFieldGuardError(
      'LICENSED kaynak licenseStatus=active olmadan publish edilemez',
      record.sourceId,
    );
  }

  const forbidden = new Set(getForbiddenFieldsForLegalMode(record));
  if (forbidden.has('*')) {
    if (Object.keys(input).length > 0) {
      throw new LegalFieldGuardError(
        'DISABLED kaynak için alan taşınamaz',
        record.sourceId,
      );
    }
    return;
  }

  for (const key of Object.keys(input)) {
    if (forbidden.has(key)) {
      throw new LegalFieldGuardError(
        `Yasak alan: ${key}`,
        record.sourceId,
        key,
      );
    }
  }

  const allowed = new Set(getAllowedFieldsForLegalMode(record));
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) {
      throw new LegalFieldGuardError(
        `Sözleşme dışı alan: ${key}`,
        record.sourceId,
        key,
      );
    }
  }
}
