import type { RawEventInput } from "./schemas.js";

export function calculateFinalScore(event: RawEventInput): number {
  const raw =
    event.importanceScore * 0.25 +
    event.verificationScore * 0.25 +
    event.sourceTrustScore * 0.15 +
    event.locationRelevance * 0.1 +
    event.marketImpactScore * 0.1 +
    event.socialVelocityScore * 0.1 +
    event.noveltyScore * 0.05 -
    event.clickbaitPenalty * 0.2 -
    event.tabloidPenalty * 0.2 -
    event.localCrimePenalty * 0.35;

  return Math.max(0, Math.min(1, Number(raw.toFixed(3))));
}

export function isStaleNews(publishedAt: string, maxHours = 6): boolean {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  return ageMs > maxHours * 60 * 60 * 1000;
}

export function applyNoveltyPenalty(
  event: RawEventInput,
  maxHours = 12
): number {
  if (isStaleNews(event.publishedAt, maxHours)) {
    return Math.max(0, event.noveltyScore - 0.4);
  }
  return event.noveltyScore;
}
