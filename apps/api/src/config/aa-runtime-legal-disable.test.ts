import { describe, it, expect } from 'vitest';
import { RSS_SOURCES } from './rss-sources.js';
import { getSourceById, loadSourceRegistryV0 } from '../source-registry/source-registry-loader.js';

const registry = loadSourceRegistryV0();

describe('aa runtime legal disable v0', () => {
  it('aa_guncel enabled ingest listesinde değil', () => {
    const enabledIds = RSS_SOURCES.filter((s) => s.enabled).map((s) => s.id);
    expect(enabledIds).not.toContain('aa_guncel');
    expect(enabledIds).toHaveLength(3);
  });

  it('aa_guncel disabledReason registry DISABLED ile uyumlu', () => {
    const aaRuntime = RSS_SOURCES.find((s) => s.id === 'aa_guncel');
    const aaRegistry = getSourceById(registry, 'aa_guncel');
    expect(aaRuntime?.enabled).toBe(false);
    expect(aaRuntime?.disabledReason).toBe('registry_legal_mode_disabled_no_license');
    expect(aaRegistry?.legalMode).toBe('DISABLED');
    expect(aaRegistry?.publishEligible).toBe(false);
  });

  it('diğer runtime kaynakları enabled kalır', () => {
    for (const id of ['trt_haber', 'ntv_son_dakika', 'haberturk_ekonomi']) {
      expect(RSS_SOURCES.find((s) => s.id === id)?.enabled).toBe(true);
    }
  });
});
