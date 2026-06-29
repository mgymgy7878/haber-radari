import { describe, it, expect } from 'vitest';
import { loadSourceRegistryV0 } from './source-registry-loader.js';
import {
  buildLegalContentGuardrailDryRun,
  evaluateLegalContentGuardrailDryRunForItem,
  extractAuditFieldsFromFeedItem,
  resolveRegistryEntryForFeedSource,
  LEGAL_CONTENT_GUARDRAIL_DRY_RUN_DISCLAIMER,
} from './legal-content-guardrail-dry-run.js';
import type { SourceRegistryEntry } from './source-registry-types.js';

const registry = loadSourceRegistryV0();

function titleLinkOnlyRecord(overrides: Partial<SourceRegistryEntry> = {}): SourceRegistryEntry {
  return {
    sourceId: 'ntv_son_dakika',
    sourceName: 'NTV Son Dakika',
    baseDomain: 'ntv.com.tr',
    legalMode: 'TITLE_LINK_ONLY',
    authorityTier: 'ESTABLISHED_MEDIA',
    reviewStatus: 'approved',
    publishEligible: true,
    allowedFields: ['title', 'canonicalUrl', 'sourceName', 'publishedAt', 'category'],
    forbiddenFields: [
      'description',
      'summary',
      'body',
      'fullText',
      'contentHtml',
      'rawHtml',
      'articleText',
      'scrapedText',
      'image',
      'video',
      'audio',
      'caption',
    ],
    ...overrides,
  };
}

