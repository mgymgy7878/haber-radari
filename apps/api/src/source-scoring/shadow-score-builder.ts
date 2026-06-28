import { RSS_SOURCES } from '../config/rss-sources.js';
import type { RawArticle } from '../models/raw-article.js';
import type { Cluster } from '../engine/cluster-engine.js';
import { uniqueSourceCount } from '../engine/cluster-engine.js';
import type { SourceFetchStatus, SourceScoreShadowPayload } from './source-score-types.js';
import { scoreSourceHealth, buildArticleOverlays } from './source-health-scorer.js';

export function buildSourceScoreShadow(params: {
  articles: RawArticle[];
  clusters: Cluster[];
  sourceStatuses?: SourceFetchStatus[];
  nowMs?: number;
}): SourceScoreShadowPayload {
  const nowMs = params.nowMs ?? Date.now();
  const statusById = new Map(
    (params.sourceStatuses ?? []).map((s) => [s.sourceId, s] as const),
  );

  const articlesBySource = new Map<string, RawArticle[]>();
  for (const article of params.articles) {
    const list = articlesBySource.get(article.sourceId) ?? [];
    list.push(article);
    articlesBySource.set(article.sourceId, list);
  }

  const articleSourceMap = new Map(params.articles.map((a) => [a.id, a.sourceId] as const));

  const knownSourceIds = new Set(RSS_SOURCES.map((s) => s.id));
  const sourceScores = RSS_SOURCES.map((config) =>
    scoreSourceHealth({
      sourceId: config.id,
      sourceName: config.name,
      sourceUrl: config.url,
      trustTier: config.trustTier,
      enabled: config.enabled,
      fetchStatus: statusById.get(config.id),
      articles: (articlesBySource.get(config.id) ?? []).map((a) => ({
        id: a.id,
        originalTitle: a.originalTitle,
        originalUrl: a.originalUrl,
        publishedAt: a.publishedAt,
        shortDescription: a.shortDescription,
      })),
      nowMs,
    }),
  );

  const sourceScoresById = new Map(sourceScores.map((s) => [s.sourceId, s] as const));

  const clusterInputs = params.clusters.map((cluster) => ({
    clusterId: cluster.id,
    articleIds: cluster.articles.map((a) => a.id),
    sourceIds: cluster.articles.map((a) => a.sourceId),
    uniqueSourceCount: uniqueSourceCount(cluster.articles),
  }));

  const { overlays, clusterConfirmation } = buildArticleOverlays(
    sourceScoresById,
    clusterInputs,
    articleSourceMap,
  );

  // Articles from unknown RSS ids (shouldn't happen in prod) — no extra source row
  for (const article of params.articles) {
    if (!knownSourceIds.has(article.sourceId) && !sourceScoresById.has(article.sourceId)) {
      // shadow only; no publish impact
    }
  }

  return {
    version: 'v0',
    readOnly: true,
    disclaimer: 'Güvenilirlik sinyali / kaynak sağlığı; mutlak doğruluk iddiası değildir.',
    sources: sourceScores,
    articleOverlays: overlays,
    clusterConfirmation,
  };
}
