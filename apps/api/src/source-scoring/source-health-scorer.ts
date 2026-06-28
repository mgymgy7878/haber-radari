import { resolveAuthorityTier, extractDomain } from './authority-tier-resolver.js';
import type {
  ArticleSourceScoreOverlay,
  ClusterConfirmationInput,
  SourceHealthInput,
  SourceScore,
} from './source-score-types.js';

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function computeFreshnessScore(latestPublishedAt: number | null, nowMs: number): number {
  if (latestPublishedAt == null) return 35;
  const ageHours = (nowMs - latestPublishedAt) / (60 * 60 * 1000);
  if (ageHours <= 6) return 100;
  if (ageHours <= 24) return 80;
  if (ageHours <= 48) return 60;
  return 40;
}

function computeMetadataCompletenessScore(
  articles: SourceHealthInput['articles'],
  skippedMissingMetadataCount: number,
): number {
  if (articles.length === 0 && skippedMissingMetadataCount > 0) return 20;
  if (articles.length === 0) return 50;

  const complete = articles.filter(
    (a) =>
      a.originalTitle.trim().length > 0 &&
      a.originalUrl.trim().length > 0 &&
      a.publishedAt > 0 &&
      a.shortDescription.trim().length > 0,
  ).length;

  const ratio = complete / articles.length;
  const skipPenalty = Math.min(30, skippedMissingMetadataCount * 5);
  return clampScore(ratio * 100 - skipPenalty);
}

export function computeDuplicateConfirmationBoost(uniqueSourceCount: number): number {
  if (uniqueSourceCount >= 3) return 15;
  if (uniqueSourceCount === 2) return 10;
  return 0;
}

export function scoreSourceHealth(input: SourceHealthInput): SourceScore {
  const { tier, authorityScore, reasons: tierReasons } = resolveAuthorityTier({
    id: input.sourceId,
    name: input.sourceName,
    url: input.sourceUrl,
    trustTier: input.trustTier,
    enabled: input.enabled,
  });

  const reasons = [...tierReasons];
  const fetchOk = input.fetchStatus?.success ?? input.articles.length > 0;
  const skippedMissing = input.fetchStatus?.skippedMissingMetadataCount ?? 0;

  const failurePenalty = fetchOk ? 0 : 45;
  if (failurePenalty > 0) {
    reasons.push('Son RSS/API fetch başarısız — sağlık cezası');
  }

  const metadataCompletenessScore = computeMetadataCompletenessScore(
    input.articles,
    skippedMissing,
  );
  if (metadataCompletenessScore < 70) {
    reasons.push('Metadata eksikliği (title/link/time/description) sağlık sinyali');
  }

  const latestPublished =
    input.articles.length > 0
      ? Math.max(...input.articles.map((a) => a.publishedAt))
      : null;
  const freshnessScore = computeFreshnessScore(latestPublished, input.nowMs);
  if (freshnessScore < 60) {
    reasons.push('Kaynak tazeliği düşük (48s+ veya veri yok)');
  }

  const healthScore = clampScore(
    100 - failurePenalty - (100 - metadataCompletenessScore) * 0.25 - (100 - freshnessScore) * 0.15,
  );

  const finalSourceScore = clampScore(
    authorityScore * 0.5 + healthScore * 0.35 + metadataCompletenessScore * 0.1 + freshnessScore * 0.05,
  );

  return {
    sourceId: input.sourceId,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    sourceDomain: extractDomain(input.sourceUrl),
    authorityTier: tier,
    authorityScore,
    healthScore,
    freshnessScore,
    metadataCompletenessScore,
    failurePenalty,
    duplicateConfirmationBoost: 0,
    finalSourceScore,
    reasons,
  };
}

export function buildArticleOverlays(
  sourceScoresById: Map<string, SourceScore>,
  clusters: ClusterConfirmationInput[],
  articleSourceMap: Map<string, string>,
): { overlays: ArticleSourceScoreOverlay[]; clusterConfirmation: SourceScoreShadowCluster[] } {
  const overlays: ArticleSourceScoreOverlay[] = [];
  const clusterConfirmation: SourceScoreShadowCluster[] = [];

  for (const cluster of clusters) {
    const boost = computeDuplicateConfirmationBoost(cluster.uniqueSourceCount);
    clusterConfirmation.push({
      clusterId: cluster.clusterId,
      uniqueSourceCount: cluster.uniqueSourceCount,
      duplicateConfirmationBoost: boost,
    });

    for (const articleId of cluster.articleIds) {
      const sourceId = articleSourceMap.get(articleId);
      if (!sourceId) continue;
      const base = sourceScoresById.get(sourceId);
      if (!base) continue;

      const overlayReasons = [...base.reasons];
      if (boost > 0) {
        overlayReasons.push(`Çoklu kaynak teyidi boost: +${boost} (${cluster.uniqueSourceCount} kaynak)`);
      } else if (cluster.uniqueSourceCount === 1) {
        overlayReasons.push('Tek kaynak — çoklu teyit boost yok');
      }

      overlays.push({
        articleId,
        sourceId,
        duplicateConfirmationBoost: boost,
        finalSourceScore: clampScore(base.finalSourceScore + boost),
        reasons: overlayReasons,
      });
    }
  }

  return { overlays, clusterConfirmation };
}

export interface SourceScoreShadowCluster {
  clusterId: string;
  uniqueSourceCount: number;
  duplicateConfirmationBoost: number;
}
