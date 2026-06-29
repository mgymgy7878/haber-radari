import { describe, it, expect } from 'vitest';
import {
  AGENCY_SOURCE_IDS,
  PRODUCTION_FORBIDDEN_FIELDS,
  TITLE_LINK_ONLY_ALLOWED_FIELDS,
  TITLE_LINK_ONLY_FORBIDDEN_FIELDS,
  TITLE_LINK_ONLY_SUMMARY_FIELDS,
} from './source-registry-types.js';
import {
  LEGAL_MODES,
  REQUIRED_SSOT_V0_FIELDS,
} from './source-registry-schema.js';
import {
  validateLegalModeContract,
  validateRegistry,
  LEGAL_MODE_CONTRACT,
} from './source-registry-contract.js';
import {
  loadContractFixtureCases,
  loadProductionRegistryFixture,
  summarizeLegalModeDistribution,
} from './source-registry-fixtures.js';
import { getSourceById } from './source-registry-loader.js';
import { validateSourceRegistryV0 } from './source-registry-validator.js';

describe('source registry SSOT v0 schema contract', () => {
  const contractCases = loadContractFixtureCases();
  const production = loadProductionRegistryFixture();

  it('schema zorunlu alan listesi tanımlı', () => {
    expect(REQUIRED_SSOT_V0_FIELDS).toContain('sourceId');
    expect(REQUIRED_SSOT_V0_FIELDS).toContain('legalMode');
    expect(REQUIRED_SSOT_V0_FIELDS).toContain('licenseStatus');
    expect(REQUIRED_SSOT_V0_FIELDS).toContain('lastReviewedAt');
    expect(REQUIRED_SSOT_V0_FIELDS.length).toBeGreaterThanOrEqual(12);
  });

  it('legalMode enum değerleri schema ile uyumlu', () => {
    expect(LEGAL_MODES).toEqual([
      'DISABLED',
      'NEEDS_REVIEW',
      'TITLE_LINK_ONLY',
      'RSS_METADATA_ONLY',
      'LICENSED',
    ]);
  });

  it('production forbidden fields listesi tam', () => {
    expect(PRODUCTION_FORBIDDEN_FIELDS).toContain('body');
    expect(PRODUCTION_FORBIDDEN_FIELDS).toContain('ocrText');
    expect(PRODUCTION_FORBIDDEN_FIELDS).toContain('videoTranscript');
  });

  describe('contract fixture cases', () => {
    it('tüm contract fixture kayıtları geçer', () => {
      expect(validateRegistry(contractCases)).toEqual([]);
    });

    it('legalMode boş olamaz', () => {
      for (const entry of contractCases) {
        expect(entry.legalMode).toBeTruthy();
        expect(LEGAL_MODES).toContain(entry.legalMode);
      }
    });

    it('DISABLED ve NEEDS_REVIEW publishEligible=false', () => {
      for (const entry of contractCases) {
        if (entry.legalMode === 'DISABLED' || entry.legalMode === 'NEEDS_REVIEW') {
          expect(entry.publishEligible).toBe(false);
        }
      }
    });

    it('TITLE_LINK_ONLY özet alanları allowedFields içinde değil', () => {
      const titleLink = contractCases.filter((e) => e.legalMode === 'TITLE_LINK_ONLY');
      expect(titleLink.length).toBeGreaterThan(0);
      for (const entry of titleLink) {
        for (const field of TITLE_LINK_ONLY_SUMMARY_FIELDS) {
          expect(entry.allowedFields).not.toContain(field);
        }
      }
    });

    it('lisanssız ajans DISABLED ve publishEligible=false', () => {
      for (const id of AGENCY_SOURCE_IDS) {
        const agency = contractCases.filter(
          (e) => e.sourceId === id && e.licenseStatus !== 'active',
        );
        expect(agency.length).toBeGreaterThan(0);
        for (const entry of agency) {
          expect(entry.publishEligible).toBe(false);
          if (entry.legalMode !== 'LICENSED') {
            expect(entry.legalMode).toBe('DISABLED');
          }
        }
      }
    });

    it('NTV/Habertürk TITLE_LINK_ONLY', () => {
      for (const id of ['ntv_son_dakika', 'haberturk_ekonomi', 'haberturk', 'ntv_turkiye']) {
        const entry = contractCases.find((e) => e.sourceId === id && e.legalMode === 'TITLE_LINK_ONLY');
        expect(entry).toBeDefined();
      }
    });
  });

  describe('production registry fixture (source-registry-v0.json)', () => {
    it('kayıt sayısı > 0 ve benzersiz sourceId', () => {
      expect(production.sources.length).toBeGreaterThan(0);
      const ids = production.sources.map((s) => s.sourceId);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('tüm production kayıtları validator’dan geçer', () => {
      expect(validateSourceRegistryV0(production)).toEqual([]);
    });

    it('legalMode dağılımı özetlenebilir', () => {
      const dist = summarizeLegalModeDistribution(production.sources);
      expect(dist.TITLE_LINK_ONLY).toBeGreaterThan(0);
      expect(dist.DISABLED).toBeGreaterThan(0);
      expect(dist.RSS_METADATA_ONLY).toBeGreaterThan(0);
    });

    it('NTV/Habertürk production fixture TITLE_LINK_ONLY (PR #41 uyumu)', () => {
      for (const id of ['ntv_son_dakika', 'haberturk_ekonomi']) {
        const entry = getSourceById(production, id);
        expect(entry?.legalMode).toBe('TITLE_LINK_ONLY');
        expect(entry?.forbiddenFields).toContain('aiSummary');
        expect(entry?.forbiddenFields).toContain('summary');
      }
    });

    it('resmi omurga kaynakları RSS_METADATA_ONLY', () => {
      for (const id of ['afad_official', 'tcmb', 'kap']) {
        const entry = getSourceById(production, id);
        expect(entry?.legalMode).toBe('RSS_METADATA_ONLY');
        for (const forbidden of ['body', 'fullText', 'image', 'caption']) {
          expect(entry?.forbiddenFields).toContain(forbidden);
        }
      }
    });

    it('yasak alanlar allowedFields içine girmiyor', () => {
      for (const entry of production.sources) {
        const overlap = entry.allowedFields.filter((f) => entry.forbiddenFields.includes(f));
        expect(overlap).toEqual([]);
      }
    });
  });

  describe('legalMode sözlüğü', () => {
    it('tüm modlar tanımlı', () => {
      for (const mode of LEGAL_MODES) {
        expect(LEGAL_MODE_CONTRACT[mode]).toBeDefined();
      }
    });
  });

  describe('negative contract cases', () => {
    it('TITLE_LINK_ONLY summary allowed yakalanır', () => {
      const bad = {
        sourceId: 'bad_ntv',
        sourceName: 'Bad NTV',
        sourceType: 'COMMERCIAL_MEDIA' as const,
        baseDomain: 'bad.example',
        legalMode: 'TITLE_LINK_ONLY' as const,
        authorityTier: 'ESTABLISHED_MEDIA',
        reviewStatus: 'approved' as const,
        publishEligible: true,
        allowedFields: ['title', 'aiSummary'],
        forbiddenFields: ['body'],
        licenseStatus: 'none' as const,
        notes: 'negative test',
        lastReviewedAt: null,
      };
      const violations = validateLegalModeContract(bad);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.rule.includes('title_link_only'))).toBe(true);
    });
  });
});

describe('source registry SSOT v0 — runtime unchanged assertion', () => {
  it('production registry readOnly bayrağı korunur', () => {
    const registry = loadProductionRegistryFixture();
    expect(registry.readOnly).toBe(true);
  });
});
