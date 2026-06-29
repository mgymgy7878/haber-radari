import { describe, it, expect } from 'vitest';
import { loadSourceRegistryV0, getSourceById } from './source-registry-loader.js';
import {
  getAllowedFieldsForLegalMode,
  getForbiddenFieldsForLegalMode,
  stripDisallowedFieldsForSource,
  assertNoForbiddenFields,
  LegalFieldGuardError,
} from './legal-field-guard.js';
import type { SourceRegistryEntry } from './source-registry-types.js';

describe('legal-field-guard', () => {
  const registry = loadSourceRegistryV0();
  const ntv = getSourceById(registry, 'ntv_son_dakika')!;
  const aa = getSourceById(registry, 'aa_guncel')!;
  const bbc = getSourceById(registry, 'bbc_turkce')!;
  const afad = getSourceById(registry, 'afad_official')!;

  it('TITLE_LINK_ONLY allowed/forbidden alanları döner', () => {
    expect(getAllowedFieldsForLegalMode(ntv)).toContain('title');
    expect(getForbiddenFieldsForLegalMode(ntv)).toContain('summary');
    expect(getForbiddenFieldsForLegalMode(ntv)).toContain('description');
  });

  it('TITLE_LINK_ONLY input summary/description/fullText strip edilir', () => {
    const input = {
      title: 'Başlık',
      canonicalUrl: 'https://ntv.com.tr/1',
      sourceName: 'NTV',
      publishedAt: '2026-06-28T10:00:00Z',
      category: 'Son Dakika',
      summary: 'yasak özet',
      description: 'yasak açıklama',
      fullText: 'yasak metin',
      rawHtml: '<p>x</p>',
      image: 'https://x/img.jpg',
      caption: 'alt yazı',
    };
    const stripped = stripDisallowedFieldsForSource(ntv, input);
    expect(stripped).toEqual({
      title: 'Başlık',
      canonicalUrl: 'https://ntv.com.tr/1',
      sourceName: 'NTV',
      publishedAt: '2026-06-28T10:00:00Z',
      category: 'Son Dakika',
    });
    expect(() => assertNoForbiddenFields(ntv, input)).toThrow(LegalFieldGuardError);
    expect(() =>
      assertNoForbiddenFields(ntv, {
        title: 'Başlık',
        canonicalUrl: 'https://ntv.com.tr/1',
        sourceName: 'NTV',
        publishedAt: '2026-06-28T10:00:00Z',
        category: 'Son Dakika',
      }),
    ).not.toThrow();
  });

  it('DISABLED kaynak boş payload üretir ve assert hata verir', () => {
    expect(stripDisallowedFieldsForSource(aa, { title: 'x', summary: 'y' })).toEqual({});
    expect(() => assertNoForbiddenFields(aa, { title: 'x' })).toThrow(/DISABLED/);
  });

  it('NEEDS_REVIEW production eligible değilse assert hata verir', () => {
    expect(() =>
      assertNoForbiddenFields(bbc, {
        title: 'Başlık',
        canonicalUrl: 'https://bbc.com/1',
        sourceName: 'BBC',
        publishedAt: '2026-06-28T10:00:00Z',
      }),
    ).toThrow(/NEEDS_REVIEW/);
  });

  it('RSS_METADATA_ONLY fullText/rawHtml/image/caption reddeder', () => {
    const input = {
      title: 'Afet',
      shortDescription: 'Kısa özet',
      canonicalUrl: 'https://afad.gov.tr/1',
      sourceName: 'AFAD',
      publishedAt: '2026-06-28T10:00:00Z',
      category: 'Afet',
      fullText: 'tam metin',
      rawHtml: '<p>x</p>',
      image: 'img',
      caption: 'cap',
    };
    const stripped = stripDisallowedFieldsForSource(afad, input);
    expect(stripped.fullText).toBeUndefined();
    expect(stripped.rawHtml).toBeUndefined();
    expect(stripped.shortDescription).toBe('Kısa özet');
    expect(() => assertNoForbiddenFields(afad, input)).toThrow(LegalFieldGuardError);
  });

  it('LICENSED kayıt sözleşme dışı field reddeder', () => {
    const licensed: SourceRegistryEntry = {
      sourceId: 'aa_licensed_test',
      sourceName: 'AA Licensed',
      baseDomain: 'aa.com.tr',
      legalMode: 'LICENSED',
      authorityTier: 'PRIMARY_WIRE_OR_AGENCY',
      reviewStatus: 'approved',
      publishEligible: true,
      licenseStatus: 'active',
      allowedFields: ['title', 'shortDescription', 'canonicalUrl', 'sourceName', 'publishedAt'],
      forbiddenFields: ['body', 'fullText', 'contentHtml', 'rawHtml', 'articleText', 'scrapedText'],
    };
    expect(() =>
      assertNoForbiddenFields(licensed, {
        title: 'Haber',
        shortDescription: 'Özet',
        canonicalUrl: 'https://aa.com.tr/1',
        sourceName: 'AA',
        publishedAt: '2026-06-28T10:00:00Z',
        fullText: 'yasak',
      }),
    ).toThrow(/Yasak alan|fullText/);
  });
});
