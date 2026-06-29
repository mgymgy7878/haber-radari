import { describe, it, expect } from 'vitest';
import {
  loadSourceRegistryV0,
  getSourceById,
  listPublishEligibleSources,
  parseSourceRegistryV0,
} from './source-registry-loader.js';
import {
  validateSourceRegistryV0,
  assertValidSourceRegistryV0,
} from './source-registry-validator.js';

describe('source-registry-v0 loader', () => {
  const registry = loadSourceRegistryV0();

  it('JSON parse olur ve v0 sürümünü taşır', () => {
    expect(registry.version).toBe('v0');
    expect(registry.readOnly).toBe(true);
    expect(registry.sources.length).toBeGreaterThan(0);
  });

  it('sourceId benzersiz', () => {
    const ids = registry.sources.map((s) => s.sourceId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tüm kayıtlar validator’dan geçer', () => {
    const issues = validateSourceRegistryV0(registry);
    expect(issues).toEqual([]);
    expect(() => assertValidSourceRegistryV0(registry)).not.toThrow();
  });

  it('aa_guncel DISABLED ve publishEligible=false', () => {
    const aa = getSourceById(registry, 'aa_guncel');
    expect(aa?.legalMode).toBe('DISABLED');
    expect(aa?.publishEligible).toBe(false);
    expect(aa?.licenseStatus).toBe('none');
  });

  it('bbc_turkce NEEDS_REVIEW ve publishEligible=false', () => {
    const bbc = getSourceById(registry, 'bbc_turkce');
    expect(bbc?.legalMode).toBe('NEEDS_REVIEW');
    expect(bbc?.publishEligible).toBe(false);
  });

  it('NTV/Habertürk TITLE_LINK_ONLY', () => {
    for (const id of ['ntv_son_dakika', 'ntv_turkiye', 'haberturk', 'haberturk_ekonomi']) {
      const entry = getSourceById(registry, id);
      expect(entry?.legalMode).toBe('TITLE_LINK_ONLY');
      expect(entry?.forbiddenFields).toContain('summary');
      expect(entry?.forbiddenFields).toContain('description');
    }
  });

  it('resmi omurga kaynakları RSS_METADATA_ONLY', () => {
    for (const id of ['afad_official', 'tcmb', 'kap', 'usgs', 'emsc']) {
      const entry = getSourceById(registry, id);
      expect(entry?.legalMode).toBe('RSS_METADATA_ONLY');
      expect(entry?.authorityTier).toBe('OFFICIAL');
    }
  });

  it('publishEligible kaynaklar DISABLED/NEEDS_REVIEW değil', () => {
    const eligible = listPublishEligibleSources(registry);
    for (const entry of eligible) {
      expect(entry.legalMode).not.toBe('DISABLED');
      expect(entry.legalMode).not.toBe('NEEDS_REVIEW');
    }
  });

  it('parseSourceRegistryV0 geçersiz sürümü reddeder', () => {
    expect(() =>
      parseSourceRegistryV0(JSON.stringify({ version: 'v99', sources: [] })),
    ).toThrow(/sürüm/);
  });
});

describe('source-registry-v0 drift snapshot', () => {
  const registry = loadSourceRegistryV0();

  it('7 mevcut kaynak hedef kararları korunur', () => {
    const targets: Record<string, string> = {
      aa_guncel: 'DISABLED',
      trt_haber: 'NEEDS_REVIEW',
      ntv_son_dakika: 'TITLE_LINK_ONLY',
      haberturk_ekonomi: 'TITLE_LINK_ONLY',
      ntv_turkiye: 'TITLE_LINK_ONLY',
      bbc_turkce: 'NEEDS_REVIEW',
      haberturk: 'TITLE_LINK_ONLY',
    };
    for (const [id, mode] of Object.entries(targets)) {
      expect(getSourceById(registry, id)?.legalMode).toBe(mode);
    }
  });
});
