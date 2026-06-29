import { describe, it, expect } from 'vitest';
import { RSS_SOURCES } from './rss-sources.js';
import { getSourceById, loadSourceRegistryV0 } from '../source-registry/source-registry-loader.js';

const registry = loadSourceRegistryV0();

describe('trt runtime legal disable v0', () => {
  it('trt_haber enabled ingest listesinde değil', () => {
    const enabledIds = RSS_SOURCES.filter((s) => s.enabled).map((s) => s.id);
    expect(enabledIds).not.toContain('trt_haber');
    expect(enabledIds).toHaveLength(2);
    expect(enabledIds).toEqual(
      expect.arrayContaining(['ntv_son_dakika', 'haberturk_ekonomi']),
    );
  });

  it('trt_haber disabledReason registry NEEDS_REVIEW ile uyumlu', () => {
    const trtRuntime = RSS_SOURCES.find((s) => s.id === 'trt_haber');
    const trtRegistry = getSourceById(registry, 'trt_haber');
    expect(trtRuntime?.enabled).toBe(false);
    expect(trtRuntime?.disabledReason).toBe('registry_needs_review_pending');
    expect(trtRegistry?.legalMode).toBe('NEEDS_REVIEW');
    expect(trtRegistry?.publishEligible).toBe(false);
    expect(trtRegistry?.reviewStatus).toBe('pending');
  });

  it('aa_guncel ve trt_haber disabled; ntv/haberturk enabled', () => {
    expect(RSS_SOURCES.find((s) => s.id === 'aa_guncel')?.enabled).toBe(false);
    expect(RSS_SOURCES.find((s) => s.id === 'trt_haber')?.enabled).toBe(false);
    for (const id of ['ntv_son_dakika', 'haberturk_ekonomi']) {
      expect(RSS_SOURCES.find((s) => s.id === id)?.enabled).toBe(true);
    }
  });
});
