import { describe, it, expect } from 'vitest';
import { loadSourceRegistryV0 } from './source-registry-loader.js';
import {
  evaluateLegalContentGuardrailDryRunForItem,
  buildLegalContentGuardrailDryRun,
} from './legal-content-guardrail-dry-run.js';
import {
  enrichLegalContentGuardrailDecisionWithRca,
  buildForbiddenFieldDetails,
  resolveOverallRcaRecommendation,
  buildRcaTableRows,
} from './legal-content-guardrail-rca.js';

const registry = loadSourceRegistryV0();

describe('legal-content-guardrail-rca v0', () => {
  it('TITLE_LINK_ONLY aiSummary strip alanları user-visible ve normalize_cleanup önerir', () => {
    const item = {
      id: 'item-ntv',
      aiTitle: 'Başlık',
      aiSummary: 'RSS özet metni',
      sources: [{ sourceName: 'NTV', url: 'https://www.ntv.com.tr/1', publishedAt: Date.now() }],
    };
    const decision = evaluateLegalContentGuardrailDryRunForItem(item, registry);
    const enriched = enrichLegalContentGuardrailDecisionWithRca(item, decision);

    expect(enriched.wouldStripFields).toEqual(
      expect.arrayContaining(['summary', 'shortDescription', 'description']),
    );
    expect(enriched.visibleInItemPayload).toEqual(
      expect.arrayContaining(['summary', 'shortDescription']),
    );
    expect(enriched.forbiddenFieldDetails.find((d) => d.field === 'description')?.auditDerivedOnly).toBe(
      true,
    );
    expect(enriched.fieldLocation).toBe('item_payload');
    expect(enriched.recommendedFix).toBe('normalize_cleanup');
    expect(enriched.itemPayloadFieldCount).toBeGreaterThan(0);
  });

  it('DISABLED kaynak source_registry_mode_review önerir', () => {
    const item = {
      id: 'item-aa',
      aiTitle: 'Ajans',
      aiSummary: 'özet',
      sources: [
        {
          sourceName: 'Anadolu Ajansı',
          url: 'https://www.aa.com.tr/1',
          publishedAt: Date.now(),
        },
      ],
    };
    const decision = evaluateLegalContentGuardrailDryRunForItem(item, registry);
    const enriched = enrichLegalContentGuardrailDecisionWithRca(item, decision);

    expect(decision.legalMode).toBe('DISABLED');
    expect(decision.wouldStripFields.length).toBe(7);
    expect(enriched.recommendedFix).toBe('source_registry_mode_review');
    expect(enriched.visibleInItemPayload.length).toBeGreaterThan(0);
  });

  it('wouldStripFieldCount=7 senaryosu: summary+shortDescription+description+metadata', () => {
    const item = {
      id: 'item-7',
      aiTitle: 'T',
      aiSummary: 'S',
      sources: [
        {
          sourceName: 'Anadolu Ajansı',
          url: 'https://aa.com.tr/x',
          publishedAt: 1,
        },
      ],
    };
    const decision = evaluateLegalContentGuardrailDryRunForItem(item, registry);
    expect(decision.wouldStripFields).toHaveLength(7);
    expect(decision.wouldStripFields).toEqual(
      expect.arrayContaining([
        'title',
        'summary',
        'shortDescription',
        'description',
        'sourceName',
        'canonicalUrl',
        'publishedAt',
      ]),
    );
  });

  it('unmatched source no_action_debug_only', () => {
    const item = {
      id: 'u',
      aiTitle: 'X',
      sources: [{ sourceName: 'Unknown Outlet', url: 'https://unknown.invalid/1' }],
    };
    const decision = evaluateLegalContentGuardrailDryRunForItem(item, registry);
    const enriched = enrichLegalContentGuardrailDecisionWithRca(item, decision);
    expect(enriched.recommendedFix).toBe('no_action_debug_only');
  });

  it('buildRcaTableRows markdown tablo satırı üretir', () => {
    const payload = buildLegalContentGuardrailDryRun({
      items: [
        {
          id: 'a',
          aiTitle: 'T',
          aiSummary: 'S',
          sources: [{ sourceName: 'NTV', url: 'https://ntv.com.tr/1' }],
        },
      ],
      registry,
    });
    const rows = buildRcaTableRows(payload.decisions);
    expect(rows).toHaveLength(1);
    expect(rows[0].itemId).toBe('a');
    expect(rows[0].recommendedFix).toBe('normalize_cleanup');
  });

  it('resolveOverallRcaRecommendation öncelik sırası', () => {
    const details = buildForbiddenFieldDetails({
      forbiddenFieldsPresent: ['summary'],
      wouldStripFields: ['summary'],
    });
    expect(details[0].userVisible).toBe(true);

    const payload = buildLegalContentGuardrailDryRun({
      items: [
        {
          id: 'aa',
          aiTitle: 'A',
          aiSummary: 'S',
          sources: [{ sourceName: 'Anadolu Ajansı', url: 'https://aa.com.tr/1' }],
        },
      ],
      registry,
    });
    expect(resolveOverallRcaRecommendation(payload.decisions)).toBe('source_registry_mode_review');
  });
});
