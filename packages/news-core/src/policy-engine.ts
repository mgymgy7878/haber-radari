import { assignClusters, type ClusterAssignment } from "./cluster.js";
import { applyClusterDedup } from "./dedup.js";
import { buildEventExplainability } from "./explainability.js";
import {
  getNewsAgeBand,
  getNewsAgePenalty,
  isEvergreenCandidate,
  type NewsAgeBand,
} from "./news-age.js";
import { buildReasonBullets } from "./reason-bullets.js";
import { calculateFinalScore } from "./scoring.js";
import {
  applySourceTrustMatrix,
  getSourceQualityTier,
  isSocialOnlySource,
  type SourceQualityTier,
} from "./source-trust-matrix.js";
import type {
  EventDecision,
  ProcessedEvent,
  RawEventInput,
} from "./schemas.js";

const LOCAL_CRIME_KEYWORDS = [
  "bıçaklama",
  "bicaklama",
  "kavga",
  "yaralama",
  "cinayet",
  "gaspa",
  "soygun",
  "aile içi",
  "trafik kazası",
  "motosiklet kazası",
];

const PUBLIC_FIGURE_KEYWORDS = [
  "cumhurbaşkanı",
  "bakan",
  "milletvekili",
  "siyasetçi",
  "ceo",
  "borsa",
  "şirket",
  "ünlü",
  "sanatçı",
];

function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function resolveDecision(
  event: RawEventInput,
  finalScore: number,
  ctx: {
    newsAgeBand: NewsAgeBand;
    isSocialOnly: boolean;
    cluster?: ClusterAssignment;
  }
): { decision: EventDecision; suppressReason?: string } {
  const text = `${event.title} ${event.summary}`;
  const isLocalCrime =
    event.isLocalViolentCrime ||
    event.localCrimePenalty >= 0.6 ||
    matchesKeywords(text, LOCAL_CRIME_KEYWORDS);

  const hasPublicContext =
    event.involvesPublicFigure ||
    matchesKeywords(text, PUBLIC_FIGURE_KEYWORDS) ||
    [
      "politics",
      "celebrity",
      "geopolitics",
      "finance",
      "official",
      "disaster",
      "world",
    ].includes(event.category);

  if (isLocalCrime && !hasPublicContext) {
    return {
      decision: "suppress",
      suppressReason: "3. sayfa / yerel şiddet — varsayılan baskı",
    };
  }

  if (ctx.newsAgeBand === "unknown" && !event.isOfficialSource) {
    return { decision: "review" };
  }

  if (ctx.newsAgeBand === "stale" && !isEvergreenCandidate(event) && finalScore < 0.85) {
    return {
      decision: "suppress",
      suppressReason: "Eski haber (48 saat+) — evergreen değil",
    };
  }

  if (ctx.isSocialOnly) {
    if (event.socialVelocityScore >= 0.5) {
      return { decision: "review" };
    }
    if (finalScore < 0.5) {
      return {
        decision: "suppress",
        suppressReason: "Yalnızca sosyal sinyal — düşük güven",
      };
    }
    return { decision: "review" };
  }

  const highTrust =
    event.verificationState === "official" ||
    event.verificationState === "verified" ||
    (event.verificationState === "corroborated" &&
      event.sourceNames.length >= 2);

  if (
    finalScore >= 0.78 &&
    event.localCrimePenalty < 0.4 &&
    ctx.newsAgeBand !== "stale" &&
    ctx.newsAgeBand !== "unknown" &&
    highTrust &&
    event.importanceScore >= 0.7 &&
    !ctx.isSocialOnly
  ) {
    return { decision: "notify_candidate" };
  }

  if (
    event.verificationState === "unverified" &&
    event.socialVelocityScore >= 0.6
  ) {
    return { decision: "review" };
  }

  if (finalScore < 0.35 || event.verificationState === "suppressed") {
    return {
      decision: "suppress",
      suppressReason: "Düşük önem skoru",
    };
  }

  if (event.involvesPublicFigure && isLocalCrime) {
    return { decision: "review" };
  }

  if (
    event.involvesPublicFigure &&
    event.verificationScore < 0.7 &&
    event.verificationState !== "official" &&
    finalScore >= 0.35
  ) {
    return { decision: "review" };
  }

  if (event.clickbaitPenalty >= 0.7 && event.tabloidPenalty >= 0.5) {
    return {
      decision: "suppress",
      suppressReason: "Clickbait + sansasyon başlığı",
    };
  }

  return { decision: "show" };
}

