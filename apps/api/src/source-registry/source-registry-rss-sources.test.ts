import { describe, it, expect } from 'vitest';
import { RSS_SOURCES } from '../config/rss-sources.js';
import { loadSourceRegistryV0 } from './source-registry-loader.js';
import {
  API_RSS_RUNTIME_SOURCE_IDS,
  RSS_SOURCES_PARITY_SNAPSHOT_V0,
  buildApiRssSourcesFromRegistry,
  deriveApiRssSourcesFromRegistry,
  getApiRssSourceLegalMode,
} from './source-registry-rss-sources.js';

describe('source-registry-rss-sources derivation v0', () => {
  const registry = loadSourceRegistryV0();
  const derived = deriveApiRssSourcesFromRegistry(registry);
  const publicConfigs = buildApiRssSourcesFromRegistry(registry);

  it('parity: derived output matches pre-migration snapshot', () => {
    expect(publicConfigs).toEqual(RSS_SOURCES_PARITY_SNAPSHOT_V0);
    expect(RSS_SOURCES).toEqual(RSS_SOURCES_PARITY_SNAPSHOT_V0);
  });

  it('yalnızca 4 API RSS kaynağı — registry 21 kaynağın tamamı değil', () => {
    expect(publicConfigs).toHaveLength(4);
    expect(registry.sources.length).toBeGreaterThan(publicConfigs.length);
    expect(registry.sources.length).toBe(21);
    expect(publicConfigs.map((s) => s.id).sort()).toEqual(
      [...API_RSS_RUNTIME_SOURCE_IDS].sort(),
    );
  });

  it('aktif kaynak seti değişmedi: NTV + Habertürk', () => {
    const enabledIds = publicConfigs.filter((s) => s.enabled).map((s) => s.id);
    expect(enabledIds).toEqual(['ntv_son_dakika', 'haberturk_ekonomi']);
  });

  it('DISABLED kaynak runtime ingest listesinde pasif', () => {
    const aa = publicConfigs.find((s) => s.id === 'aa_guncel');
    expect(aa?.enabled).toBe(false);
    expect(aa?.disabledReason).toBe('registry_legal_mode_disabled_no_license');
    expect(getApiRssSourceLegalMode('aa_guncel', registry)).toBe('DISABLED');
  });

  it('NEEDS_REVIEW kaynak runtime ingest listesinde pasif', () => {
    const trt = publicConfigs.find((s) => s.id === 'trt_haber');
    expect(trt?.enabled).toBe(false);
    expect(trt?.disabledReason).toBe('registry_needs_review_pending');
    expect(getApiRssSourceLegalMode('trt_haber', registry)).toBe('NEEDS_REVIEW');
  });

  it('NTV/Habertürk legalMode TITLE_LINK_ONLY registry’den okunur', () => {
    expect(getApiRssSourceLegalMode('ntv_son_dakika', registry)).toBe('TITLE_LINK_ONLY');
    expect(getApiRssSourceLegalMode('haberturk_ekonomi', registry)).toBe('TITLE_LINK_ONLY');
    expect(derived.find((s) => s.id === 'ntv_son_dakika')?.legalMode).toBe('TITLE_LINK_ONLY');
    expect(derived.find((s) => s.id === 'haberturk_ekonomi')?.legalMode).toBe('TITLE_LINK_ONLY');
  });

  it('RSS_METADATA_ONLY resmi kaynaklar otomatik runtime listesine girmez', () => {
    const runtimeIds = new Set(publicConfigs.map((s) => s.id));
    for (const officialId of ['afad_official', 'tcmb', 'kap', 'usgs']) {
      expect(runtimeIds.has(officialId)).toBe(false);
      const entry = registry.sources.find((s) => s.sourceId === officialId);
      expect(entry?.legalMode).toBe('RSS_METADATA_ONLY');
      expect(entry?.publishEligible).toBe(true);
    }
  });

  it('public RssSourceConfig shape geriye dönük — legalMode strip', () => {
    for (const config of publicConfigs) {
      expect(config).not.toHaveProperty('legalMode');
      expect(config).not.toHaveProperty('registrySourceId');
      expect(config.id).toBeTruthy();
      expect(config.url).toMatch(/^https?:\/\//);
      expect(typeof config.enabled).toBe('boolean');
    }
  });

  it('publishEligible=true olan registry kaynakları otomatik enable edilmez', () => {
    const runtimeIds = new Set(publicConfigs.map((s) => s.id));
    const publishEligibleNotInRuntime = registry.sources.filter(
      (s) => s.publishEligible && !runtimeIds.has(s.sourceId),
    );
    expect(publishEligibleNotInRuntime.length).toBeGreaterThan(0);
    for (const entry of publishEligibleNotInRuntime) {
      expect(publicConfigs.find((s) => s.id === entry.sourceId)?.enabled).not.toBe(true);
    }
  });
});
