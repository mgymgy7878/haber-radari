import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RssIngestService } from '../services/rss-ingest.js';
import { ClusterEngine, mapClusterSources, sortClusterArticles, uniqueSourceCount } from '../engine/cluster-engine.js';
import { PublishGate, PublishDecision, type PublishResult } from '../engine/publish-gate.js';
import { resolveFeedCategory } from '../engine/feed-category.js';
import {
  SmartDigestService,
  buildDigestInputFromClusterItem,
} from '../smart-digest/smart-digest-service.js';
import { buildSourceScoreShadow } from '../source-scoring/shadow-score-builder.js';
import { attachSourceSignalsToItems } from '../source-scoring/source-signal-mapper.js';
import { buildSourceSignalPublishDryRun } from '../source-scoring/source-signal-publish-dry-run.js';
import { buildLegalContentGuardrailDryRun } from '../source-registry/legal-content-guardrail-dry-run.js';
import { loadSourceRegistryV0 } from '../source-registry/source-registry-loader.js';

let cachedFeed: any = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Test helper — feed cache sıfırlama. */
export function resetSmartFeedCacheForTests(): void {
  cachedFeed = null;
  cacheTimestamp = 0;
}

export async function smartFeedRoute(req: FastifyRequest, reply: FastifyReply) {
  const now = Date.now();
  
  const bypassCache = (req.query as any)?.bypassCache === '1';
  const includeWatchlist = (req.query as any)?.includeWatchlist === '1';
  const includeRaw = (req.query as any)?.includeRaw === '1';
  const includeNoise = (req.query as any)?.includeNoise === '1';
  const includeLatest = (req.query as any)?.includeLatest === '1';

  if (!bypassCache && cachedFeed && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return reply.send(cachedFeed);
  }

  try {
    const ingestService = new RssIngestService();
    const clusterEngine = new ClusterEngine();
    const publishGate = new PublishGate();

    const ingestResult = await ingestService.fetchAll();
    
    const latestRssPreview: any[] = [];
    if (includeLatest) {
        const sorted = [...ingestResult.articles].sort((a, b) => b.publishedAt - a.publishedAt).slice(0, 30);
        for (const a of sorted) {
            latestRssPreview.push({
                id: a.id,
                title: a.originalTitle,
                category: a.categoryHint,
                publishDecision: "LATEST_RSS",
                publishReason: "Normal RSS feed",
                evidenceStatus: "LOW_CONFIDENCE",
                contentType: "GENERAL",
                topicQuality: "NORMAL",
                sourceCount: 1,
                reasonCode: "LatestRss",
                shortDescription: a.shortDescription,
                originalUrl: a.originalUrl,
                publishedAt: a.publishedAt,
                sourceNames: [a.sourceName]
            });
        }
    }

    const clusters = clusterEngine.clusterArticles(ingestResult.articles);

    const publishedItems: any[] = [];
    const publishedClusterIds: string[] = [];
    const watchlistClusterIds: string[] = [];
    const filteredClusterIds: string[] = [];
    const rawOnlyClusterIds: string[] = [];
    
    const watchlistPreview: any[] = [];
    const rawPreview: any[] = [];
    const noisePreview: any[] = [];

    const clusterEvaluations = new Map<string, PublishResult>();

    for (const cluster of clusters) {
      const evaluation = publishGate.evaluate(cluster);
      clusterEvaluations.set(cluster.id, evaluation);
      
      if (evaluation.decision === PublishDecision.PUBLISH_MAIN) {
        const sortedArticles = sortClusterArticles(cluster.articles);
        const leadArticle = sortedArticles[0];
        const bestTitle = leadArticle.originalTitle;
        const bestSummary = leadArticle.shortDescription;
        const combinedText = (bestTitle + ' ' + bestSummary).toLowerCase();
        const clusterUniqueSourceCount = uniqueSourceCount(cluster.articles);

        const finalCategory = resolveFeedCategory(
          combinedText,
          evaluation.contentType,
          cluster.mainCategory,
        );

        publishedItems.push({
          id: cluster.id,
          aiTitle: bestTitle,
          aiSummary: bestSummary,
          category: finalCategory,
          importance: evaluation.importance,
          confidence: evaluation.confidence,
          evidenceStatus: evaluation.evidenceStatus,
          topicQuality: evaluation.topicQuality,
          contentType: evaluation.contentType,
          publishDecision: evaluation.decision,
          publishReason: evaluation.reason,
          warningLabel: evaluation.warningLabel,
          sourceCount: cluster.articles.length,
          uniqueSourceCount: clusterUniqueSourceCount,
          filteredSourceCount: 0,
          sources: mapClusterSources(cluster.articles),
          mediaHints: null,
          originalArticleIds: cluster.articles.map(a => a.id)
        });
        publishedClusterIds.push(cluster.id);
      } else if (evaluation.decision === PublishDecision.WATCHLIST_ONLY) {
        watchlistClusterIds.push(cluster.id);
        if (includeWatchlist && watchlistPreview.length < 10) {
           watchlistPreview.push({
              id: cluster.id,
              title: cluster.articles[0].originalTitle,
              category: cluster.mainCategory,
              publishDecision: evaluation.decision,
              publishReason: evaluation.reason,
              evidenceStatus: evaluation.evidenceStatus,
              contentType: evaluation.contentType,
              topicQuality: evaluation.topicQuality,
              sourceCount: cluster.articles.length,
              reasonCode: evaluation.reason
           });
        }
      } else if (evaluation.decision === PublishDecision.RAW_ONLY) {
        rawOnlyClusterIds.push(cluster.id);
        if (includeRaw && rawPreview.length < 10) {
           rawPreview.push({
              id: cluster.id,
              title: cluster.articles[0].originalTitle,
              category: cluster.mainCategory,
              publishDecision: evaluation.decision,
              publishReason: evaluation.reason,
              evidenceStatus: evaluation.evidenceStatus,
              contentType: evaluation.contentType,
              topicQuality: evaluation.topicQuality,
              sourceCount: cluster.articles.length,
              sourceNames: Array.from(new Set(cluster.articles.map(a => a.sourceName))),
              originalUrl: cluster.articles[0].originalUrl,
              publishedAt: cluster.articles[0].publishedAt,
              shortDescription: cluster.articles[0].shortDescription,
              reasonCode: evaluation.reason
           });
        }
      } else {
        filteredClusterIds.push(cluster.id);
        if (includeNoise && noisePreview.length < 10) {
           noisePreview.push({
              id: cluster.id,
              title: cluster.articles[0].originalTitle,
              category: cluster.mainCategory,
              publishDecision: evaluation.decision,
              publishReason: evaluation.reason,
              evidenceStatus: evaluation.evidenceStatus,
              contentType: evaluation.contentType,
              topicQuality: evaluation.topicQuality,
              sourceCount: cluster.articles.length,
              reasonCode: evaluation.reason
           });
        }
      }
    }

    const publishedCount = publishedClusterIds.length;
    const watchlistCount = watchlistClusterIds.length;
    const filteredCount = filteredClusterIds.length;
    const rawOnlyCount = rawOnlyClusterIds.length;
    const hiddenCount = watchlistCount + filteredCount + rawOnlyCount;

    // Smart Digest — yalnızca PUBLISH_MAIN item'lar için (v0.6.0+)
    const digestService = new SmartDigestService();
    digestService.beginBatch();
    const itemsWithDigest = [];
    for (const item of publishedItems) {
      try {
        const digestInput = buildDigestInputFromClusterItem({
          clusterId: item.id,
          title: item.aiTitle,
          shortDescription: item.aiSummary ?? '',
          category: item.category,
          publishDecision: item.publishDecision,
          publishReason: item.publishReason,
          sourceCount: item.sourceCount,
          uniqueSourceCount: item.uniqueSourceCount,
          importance: item.importance,
          evidenceStatus: item.evidenceStatus,
          contentType: item.contentType,
          topicQuality: item.topicQuality,
          sources: item.sources.map((s: any) => ({
            sourceName: s.sourceName,
            originalTitle: s.originalTitle,
            shortDescription: item.aiSummary ?? '',
            url: s.url,
            publishedAt: s.publishedAt,
          })),
        });
        const smartDigest = await digestService.getDigest(digestInput);
        itemsWithDigest.push({ ...item, smartDigest });
      } catch (digestErr) {
        req.log.error({ err: digestErr, clusterId: item.id }, 'Smart digest failed for item');
        itemsWithDigest.push({
          ...item,
          smartDigest: {
            status: 'FAILED',
            summary: null,
            keyPoints: [],
            whyItMatters: null,
            confidence: 'LOW',
            sourcePolicy: 'METADATA_ONLY',
            modelProvider: 'disabled',
            cacheKey: '',
            generatedAt: null,
            errorCode: 'DIGEST_ATTACH_FAILED',
          },
        });
      }
    }
    const smartDigestStats = digestService.getFeedStats();

    const sourceScoreShadow = buildSourceScoreShadow({
      articles: ingestResult.articles,
      clusters,
      sourceStatuses: ingestResult.sourceStatuses,
      nowMs: now,
    });

    const leadArticleIdsByCluster = new Map<string, string>();
    for (const cluster of clusters) {
      if (publishedClusterIds.includes(cluster.id)) {
        const sorted = sortClusterArticles(cluster.articles);
        if (sorted.length > 0) {
          leadArticleIdsByCluster.set(cluster.id, sorted[0].id);
        }
      }
    }

    const itemsWithSourceSignal = attachSourceSignalsToItems(
      itemsWithDigest,
      sourceScoreShadow,
      leadArticleIdsByCluster,
    );

    const itemsByClusterId = new Map(
      itemsWithSourceSignal.map(
        (item) => [item.id, { sourceSignal: item.sourceSignal }] as const,
      ),
    );
    const sourceSignalPublishDryRun = buildSourceSignalPublishDryRun({
      clusters,
      clusterEvaluations,
      itemsByClusterId,
      shadow: sourceScoreShadow,
      leadArticleIdsByCluster,
    });

    const legalContentGuardrailDryRun = buildLegalContentGuardrailDryRun({
      items: itemsWithSourceSignal,
      registry: loadSourceRegistryV0(),
    });

    const candidateClusterCount = clusters.length;
    const totalAllocated = publishedCount + hiddenCount;
    
    let invariantOk = true;
    let invariantError: string | null = null;
    if (totalAllocated !== candidateClusterCount) {
       invariantOk = false;
       invariantError = `Allocation mismatch: allocated ${totalAllocated} != total ${candidateClusterCount}`;
       req.log.error(invariantError);
    } else if (candidateClusterCount > ingestResult.stats.rawArticleCount) {
       invariantOk = false;
       invariantError = `Cluster count ${candidateClusterCount} exceeds raw count ${ingestResult.stats.rawArticleCount}`;
       req.log.error(invariantError);
    }

    const responseDto = {
      generatedAt: Date.now(),
      isDemo: false, // Backend RSS is not a demo
      source: "BACKEND_DETERMINISTIC_RSS_V0",
      stats: {
        totalScanned: ingestResult.stats.rawArticleCount,
        candidateClusterCount,
        publishedCount,
        hiddenCount,
        watchlistCount,
        filteredCount,
        rawOnlyCount,
        sourceCount: ingestResult.stats.sourceCount,
        successfulSourceCount: ingestResult.stats.successfulSourceCount,
        failedSourceCount: ingestResult.stats.failedSourceCount,
        invariantOk,
        invariantError
      },
      debugStats: {
        rawArticleCount: ingestResult.stats.rawArticleCount,
        clusterCount: candidateClusterCount,
        publishedClusterIds,
        watchlistClusterIds,
        filteredClusterIds,
        rawOnlyClusterIds,
        engineBuildTag: "smart-feed-stats-ssot-v0.3",
        sourceScoreShadow,
        sourceSignalPublishDryRun,
        legalContentGuardrailDryRun,
      },
      items: itemsWithSourceSignal,
      smartDigestStats,
      ...(includeWatchlist && { watchlistPreview }),
      ...(includeRaw && { rawPreview }),
      ...(includeNoise && { noisePreview }),
      ...(includeLatest && { latestRssPreview })
    };

    cachedFeed = responseDto;
    cacheTimestamp = Date.now();

    return reply.send(responseDto);
  } catch (err: any) {
    req.log.error(err);
    
    if (cachedFeed) {
      return reply.send({
        ...cachedFeed,
        error: "Failed to update, returning cached data",
        meta: { fallbackAvailable: true }
      });
    }

    return reply.status(500).send({
      code: "INTERNAL_ERROR",
      message: err.message,
      fallbackAvailable: false,
      generatedAt: Date.now()
    });
  }
}
