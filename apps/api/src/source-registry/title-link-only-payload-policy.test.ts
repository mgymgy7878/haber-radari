import { describe, it, expect } from 'vitest';
import { loadSourceRegistryV0 } from './source-registry-loader.js';
import {
  isTitleLinkOnlySourceId,
  suppressUserVisibleSummaryForSource,
} from './title-link-only-payload-policy.js';

describe('title-link-only-payload-policy', () => {
  const registry = loadSourceRegistryV0();

  it('NTV TITLE_LINK_ONLY tanınır', () => {
    expect(isTitleLinkOnlySourceId(registry, 'ntv_son_dakika')).toBe(true);
  });

  it('Habertürk TITLE_LINK_ONLY tanınır', () => {
    expect(isTitleLinkOnlySourceId(registry, 'haberturk_ekonomi')).toBe(true);
  });

  it('AA DISABLED TITLE_LINK_ONLY değil', () => {
    expect(isTitleLinkOnlySourceId(registry, 'aa_guncel')).toBe(false);
  });

  it('NTV summary suppress → boş string', () => {
    expect(
      suppressUserVisibleSummaryForSource(registry, 'ntv_son_dakika', 'RSS özet metni'),
    ).toBe('');
  });

  it('Habertürk summary suppress → boş string', () => {
    expect(
      suppressUserVisibleSummaryForSource(registry, 'haberturk_ekonomi', 'Ekonomi özeti'),
    ).toBe('');
  });

  it('bilinmeyen sourceId summary korunur', () => {
    expect(
      suppressUserVisibleSummaryForSource(registry, 'unknown_source', 'Özet'),
    ).toBe('Özet');
  });

  it('whitespace-only summary non-TITLE_LINK_ONLY → boş', () => {
    expect(
      suppressUserVisibleSummaryForSource(registry, 'bbc_news', '   '),
    ).toBe('');
  });
});
