import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { AuthorityTier } from './source-score-types.js';
import {
  resolveAuthorityTier,
  resolveUnknownSourceProfile,
  extractDomain,
} from './authority-tier-resolver.js';
import {
  scoreSourceHealth,
  computeDuplicateConfirmationBoost,
  buildArticleOverlays,
} from './source-health-scorer.js';
import { buildSourceScoreShadow } from './shadow-score-builder.js';
import type { RawArticle } from '../models/raw-article.js';
import type { Cluster } from '../engine/cluster-engine.js';
import { RSS_SOURCES } from '../config/rss-sources.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(__dirname, 'fixtures', 'source-scoring-cases.json');

const FIXED_NOW = 1700100000000; // ~27h after fixture publishedAt

interface FixtureCase {
  id: string;
  description: string;
  input?: {
    sourceId: string;
    sourceName: string;
    sourceUrl: string;
    trustTier: 'HIGH' | 'MEDIUM' | 'LOW';
    enabled: boolean;
    fetchStatus?: {
      success: boolean;
      itemCount: number;
      skippedMissingMetadataCount: number;
    };
    articles: Array<{
      id: string;
      originalTitle: string;
      originalUrl: string;
      publishedAt: number;
      shortDescription: string;
    }>;
  };
  cluster?: {
    clusterId: string;
    uniqueSourceCount: number;
    articleIds: string[];
    sourceIds: string[];
  };
  expect: Record<string, unknown>;
}

function loadFixtures(): FixtureCase[] {
  return JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8')) as FixtureCase[];
}

function toHealthInput(fixture: FixtureCase['input']) {
  if (!fixture) throw new Error('missing input');
  return {
    sourceId: fixture.sourceId,
    sourceName: fixture.sourceName,
    sourceUrl: fixture.sourceUrl,
    trustTier: fixture.trustTier,
    enabled: fixture.enabled,
    fetchStatus: fixture.fetchStatus
      ? {
          sourceId: fixture.sourceId,
          sourceName: fixture.sourceName,
          sourceUrl: fixture.sourceUrl,
          success: fixture.fetchStatus.success,
          fetchedAt: FIXED_NOW,
          itemCount: fixture.fetchStatus.itemCount,
          skippedMissingMetadataCount: fixture.fetchStatus.skippedMissingMetadataCount,
        }
      : undefined,
    articles: fixture.articles,
    nowMs: FIXED_NOW,
  };
}

