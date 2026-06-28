import { describe, it, expect } from 'vitest';
import {
  ContentType,
  PublishDecision,
  TopicQuality,
  type PublishResult,
} from '../engine/publish-gate.js';
import {
  buildSourceSignalPublishDryRun,
  evaluateSourceSignalPublishDryRun,
  DRY_RUN_DISCLAIMER,
} from './source-signal-publish-dry-run.js';
import { containsBannedPhrase, type SourceSignalPayload } from './source-signal-mapper.js';

function evalFixture(overrides: Partial<PublishResult> = {}): PublishResult {
  return {
    decision: PublishDecision.PUBLISH_MAIN,
    evidenceStatus: 'SINGLE_SOURCE' as PublishResult['evidenceStatus'],
    topicQuality: TopicQuality.CRITICAL,
    contentType: ContentType.DISASTER_ALERT,
    importance: 'HIGH',
    confidence: 0.8,
    reason: 'test',
    warningLabel: null,
    ...overrides,
  };
}

function signalFixture(overrides: Partial<SourceSignalPayload> = {}): SourceSignalPayload {
  return {
    label: 'Kaynak sinyali',
    tierLabel: 'Yeni / bilinmeyen kaynak',
    scoreBand: 'UNKNOWN',
    reasons: ['Kaynak profili değerlendirmesi yardımcı sinyaldir.'],
    disclaimer: 'Bu sinyal haberin doğruluğunu tek başına garanti etmez.',
    ...overrides,
  };
}

describe('source-signal-publish-dry-run v0', () => {
  it('readOnly disclaimer ve dryRunOnly işaretleri', () => {
    const payload = buildSourceSignalPublishDryRun({
      clusters: [],
      clusterEvaluations: new Map(),
      itemsByClusterId: new Map(),
      shadow: null,
      leadArticleIdsByCluster: new Map(),
    });
    expect(payload.readOnly).toBe(true);
    expect(payload.version).toBe('v0');
    expect(payload.disclaimer).toBe(DRY_RUN_DISCLAIMER);
    expect(containsBannedPhrase(payload.disclaimer)).toBe(false);
  });

  it('unknown tek kaynak kritik iddia → wouldBlockCritical', () => {
    const d = evaluateSourceSignalPublishDryRun({
      clusterId: 'c1',
      evaluation: evalFixture(),
      sourceSignal: signalFixture({ scoreBand: 'UNKNOWN' }),
      uniqueSourceCount: 1,
    });
    expect(d.wouldBlockCritical).toBe(true);
    expect(d.dryRunAction).toBe('wouldBlockCritical');
    expect(d.dryRunOnly).toBe(true);
    expect(d.reasons.some((r) => r.includes('wouldBlockCritical'))).toBe(true);
    expect(d.reasons.every((r) => !containsBannedPhrase(r))).toBe(true);
  });

  it('official/high çok kaynak → noAction', () => {
    const d = evaluateSourceSignalPublishDryRun({
      clusterId: 'c2',
      evaluation: evalFixture({ topicQuality: TopicQuality.NORMAL, importance: 'MEDIUM' }),
      sourceSignal: signalFixture({
        scoreBand: 'HIGH',
        tierLabel: 'Resmi kaynak',
        reasons: ['Birden fazla kaynakla destekleniyor'],
      }),
      uniqueSourceCount: 3,
    });
    expect(d.dryRunAction).toBe('noAction');
    expect(d.wouldBlockCritical).toBe(false);
    expect(d.wouldDemoteMain).toBe(false);
  });

  it('low + metadata eksik + tek kaynak + PUBLISH_MAIN → wouldDemoteMain', () => {
    const d = evaluateSourceSignalPublishDryRun({
      clusterId: 'c3',
      evaluation: evalFixture({
        topicQuality: TopicQuality.NORMAL,
        importance: 'MEDIUM',
        contentType: ContentType.NEWS_EVENT,
        decision: PublishDecision.PUBLISH_MAIN,
      }),
      sourceSignal: signalFixture({
        scoreBand: 'LOW',
        tierLabel: 'Yerel kaynak',
        reasons: ['Metadata eksikliği var'],
      }),
      uniqueSourceCount: 1,
    });
    expect(d.wouldDemoteMain).toBe(true);
    expect(d.dryRunAction).toBe('wouldDemoteMain');
  });

  it('sourceSignal yoksa insufficientSignal — kırılmaz', () => {
    const d = evaluateSourceSignalPublishDryRun({
      clusterId: 'c4',
      evaluation: evalFixture(),
      sourceSignal: null,
      uniqueSourceCount: 1,
    });
    expect(d.dryRunAction).toBe('insufficientSignal');
    expect(d.wouldBlockCritical).toBe(false);
    expect(d.wouldDemoteMain).toBe(false);
  });

  it('build payload sayaçları doğru', () => {
    const clusters = [
      {
        id: 'c-block',
        articles: [{ sourceName: 'A', sourceId: 'x', id: 'a1' } as any],
        mainCategory: 'Gündem',
        earliestPublishedAt: 0,
      },
      {
        id: 'c-demote',
        articles: [{ sourceName: 'B', sourceId: 'y', id: 'b1' } as any],
        mainCategory: 'Gündem',
        earliestPublishedAt: 0,
      },
    ];
    const evaluations = new Map<string, PublishResult>([
      ['c-block', evalFixture()],
      [
        'c-demote',
        evalFixture({
          topicQuality: TopicQuality.NORMAL,
          importance: 'MEDIUM',
          contentType: ContentType.NEWS_EVENT,
          decision: PublishDecision.PUBLISH_MAIN,
        }),
      ],
    ]);
    const items = new Map([
      ['c-block', { sourceSignal: signalFixture({ scoreBand: 'UNKNOWN' }) }],
      [
        'c-demote',
        {
          sourceSignal: signalFixture({
            scoreBand: 'LOW',
            reasons: ['Metadata eksikliği var'],
          }),
        },
      ],
    ]);

    const payload = buildSourceSignalPublishDryRun({
      clusters,
      clusterEvaluations: evaluations,
      itemsByClusterId: items,
      shadow: null,
      leadArticleIdsByCluster: new Map(),
    });

    expect(payload.evaluatedCount).toBe(2);
    expect(payload.wouldBlockCount).toBe(1);
    expect(payload.wouldDemoteCount).toBe(1);
    expect(payload.decisions.every((d) => d.dryRunOnly)).toBe(true);
  });
});
