import type { SourceRegistryEntry } from './source-registry-types.js';
import {
  validateLegalModeContract,
  type ContractViolation,
} from './source-registry-contract.js';
import type { SourceRegistryV0Document } from './source-registry-loader.js';

export interface RegistryValidationIssue {
  sourceId: string;
  rule: string;
  message: string;
}

function toIssue(v: ContractViolation): RegistryValidationIssue {
  return { sourceId: v.sourceId, rule: v.rule, message: v.message };
}

export function validateSourceRegistryEntry(entry: SourceRegistryEntry): RegistryValidationIssue[] {
  return validateLegalModeContract(entry).map(toIssue);
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
