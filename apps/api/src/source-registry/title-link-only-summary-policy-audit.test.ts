import { describe, it, expect } from 'vitest';
import { loadSourceRegistryV0 } from './source-registry-loader.js';
import {
  buildTitleLinkOnlySummaryPolicyAudit,
  evaluateTitleLinkOnlySummaryPolicyForItem,
  COMMERCIAL_MEDIA_AUDIT_SOURCE_IDS,
} from './title-link-only-summary-policy-audit.js';

const registry = loadSourceRegistryV0();

describe('title-link-only-summary-policy-audit v0', () => {
  it('readOnly ve dryRunOnly işaretleri', () => {
    const payload = buildTitleLinkOnlySummaryPolicyAudit({ items: [], registry });
    expect(payload.readOnly).toBe(true);
    expect(payload.version).toBe('v0');
  });

  it('NTV TITLE_LINK_ONLY aiSummary user-visible ve android_fallback_then_cleanup', () => {
    const decision = evaluateTitleLinkOnlySummaryPolicyForItem(
      {
        id: 'ntv-1',
        aiTitle: 'Başlık',
        aiSummary: 'RSS özet metni',
        sources: [{ sourceName: 'NTV', url: 'https://www.ntv.com.tr/1' }],
      },
      registry,
    );
    expect(decision).not.toBeNull();
    expect(decision!.legalMode).toBe('TITLE_LINK_ONLY');
    expect(decision!.aiSummaryPresent).toBe(true);
    expect(decision!.userVisibleFields).toContain('aiSummary');
    expect(decision!.suspectedSourceFields).toContain(
      'smart-feed.aiSummary<=leadArticle.shortDescription',
    );
    expect(decision!.recommendedFix).toBe('android_fallback_then_cleanup');
    expect(decision!.reasonCode).toBe('title_link_only_user_visible_summary');
    expect(decision!.dryRunOnly).toBe(true);
  });

  it('Habertürk TITLE_LINK_ONLY audit kapsamında', () => {
    const decision = evaluateTitleLinkOnlySummaryPolicyForItem(
      {
        id: 'ht-1',
        aiTitle: 'Ekonomi',
        aiSummary: 'Özet',
        sources: [{ sourceName: 'Habertürk', url: 'https://www.haberturk.com/1' }],
      },
      registry,
    );
    expect(decision?.sourceId).toBe('haberturk_ekonomi');
    expect(decision?.recommendedFix).toBe('android_fallback_then_cleanup');
  });

  it('TRT NEEDS_REVIEW source_registry_mode_review önerir', () => {
    const decision = evaluateTitleLinkOnlySummaryPolicyForItem(
      {
        id: 'trt-1',
        aiTitle: 'TRT',
        aiSummary: 'Manşet özeti',
        sources: [{ sourceName: 'TRT Haber', url: 'https://www.trthaber.com/1' }],
      },
      registry,
    );
    expect(decision?.legalMode).toBe('NEEDS_REVIEW');
    expect(decision?.recommendedFix).toBe('source_registry_mode_review');
    expect(decision?.reasonCode).toBe('needs_review_user_visible_summary');
  });

  it('aiSummary yoksa no_action', () => {
    const decision = evaluateTitleLinkOnlySummaryPolicyForItem(
      {
        id: 'ntv-2',
        aiTitle: 'Yalnız başlık',
        sources: [{ sourceName: 'NTV', url: 'https://www.ntv.com.tr/2' }],
      },
      registry,
    );
    expect(decision?.aiSummaryPresent).toBe(false);
    expect(decision?.recommendedFix).toBe('no_action');
    expect(decision?.reasonCode).toBe('no_summary_present');
  });

  it('audit dışı kaynak null döner', () => {
    const decision = evaluateTitleLinkOnlySummaryPolicyForItem(
      {
        id: 'x',
        aiTitle: 'X',
        aiSummary: 'S',
        sources: [{ sourceName: 'Totally Unknown', url: 'https://unknown.invalid/1' }],
      },
      registry,
    );
    expect(decision).toBeNull();
  });

  it('buildTitleLinkOnlySummaryPolicyAudit özetler', () => {
    const payload = buildTitleLinkOnlySummaryPolicyAudit({
      items: [
        {
          id: 'a',
          aiTitle: 'T',
          aiSummary: 'S',
          sources: [{ sourceName: 'NTV', url: 'https://ntv.com.tr/1' }],
        },
        {
          id: 'b',
          aiTitle: 'T2',
          aiSummary: 'S2',
          sources: [{ sourceName: 'TRT Haber', url: 'https://trthaber.com/1' }],
        },
      ],
      registry,
    });
    expect(payload.titleLinkOnlyItemCount).toBe(1);
    expect(payload.needsReviewItemCount).toBe(1);
    expect(payload.userVisibleSummaryItemCount).toBe(2);
    expect(payload.forbiddenSummaryFieldCount).toBeGreaterThan(0);
    expect(COMMERCIAL_MEDIA_AUDIT_SOURCE_IDS).toContain('ntv_son_dakika');
  });
});
