import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { SourceRegistryEntry } from './source-registry-types.js';

export interface SourceRegistryV0Document {
  version: 'v0';
  readOnly: true;
  disclaimer: string;
  sources: SourceRegistryEntry[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_SOURCE_REGISTRY_V0_PATH = join(__dirname, 'source-registry-v0.json');

export function parseSourceRegistryV0(raw: string): SourceRegistryV0Document {
  const parsed = JSON.parse(raw) as SourceRegistryV0Document;
  if (parsed.version !== 'v0') {
    throw new Error(`Beklenmeyen registry sürümü: ${String(parsed.version)}`);
  }
  if (!Array.isArray(parsed.sources)) {
    throw new Error('Registry sources dizisi zorunlu');
  }
  return parsed;
}

/** Read-only SSOT loader — production ingest/publish'e bağlı değildir. */
export function loadSourceRegistryV0(
  filePath: string = DEFAULT_SOURCE_REGISTRY_V0_PATH,
): SourceRegistryV0Document {
  const raw = readFileSync(filePath, 'utf-8');
  return parseSourceRegistryV0(raw);
}

export function getSourceById(
  registry: SourceRegistryV0Document,
  sourceId: string,
): SourceRegistryEntry | undefined {
  return registry.sources.find((s) => s.sourceId === sourceId);
}

export function listPublishEligibleSources(
  registry: SourceRegistryV0Document,
): SourceRegistryEntry[] {
  return registry.sources.filter((s) => s.publishEligible);
}
