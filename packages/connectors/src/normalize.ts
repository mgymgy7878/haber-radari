import type { RawEventInput } from "@haber-radari/news-core";
import {
  defaultVerificationForSourceType,
  resolveSourceTrustScore,
  type SourceMetadata,
} from "@haber-radari/news-core";
import type { ConnectorMode, SourceEvent } from "./source-event.js";

function stripHtml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferScores(event: SourceEvent): Pick<
  RawEventInput,
  | "importanceScore"
  | "verificationScore"
  | "locationRelevance"
  | "marketImpactScore"
  | "socialVelocityScore"
  | "noveltyScore"
> {
  const cat = event.category;
  const importance =
    event.hints?.importanceScore ??
    (cat === "finance" || cat === "geopolitics" || cat === "disaster"
      ? 0.7
      : cat === "turkey" || cat === "world"
        ? 0.6
        : 0.45);

  return {
    importanceScore: importance,
    verificationScore:
      event.sourceType === "official"
        ? 0.9
        : event.sourceType === "social"
          ? 0.25
          : 0.65,
    locationRelevance: cat === "local" || cat === "turkey" ? 0.65 : 0.25,
    marketImpactScore:
      event.hints?.marketImpactScore ?? (cat === "finance" ? 0.7 : 0.15),
    socialVelocityScore: event.sourceType === "social" ? 0.5 : 0.2,
    noveltyScore: 0.85,
  };
}

export function sourceEventToRaw(
  event: SourceEvent,
  connectorId: string,
  fetchMode: ConnectorMode
): RawEventInput {
  const sourceMetadata: SourceMetadata = {
    connectorId,
    sourceType: event.sourceType,
    fetchMode,
    refs: event.sourceNames.map((name, i) => ({
      id: `${connectorId}-${i}`,
      name,
      type: event.sourceType,
      trustScore: event.sourceTrustScore ?? 0,
    })),
    externalUrl: event.externalUrl,
    ingestedAt: new Date().toISOString(),
  };

  const sourceTrustScore = resolveSourceTrustScore(
    sourceMetadata,
    event.sourceTrustScore
  );

  for (const ref of sourceMetadata.refs) {
    ref.trustScore = sourceTrustScore;
  }

  const scores = inferScores(event);

  return {
    id: `${connectorId}-${event.externalId}`,
    title: stripHtml(event.title),
    summary: stripHtml(event.summary).slice(0, 500),
    category: event.category,
    sourceNames: event.sourceNames,
    sourceTrustScore,
    verificationState: defaultVerificationForSourceType(event.sourceType),
    ...scores,
    clickbaitPenalty: 0,
    tabloidPenalty: 0,
    localCrimePenalty: 0,
    publishedAt: event.publishedAt,
    tags: event.tags,
    locationLabel: event.locationLabel,
    involvesPublicFigure: event.hints?.involvesPublicFigure,
    isOfficialSource: event.hints?.isOfficialSource,
    sourceMetadata,
  };
}

export function sourceEventsToRaw(
  events: SourceEvent[],
  connectorId: string,
  fetchMode: ConnectorMode
): RawEventInput[] {
  return events.map((e) => sourceEventToRaw(e, connectorId, fetchMode));
}
