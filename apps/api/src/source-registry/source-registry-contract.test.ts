import { describe, it, expect } from 'vitest';
import { RSS_SOURCES } from '../config/rss-sources.js';
import type { SourceRegistryEntry } from './source-registry-types.js';
import {
  AGENCY_SOURCE_IDS,
  TITLE_LINK_ONLY_FORBIDDEN_FIELDS,
  TITLE_LINK_ONLY_ALLOWED_FIELDS,
} from './source-registry-types.js';
import {
  validateLegalModeContract,
  validateRegistry,
  LEGAL_MODE_CONTRACT,
} from './source-registry-contract.js';
import { getSourceById, loadSourceRegistryV0 } from './source-registry-loader.js';
import { loadContractFixtureCases } from './source-registry-fixtures.js';

describe('source-registry SSOT v0 contract', () => {
  const fixtures = loadContractFixtureCases();

  it('fixture dosyası boş değil', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  it('tüm fixture kayıtları contract kurallarını geçer', () => {
    const violations = validateRegistry(fixtures);
    expect(violations).toEqual([]);
  });

  it('her fixture zorunlu alanları taşır', () => {
    for (const entry of fixtures) {
      expect(entry.sourceId).toBeTruthy();
      expect(entry.sourceName).toBeTruthy();
      expect(entry.baseDomain).toBeTruthy();
      expect(entry.legalMode).toBeTruthy();
      expect(entry.authorityTier).toBeTruthy();
      expect(entry.reviewStatus).toBeTruthy();
      expect(typeof entry.publishEligible).toBe('boolean');
      expect(Array.isArray(entry.allowedFields)).toBe(true);
      if (entry.legalMode !== 'DISABLED') {
        expect(entry.allowedFields.length).toBeGreaterThan(0);
      }
      expect(entry.forbiddenFields.length).toBeGreaterThan(0);
    }
  });

  describe('legalMode publish eligibility', () => {
    it('DISABLED → publishEligible=false', () => {
      const disabled = fixtures.filter((f) => f.legalMode === 'DISABLED');
      expect(disabled.length).toBeGreaterThan(0);
      for (const entry of disabled) {
        expect(entry.publishEligible).toBe(false);
      }
    });

    it('NEEDS_REVIEW → publishEligible=false', () => {
      const pending = fixtures.filter((f) => f.legalMode === 'NEEDS_REVIEW');
      expect(pending.length).toBeGreaterThan(0);
      for (const entry of pending) {
        expect(entry.publishEligible).toBe(false);
      }
    });

    it('LICENSED + licenseStatus!=active → publishEligible=false', () => {
      const licensedInactive = fixtures.filter(
        (f) => f.legalMode === 'LICENSED' && f.licenseStatus !== 'active',
      );
      expect(licensedInactive.length).toBeGreaterThan(0);
      for (const entry of licensedInactive) {
        expect(entry.publishEligible).toBe(false);
      }
    });
  });

  describe('TITLE_LINK_ONLY field policy', () => {
    const titleLinkOnly = () => fixtures.filter((f) => f.legalMode === 'TITLE_LINK_ONLY');

    it('allowedFields yalnızca izinli alanları içerir', () => {
      for (const entry of titleLinkOnly()) {
        for (const field of entry.allowedFields) {
          expect(TITLE_LINK_ONLY_ALLOWED_FIELDS.has(field)).toBe(true);
        }
      }
    });

    it('forbiddenFields zorunlu yasak alanları içerir', () => {
      for (const entry of titleLinkOnly()) {
        for (const forbidden of TITLE_LINK_ONLY_FORBIDDEN_FIELDS) {
          expect(entry.forbiddenFields).toContain(forbidden);
        }
      }
    });
  });

  describe('ajans lisans politikası', () => {
    const agencyIds = ['aa_guncel', 'dha', 'iha', 'anka', 'reuters', 'ap', 'afp'];

    it('lisanssız ajans fixture publishEligible=false', () => {
      for (const id of agencyIds) {
        const agencyFixtures = fixtures.filter(
          (f) => f.sourceId === id && f.licenseStatus !== 'active',
        );
        expect(agencyFixtures.length).toBeGreaterThan(0);
        for (const entry of agencyFixtures) {
          expect(entry.publishEligible).toBe(false);
        }
      }
    });

    it('AGENCY_SOURCE_IDS kümesi ajans id’lerini kapsar', () => {
      for (const id of agencyIds) {
        expect(AGENCY_SOURCE_IDS.has(id)).toBe(true);
      }
    });
  });

  describe('legalMode sözlüğü', () => {
    it('tüm modlar tanımlı', () => {
      const modes = ['DISABLED', 'NEEDS_REVIEW', 'TITLE_LINK_ONLY', 'RSS_METADATA_ONLY', 'LICENSED'];
      for (const mode of modes) {
        expect(LEGAL_MODE_CONTRACT[mode as keyof typeof LEGAL_MODE_CONTRACT]).toBeDefined();
      }
    });
  });
});

describe('source-registry runtime drift snapshot (read-only)', () => {
  it('mevcut API RSS_SOURCES legalMode alanı taşımıyor (bilinen borç)', () => {
    for (const source of RSS_SOURCES) {
      expect(source).not.toHaveProperty('legalMode');
      expect(source).not.toHaveProperty('publishEligible');
      expect(source).not.toHaveProperty('allowedFields');
    }
  });

  it('mevcut API kaynak sayısı fixture hedef kümesinden küçük (drift)', () => {
    const fixtureIds = new Set(loadContractFixtureCases().map((f) => f.sourceId));
    const apiIds = RSS_SOURCES.map((s) => s.id);
    expect(apiIds.length).toBe(4);
    expect(fixtureIds.has('bbc_turkce')).toBe(true);
    expect(fixtureIds.has('ntv_turkiye')).toBe(true);
    expect(apiIds).not.toContain('bbc_turkce');
    expect(apiIds).not.toContain('ntv_turkiye');
  });

  it('aa_guncel runtime enabled=false — registry DISABLED ile uyumlu', () => {
    const aa = RSS_SOURCES.find((s) => s.id === 'aa_guncel');
    expect(aa?.enabled).toBe(false);
    expect(aa?.disabledReason).toBe('registry_legal_mode_disabled_no_license');
    const target = loadContractFixtureCases().find(
      (f) => f.sourceId === 'aa_guncel' && f.legalMode === 'DISABLED',
    );
    expect(target?.publishEligible).toBe(false);
  });

  it('trt_haber runtime enabled=false — registry NEEDS_REVIEW ile uyumlu', () => {
    const trt = RSS_SOURCES.find((s) => s.id === 'trt_haber');
    expect(trt?.enabled).toBe(false);
    expect(trt?.disabledReason).toBe('registry_needs_review_pending');
    const target = getSourceById(loadSourceRegistryV0(), 'trt_haber');
    expect(target?.legalMode).toBe('NEEDS_REVIEW');
    expect(target?.publishEligible).toBe(false);
  });
});

describe('source-registry contract negative cases', () => {
  it('geçersiz DISABLED + publishEligible=true yakalanır', () => {
    const bad: SourceRegistryEntry = {
      sourceId: 'bad_disabled',
      sourceName: 'Bad',
      sourceType: 'news_media',
      baseDomain: 'bad.example',
      legalMode: 'DISABLED',
      authorityTier: 'UNKNOWN',
      reviewStatus: 'pending',
      publishEligible: true,
      allowedFields: [],
      forbiddenFields: ['summary', 'body', 'fullText', 'contentHtml', 'rawHtml', 'articleText', 'scrapedText', 'image', 'video', 'audio', 'caption', 'ocrText', 'videoTranscript', 'aiSummary', 'shortDescription', 'description'],
      licenseStatus: 'none',
      notes: 'negative test',
      lastReviewedAt: null,
    };
    const violations = validateLegalModeContract(bad);
    expect(violations.some((v) => v.rule === 'publish_eligibility')).toBe(true);
  });

  it('geçersiz TITLE_LINK_ONLY summary allowed yakalanır', () => {
    const bad: SourceRegistryEntry = {
      sourceId: 'bad_title_link',
      sourceName: 'Bad Media',
      sourceType: 'COMMERCIAL_MEDIA',
      baseDomain: 'bad.example',
      legalMode: 'TITLE_LINK_ONLY',
      authorityTier: 'ESTABLISHED_MEDIA',
      reviewStatus: 'approved',
      publishEligible: true,
      allowedFields: ['title', 'summary'],
      forbiddenFields: ['body', 'fullText', 'contentHtml', 'rawHtml', 'articleText', 'scrapedText', 'image', 'video', 'audio', 'caption', 'ocrText', 'videoTranscript', 'aiSummary', 'shortDescription', 'description'],
      licenseStatus: 'none',
      notes: 'negative test',
      lastReviewedAt: null,
    };
    const violations = validateLegalModeContract(bad);
    expect(violations.length).toBeGreaterThan(0);
  });
});
