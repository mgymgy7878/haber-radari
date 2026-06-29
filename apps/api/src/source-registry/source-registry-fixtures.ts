import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { LegalMode } from './source-registry-schema.js';
import type { SourceRegistryEntry } from './source-registry-types.js';
import {
  DEFAULT_SOURCE_REGISTRY_V0_PATH,
  loadSourceRegistryV0,
  type SourceRegistryV0Document,
} from './source-registry-loader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const CONTRACT_FIXTURE_CASES_PATH = join(
  __dirname,
  'fixtures',
  'source-registry-contract-cases.json',
);

/** Contract test senaryoları — çoklu legalMode varyantları içerebilir */
export function loadContractFixtureCases(): SourceRegistryEntry[] {
  const raw = readFileSync(CONTRACT_FIXTURE_CASES_PATH, 'utf-8');
  return JSON.parse(raw) as SourceRegistryEntry[];
}

/** Production SSOT fixture (read-only JSON) */
export function loadProductionRegistryFixture(
  filePath: string = DEFAULT_SOURCE_REGISTRY_V0_PATH,
): SourceRegistryV0Document {
  return loadSourceRegistryV0(filePath);
}

export function summarizeLegalModeDistribution(
  entries: SourceRegistryEntry[],
): Record<LegalMode, number> {
  const counts: Record<LegalMode, number> = {
    DISABLED: 0,
    NEEDS_REVIEW: 0,
    TITLE_LINK_ONLY: 0,
    RSS_METADATA_ONLY: 0,
    LICENSED: 0,
  };
  for (const entry of entries) {
    counts[entry.legalMode] += 1;
  }
  return counts;
}
