import { describe, it, expect } from 'vitest';
import { AuthorityTier } from './source-score-types.js';
import type { SourceScore, SourceScoreShadowPayload } from './source-score-types.js';
import {
  attachSourceSignalsToItems,
  buildSourceSignalFromScore,
  buildSourceSignalFromShadow,
  containsBannedPhrase,
  mapScoreBand,
  sanitizeReasons,
  SOURCE_SIGNAL_DISCLAIMER,
  tierLabelFor,
} from './source-signal-mapper.js';

function sampleScore(overrides: Partial<SourceScore> = {}): SourceScore {
  return {
    sourceId: 'aa_guncel',
    sourceName: 'Anadolu Ajansı',
    sourceUrl: 'https://aa.com.tr/rss',
    sourceDomain: 'aa.com.tr',
    authorityTier: AuthorityTier.PRIMARY_WIRE_OR_AGENCY,
    authorityScore: 85,
    healthScore: 80,
    freshnessScore: 90,
    metadataCompletenessScore: 95,
    failurePenalty: 0,
    duplicateConfirmationBoost: 0,
    finalSourceScore: 82,
    reasons: ['Ajans / birincil haber sağlayıcı profili'],
    ...overrides,
  };
}

const shadowFixture: SourceScoreShadowPayload = {
  version: 'v0',
  readOnly: true,
  disclaimer: 'Güvenilirlik sinyali / kaynak sağlığı; mutlak doğruluk iddiası değildir.',
  sources: [
    sampleScore(),
    sampleScore({
      sourceId: 'trt_haber',
      sourceName: 'TRT Haber',
      authorityTier: AuthorityTier.PRIMARY_WIRE_OR_AGENCY,
      finalSourceScore: 78,
      reasons: ['Kamu yayıncısı yüksek trust profili'],
    }),
  ],
  articleOverlays: [
    {
      articleId: 'art-lead',
      sourceId: 'aa_guncel',
      duplicateConfirmationBoost: 10,
      finalSourceScore: 92,
      reasons: [
        'Ajans / birincil haber sağlayıcı profili',
        'Çoklu kaynak teyidi boost: +10 (2 kaynak)',
      ],
    },
  ],
  clusterConfirmation: [
    {
      clusterId: 'cluster-1',
      uniqueSourceCount: 2,
      duplicateConfirmationBoost: 10,
    },
  ],
};

describe('source-signal-mapper v0', () => {
  it('maps score bands deterministically', () => {
    expect(mapScoreBand(90)).toBe('HIGH');
    expect(mapScoreBand(60)).toBe('MEDIUM');
    expect(mapScoreBand(30)).toBe('LOW');
    expect(mapScoreBand(10)).toBe('UNKNOWN');
  });

  it('maps authority tier labels without absolute truth claims', () => {
    expect(tierLabelFor(AuthorityTier.OFFICIAL)).toBe('Resmi kaynak');
    expect(tierLabelFor(AuthorityTier.UNKNOWN)).toBe('Yeni / bilinmeyen kaynak');
    expect(containsBannedPhrase(tierLabelFor(AuthorityTier.OFFICIAL))).toBe(false);
  });

  it('sanitizes reasons and rejects banned phrases', () => {
    const reasons = sanitizeReasons([
      'Son RSS/API fetch başarısız — sağlık cezası',
      'Kanıtlandı kesin doğru',
      'Metadata eksikliği (title/link/time/description) sağlık sinyali',
    ]);
    expect(reasons).toContain('Son erişim sinyali zayıf');
    expect(reasons).toContain('Metadata eksikliği var');
    expect(reasons.some((r) => containsBannedPhrase(r))).toBe(false);
  });

  it('builds cluster source signal from shadow', () => {
    const signal = buildSourceSignalFromShadow(shadowFixture, 'cluster-1', 'art-lead');
    expect(signal).not.toBeNull();
    expect(signal!.label).toBe('Kaynak sinyali');
    expect(signal!.scoreBand).toBe('HIGH');
    expect(signal!.reasons[0]).toBe('Birden fazla kaynakla destekleniyor');
    expect(signal!.disclaimer).toBe(SOURCE_SIGNAL_DISCLAIMER);
    expect(containsBannedPhrase(signal!.disclaimer)).toBe(false);
  });

  it('builds per-source signal by source name', () => {
    const signal = buildSourceSignalFromShadow(
      shadowFixture,
      'cluster-1',
      'art-lead',
      'TRT Haber',
    );
    expect(signal?.tierLabel).toContain('Ajans');
    expect(signal?.scoreBand).toBe('HIGH');
  });

  it('returns null when shadow missing', () => {
    expect(buildSourceSignalFromShadow(null, 'c1', 'a1')).toBeNull();
    expect(buildSourceSignalFromShadow(undefined, 'c1', 'a1')).toBeNull();
  });

  it('attachSourceSignalsToItems adds item and source payloads', () => {
    const items = [
      {
        id: 'cluster-1',
        aiTitle: 'Test',
        sources: [{ sourceName: 'Anadolu Ajansı' }, { sourceName: 'TRT Haber' }],
      },
    ];
    const leadIds = new Map([['cluster-1', 'art-lead']]);
    const enriched = attachSourceSignalsToItems(items, shadowFixture, leadIds) as Array<{
      id: string;
      sourceSignal?: { label: string };
      sources: Array<{ sourceName: string; sourceSignal?: unknown }>;
    }>;
    expect(enriched[0].sourceSignal).toBeDefined();
    expect(enriched[0].sources[0].sourceSignal).toBeDefined();
    expect(enriched[0].sources[1].sourceSignal).toBeDefined();
  });

  it('attachSourceSignalsToItems is no-op without shadow', () => {
    const items = [{ id: 'c1', sources: [{ sourceName: 'X' }] }];
    const out = attachSourceSignalsToItems(items, null, new Map());
    expect(out).toEqual(items);
  });

  it('buildSourceSignalFromScore uses overlay final score', () => {
    const signal = buildSourceSignalFromScore(sampleScore(), {
      articleId: 'a',
      sourceId: 'aa_guncel',
      duplicateConfirmationBoost: 15,
      finalSourceScore: 95,
      reasons: ['Çoklu kaynak teyidi boost: +15 (3 kaynak)'],
    }, 15);
    expect(signal.scoreBand).toBe('HIGH');
    expect(signal.reasons[0]).toBe('Birden fazla kaynakla destekleniyor');
  });
});
