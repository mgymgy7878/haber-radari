import type { SourceRegistryV0Document } from './source-registry-loader.js';
import { getSourceById } from './source-registry-loader.js';

/**
 * TITLE_LINK_ONLY kaynaklar için user-visible özet policy (backend cleanup v0).
 *
 * Not: Aktif legal guard binding değildir. Source Registry SSOT `legalMode` okunur;
 * runtime ingest (`rss-ingest`) değişmez — yalnızca smart-feed response sanitize edilir.
 */
export function isTitleLinkOnlySourceId(
  registry: SourceRegistryV0Document,
  sourceId: string | undefined,
): boolean {
  if (!sourceId) return false;
  const entry = getSourceById(registry, sourceId);
  return entry?.legalMode === 'TITLE_LINK_ONLY';
}

/** TITLE_LINK_ONLY ise boş string; aksi halde normalize edilmiş özet. */
export function suppressUserVisibleSummaryForSource(
  registry: SourceRegistryV0Document,
  sourceId: string | undefined,
  summary: string | undefined | null,
): string {
  if (isTitleLinkOnlySourceId(registry, sourceId)) {
    return '';
  }
  return summary?.trim() ? summary.trim() : '';
}