describe('Source Authority / Health Scoring v0 (shadow)', () => {
  const fixtures = loadFixtures();

  for (const fx of fixtures.filter((f) => f.input)) {
    it(`fixture: ${fx.id} — ${fx.description}`, () => {
      const score = scoreSourceHealth(toHealthInput(fx.input!));
      const exp = fx.expect;

      if (exp.authorityTier) {
        expect(score.authorityTier).toBe(exp.authorityTier);
      }
      if (typeof exp.minAuthorityScore === 'number') {
        expect(score.authorityScore).toBeGreaterThanOrEqual(exp.minAuthorityScore);
      }
      if (typeof exp.maxAuthorityScore === 'number') {
        expect(score.authorityScore).toBeLessThanOrEqual(exp.maxAuthorityScore);
      }
      if (typeof exp.minFinalSourceScore === 'number') {
        expect(score.finalSourceScore).toBeGreaterThanOrEqual(exp.minFinalSourceScore);
      }
      if (typeof exp.maxFinalSourceScore === 'number') {
        expect(score.finalSourceScore).toBeLessThanOrEqual(exp.maxFinalSourceScore);
      }
      if (typeof exp.maxMetadataCompletenessScore === 'number') {
        expect(score.metadataCompletenessScore).toBeLessThanOrEqual(
          exp.maxMetadataCompletenessScore,
        );
      }
      if (typeof exp.maxHealthScore === 'number') {
        expect(score.healthScore).toBeLessThanOrEqual(exp.maxHealthScore);
      }
      if (typeof exp.minFailurePenalty === 'number') {
        expect(score.failurePenalty).toBeGreaterThanOrEqual(exp.minFailurePenalty);
      }
      if (Array.isArray(exp.reasonIncludes)) {
        for (const fragment of exp.reasonIncludes as string[]) {
          expect(score.reasons.some((r) => r.toLowerCase().includes(fragment.toLowerCase()))).toBe(
            true,
          );
        }
      }

      expect(score.reasons.length).toBeGreaterThan(0);
      for (const reason of score.reasons) {
        expect(typeof reason).toBe('string');
        expect(reason.length).toBeGreaterThan(3);
      }
    });
  }

  for (const fx of fixtures.filter((f) => f.cluster)) {
    it(`fixture cluster: ${fx.id} — ${fx.description}`, () => {
      const cluster = fx.cluster!;
      const boost = computeDuplicateConfirmationBoost(cluster.uniqueSourceCount);
      expect(boost).toBe(fx.expect.duplicateConfirmationBoost);

      const baseScore = scoreSourceHealth({
        sourceId: 's1',
        sourceName: 'Test',
        sourceUrl: 'https://test.example/rss',
        trustTier: 'MEDIUM',
        enabled: true,
        articles: [
          {
            id: cluster.articleIds[0],
            originalTitle: 'Haber',
            originalUrl: 'https://test.example/1',
            publishedAt: FIXED_NOW - 3600000,
            shortDescription: 'Özet',
          },
        ],
        nowMs: FIXED_NOW,
      });

      const sourceMap = new Map(
        cluster.sourceIds.map((sid) => [
          sid,
          sid === 's1'
            ? baseScore
            : scoreSourceHealth({
                sourceId: sid,
                sourceName: `Source ${sid}`,
                sourceUrl: `https://${sid}.example/rss`,
                trustTier: 'MEDIUM',
                enabled: true,
                articles: [
                  {
                    id: cluster.articleIds[cluster.sourceIds.indexOf(sid)] ?? 'x',
                    originalTitle: 'Haber',
                    originalUrl: `https://${sid}.example/1`,
                    publishedAt: FIXED_NOW - 3600000,
                    shortDescription: 'Özet',
                  },
                ],
                nowMs: FIXED_NOW,
              }),
        ]),
      );
      const articleSourceMap = new Map(
        cluster.articleIds.map((id, i) => [id, cluster.sourceIds[i]] as const),
      );

      const { overlays } = buildArticleOverlays(
        sourceMap,
        [
          {
            clusterId: cluster.clusterId,
            articleIds: cluster.articleIds,
            sourceIds: cluster.sourceIds,
            uniqueSourceCount: cluster.uniqueSourceCount,
          },
        ],
        articleSourceMap,
      );

      expect(overlays.length).toBe(cluster.articleIds.length);
      if (cluster.uniqueSourceCount === 1 && Array.isArray(fx.expect.overlayReasonIncludes)) {
        for (const fragment of fx.expect.overlayReasonIncludes as string[]) {
          expect(
            overlays[0].reasons.some((r) => r.toLowerCase().includes(fragment.toLowerCase())),
          ).toBe(true);
        }
      }
      if (typeof fx.expect.duplicateConfirmationBoost === 'number' && fx.expect.duplicateConfirmationBoost > 0) {
        expect(overlays[0].duplicateConfirmationBoost).toBe(fx.expect.duplicateConfirmationBoost);
        expect(overlays[0].finalSourceScore).toBeGreaterThan(baseScore.finalSourceScore);
      }
    });
  }

  it('resmi kaynak (AA) yüksek authority tier', () => {
    const aa = RSS_SOURCES.find((s) => s.id === 'aa_guncel')!;
    const { tier, authorityScore } = resolveAuthorityTier(aa);
    expect(tier).toBe(AuthorityTier.PRIMARY_WIRE_OR_AGENCY);
    expect(authorityScore).toBeGreaterThanOrEqual(80);
  });

  it('unknown profil düşük authority', () => {
    const profile = resolveUnknownSourceProfile('Yeni Site', 'https://yeni.example/feed');
    expect(profile.tier).toBe(AuthorityTier.UNKNOWN);
    expect(profile.authorityScore).toBeLessThanOrEqual(40);
    expect(profile.reasons.some((r) => r.includes('Bilinmeyen'))).toBe(true);
  });

  it('skor hesaplaması deterministik kalır', () => {
    const input = toHealthInput(fixtures.find((f) => f.id === 'established-media-ntv')!.input!);
    const a = scoreSourceHealth(input);
    const b = scoreSourceHealth(input);
    expect(a).toEqual(b);
  });

  it('shadow payload read-only ve disclaimer içerir', () => {
    const articles: RawArticle[] = [
      {
        id: 'x1',
        sourceId: 'aa_guncel',
        sourceName: 'Anadolu Ajansı',
        sourceUrl: RSS_SOURCES[0].url,
        originalUrl: 'https://aa.com.tr/1',
        originalTitle: 'Test',
        shortDescription: 'Desc',
        publishedAt: FIXED_NOW - 1000,
        fetchedAt: FIXED_NOW,
        categoryHint: 'Güncel',
        language: 'tr',
        country: 'TR',
      },
    ];
    const clusters: Cluster[] = [
      {
        id: 'c1',
        articles,
        mainCategory: 'Gündem',
        earliestPublishedAt: articles[0].publishedAt,
      },
    ];

    const shadow = buildSourceScoreShadow({
      articles,
      clusters,
      sourceStatuses: [],
      nowMs: FIXED_NOW,
    });

    expect(shadow.readOnly).toBe(true);
    expect(shadow.version).toBe('v0');
    expect(shadow.disclaimer).toContain('Güvenilirlik sinyali');
    expect(shadow.sources.length).toBe(RSS_SOURCES.length);
    expect(shadow.articleOverlays.length).toBe(1);
  });

  it('extractDomain www prefix kaldırır', () => {
    expect(extractDomain('https://www.ntv.com.tr/rss')).toBe('ntv.com.tr');
  });
});