export function processEvent(
  raw: RawEventInput,
  cluster?: ClusterAssignment
): ProcessedEvent {
  const trusted = applySourceTrustMatrix(raw);
  const evergreen = isEvergreenCandidate(trusted);
  const newsAgeBand = getNewsAgeBand(trusted.publishedAt);
  const newsAgePenalty = getNewsAgePenalty(newsAgeBand, evergreen);
  const sourceQualityTier = getSourceQualityTier(trusted);
  const isSocialOnly = isSocialOnlySource(trusted);

  const adjusted: RawEventInput = {
    ...trusted,
    noveltyScore: Math.max(0, trusted.noveltyScore - newsAgePenalty * 0.5),
  };

  const finalScore = calculateFinalScore({
    ...adjusted,
    noveltyScore: Math.max(0, adjusted.noveltyScore - newsAgePenalty * 0.15),
  });

  const { decision, suppressReason } = resolveDecision(adjusted, finalScore, {
    newsAgeBand,
    isSocialOnly,
    cluster,
  });

  const reasonBullets = buildReasonBullets({
    event: adjusted,
    decision,
    finalScore,
    newsAgeBand,
    sourceQualityTier,
    isSocialOnly,
    cluster,
    suppressReason,
    newsAgePenalty,
  });

  let verificationState = adjusted.verificationState;
  if (decision === "suppress") {
    verificationState = "suppressed";
  }

  const explain = buildEventExplainability({
    event: { ...adjusted, verificationState },
    decision,
    finalScore,
    newsAgeBand,
    sourceQualityTier,
    isSocialOnly,
    suppressReason,
  });

  return {
    ...adjusted,
    finalScore,
    decision,
    reasonBullets,
    verificationState,
    newsAgeBand,
    newsAgePenalty,
    sourceQualityTier,
    isSocialOnly,
    suppressReason,
    notificationReason: explain.notificationReason,
    suppressionReason: explain.suppressionReason,
    verificationSummary: explain.verificationSummary,
    sourceSummary: explain.sourceSummary,
    cluster: cluster
      ? {
          clusterId: cluster.clusterId,
          fingerprint: cluster.fingerprint,
          topicKey: cluster.topicKey,
          clusterSize: cluster.clusterSize,
          isClusterPrimary: cluster.isClusterPrimary,
          duplicateReason: cluster.duplicateReason,
        }
      : undefined,
  };
}

export function processEvents(rawEvents: RawEventInput[]): ProcessedEvent[] {
  const clusterMap = assignClusters(rawEvents);
  const processed = rawEvents.map((r) =>
    processEvent(r, clusterMap.get(r.id))
  );
  return applyClusterDedup(processed);
}

export function filterRadarEvents(events: ProcessedEvent[]): ProcessedEvent[] {
  return events
    .filter(
      (e) =>
        e.decision === "show" ||
        e.decision === "notify_candidate" ||
        e.decision === "review"
    )
    .sort((a, b) => b.finalScore - a.finalScore);
}

export function filterNotificationCandidates(
  events: ProcessedEvent[]
): ProcessedEvent[] {
  return events
    .filter((e) => e.decision === "notify_candidate" && !e.isSocialOnly)
    .sort((a, b) => b.finalScore - a.finalScore);
}

export function filterSuppressed(events: ProcessedEvent[]): ProcessedEvent[] {
  return events.filter((e) => e.decision === "suppress");
}

export { countClusters } from "./dedup.js";