describe('legal-content-guardrail-dry-run v0', () => {
  it('readOnly ve dryRunOnly işaretleri', () => {
    const payload = buildLegalContentGuardrailDryRun({ items: [], registry });
    expect(payload.readOnly).toBe(true);
    expect(payload.version).toBe('v0');
    expect(payload.disclaimer).toBe(LEGAL_CONTENT_GUARDRAIL_DRY_RUN_DISCLAIMER);
    expect(payload.sourceRegistryVersion).toBe('v0');
  });

  it('TITLE_LINK_ONLY summary/description/fullText/image/caption için wouldStrip üretir', () => {
    const decision = evaluateLegalContentGuardrailDryRunForItem(
      {
        id: 'item-1',
        aiTitle: 'Başlık',
        aiSummary: 'Özet metni',
        sources: [{ sourceName: 'NTV', url: 'https://www.ntv.com.tr/1' }],
      },
      registry,
    );
    expect(decision.dryRunOnly).toBe(true);
    expect(decision.legalMode).toBe('TITLE_LINK_ONLY');
    expect(decision.wouldStrip).toBe(true);
    expect(decision.forbiddenFieldsPresent).toEqual(
      expect.arrayContaining(['summary', 'description']),
    );
    expect(decision.wouldStripFields).toEqual(
      expect.arrayContaining(['summary', 'description', 'shortDescription']),
    );
    expect(decision.reasonCode).toBe('would_strip_forbidden_fields');
  });

  it('TITLE_LINK_ONLY yalnızca allowed fields için wouldStrip=false', () => {
    const decision = evaluateLegalContentGuardrailDryRunForItem(
      {
        id: 'item-2',
        aiTitle: 'Başlık',
        sources: [
          {
            sourceName: 'NTV',
            url: 'https://www.ntv.com.tr/2',
            publishedAt: Date.now(),
          },
        ],
      },
      registry,
    );
    expect(decision.wouldStrip).toBe(false);
    expect(decision.reasonCode).toBe('ok');
    expect(decision.fieldsPresent).toEqual(
      expect.arrayContaining(['title', 'canonicalUrl', 'sourceName', 'publishedAt']),
    );
  });

  it('RSS_METADATA_ONLY fullText/rawHtml/image/caption için wouldStrip üretir', () => {
    const decision = evaluateLegalContentGuardrailDryRunForItem(
      {
        id: 'item-afad',
        aiTitle: 'Afet duyurusu',
        aiSummary: 'Kısa özet',
        fullText: 'tam metin',
        rawHtml: '<p>x</p>',
        sources: [
          {
            sourceName: 'AFAD',
            url: 'https://www.afad.gov.tr/1',
            imageUrl: 'https://img',
          },
        ],
      },
      registry,
    );
    expect(decision.legalMode).toBe('RSS_METADATA_ONLY');
    expect(decision.wouldStrip).toBe(true);
    expect(decision.forbiddenFieldsPresent).toEqual(
      expect.arrayContaining(['fullText', 'rawHtml', 'image']),
    );
  });

  it('DISABLED kaynak not_production_eligible reasonCode döner', () => {
    const decision = evaluateLegalContentGuardrailDryRunForItem(
      {
        id: 'item-aa',
        aiTitle: 'Ajans haberi',
        aiSummary: 'özet',
        sources: [
          {
            sourceName: 'Anadolu Ajansı',
            url: 'https://www.aa.com.tr/1',
          },
        ],
      },
      registry,
    );
    expect(decision.legalMode).toBe('DISABLED');
    expect(decision.reasonCode).toBe('not_production_eligible');
    expect(decision.wouldStrip).toBe(true);
  });

  it('NEEDS_REVIEW kaynak production eligible değildir', () => {
    const decision = evaluateLegalContentGuardrailDryRunForItem(
      {
        id: 'item-bbc',
        aiTitle: 'BBC haber',
        sources: [{ sourceName: 'BBC Türkçe', url: 'https://www.bbc.com/turkce/1' }],
      },
      registry,
    );
    expect(decision.legalMode).toBe('NEEDS_REVIEW');
    expect(decision.reasonCode).toBe('not_production_eligible');
  });

  it('unmatched source hata fırlatmaz', () => {
    const decision = evaluateLegalContentGuardrailDryRunForItem(
      {
        id: 'item-unknown',
        aiTitle: 'Bilinmeyen',
        sources: [{ sourceName: 'Totally Unknown Outlet', url: 'https://unknown.invalid/1' }],
      },
      registry,
    );
    expect(decision.sourceId).toBeUndefined();
    expect(decision.reasonCode).toBe('source_unmatched');
    expect(decision.dryRunOnly).toBe(true);
  });

  it('LICENSED sözleşme dışı field wouldStrip üretir', () => {
    const licensedRegistry = {
      ...registry,
      sources: [
        ...registry.sources,
        {
          sourceId: 'aa_licensed_active',
          sourceName: 'AA Licensed',
          baseDomain: 'aa.com.tr',
          legalMode: 'LICENSED' as const,
          authorityTier: 'PRIMARY_WIRE_OR_AGENCY',
          reviewStatus: 'approved' as const,
          publishEligible: true,
          licenseStatus: 'active' as const,
          allowedFields: ['title', 'shortDescription', 'canonicalUrl', 'sourceName', 'publishedAt'],
          forbiddenFields: ['body', 'fullText', 'contentHtml', 'rawHtml', 'articleText', 'scrapedText', 'image', 'video', 'audio', 'caption'],
        },
      ],
    };
    const decision = evaluateLegalContentGuardrailDryRunForItem(
      {
        id: 'item-lic',
        aiTitle: 'Haber',
        fullText: 'yasak',
        sources: [{ sourceName: 'AA Licensed', url: 'https://aa.com.tr/lic/1' }],
      },
      licensedRegistry,
    );
    expect(decision.wouldStrip).toBe(true);
    expect(decision.wouldStripFields).toContain('fullText');
  });

  it('extractAuditFieldsFromFeedItem medya alanlarını toplar', () => {
    const fields = extractAuditFieldsFromFeedItem({
      id: 'x',
      aiTitle: 'T',
      mediaHints: { image: 'img', caption: 'cap' },
      sources: [{ sourceName: 'NTV', videoUrl: 'vid' }],
    });
    expect(fields.image).toBe('img');
    expect(fields.caption).toBe('cap');
    expect(fields.video).toBe('vid');
  });

  it('resolveRegistryEntryForFeedSource runtime isim eşlemesi', () => {
    expect(resolveRegistryEntryForFeedSource(registry, 'Anadolu Ajansı')?.sourceId).toBe(
      'aa_guncel',
    );
    expect(resolveRegistryEntryForFeedSource(registry, 'NTV')?.sourceId).toBe('ntv_son_dakika');
  });

  it('buildLegalContentGuardrailDryRun byLegalMode özetler', () => {
    const payload = buildLegalContentGuardrailDryRun({
      items: [
        {
          id: 'a',
          aiTitle: 'T1',
          aiSummary: 'summary',
          sources: [{ sourceName: 'NTV', url: 'https://ntv.com.tr/1' }],
        },
        {
          id: 'b',
          aiTitle: 'T2',
          sources: [{ sourceName: 'Unknown', url: 'https://unknown.invalid/1' }],
        },
      ],
      registry,
    });
    expect(payload.evaluatedItemCount).toBe(2);
    expect(payload.sourceUnmatchedCount).toBe(1);
    expect(payload.wouldStripItemCount).toBeGreaterThanOrEqual(1);
    expect(payload.byLegalMode.TITLE_LINK_ONLY?.evaluatedCount).toBe(1);
  });
});
