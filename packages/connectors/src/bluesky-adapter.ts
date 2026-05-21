import { previewBlueskyJetstream } from "./bluesky-jetstream.js";
import type { ConnectorIngestResult, SourceEvent } from "./source-event.js";
import { socialRecordToSourceEvent } from "./social-normalize.js";
import { scoreSocialSignal } from "@haber-radari/news-core";
import type { SocialPlatformStatus, SocialSignalRecord } from "./social-signal.js";

const CONNECTOR_ID = "bluesky";

let lastStatus: SocialPlatformStatus = {
  platform: "bluesky",
  displayName: "Bluesky Jetstream",
  mode: "gated",
  requiresApiKey: false,
  lastFetchAt: null,
  lastSuccessAt: null,
  lastError: null,
  itemCount: 0,
  note: "Jetstream önizleme — kısa timeout ile app.bsky.feed.post",
};

export function getBlueskyStatus(): ConnectorIngestResult["status"] {
  return {
    connectorId: CONNECTOR_ID,
    displayName: lastStatus.displayName,
    mode: lastStatus.mode,
    requiresApiKey: lastStatus.requiresApiKey,
    lastFetchAt: lastStatus.lastFetchAt,
    lastSuccessAt: lastStatus.lastSuccessAt,
    lastError: lastStatus.lastError,
    itemCount: lastStatus.itemCount,
    note: lastStatus.note,
  };
}

export function getBlueskySocialStatus(): SocialPlatformStatus {
  return { ...lastStatus };
}

export async function previewBlueskySocial(options?: {
  keywords?: string[];
  limit?: number;
  timeoutMs?: number;
}): Promise<{
  records: SocialSignalRecord[];
  status: SocialPlatformStatus;
}> {
  const result = await previewBlueskyJetstream(options);
  const now = new Date().toISOString();
  lastStatus = {
    ...lastStatus,
    mode: result.mode === "live" ? "live" : result.mode === "error" ? "error" : "fallback",
    lastFetchAt: now,
    lastSuccessAt: result.records.length > 0 ? now : lastStatus.lastSuccessAt,
    lastError: result.error ?? null,
    itemCount: result.records.length,
    note: result.timedOut
      ? "Jetstream timeout — kısmi veya boş önizleme"
      : "Jetstream app.bsky.feed.post",
  };
  return { records: result.records, status: lastStatus };
}

export async function ingestBlueskyMock(): Promise<ConnectorIngestResult> {
  const preview = await previewBlueskySocial({ limit: 3, timeoutMs: 3500 });
  const now = new Date().toISOString();

  if (preview.records.length > 0) {
    const events: SourceEvent[] = preview.records.map((r) =>
      socialRecordToSourceEvent(
        r,
        scoreSocialSignal({
          confidence: r.confidence,
          engagement: r.engagement,
          isVerifiedSource: r.isVerifiedSource,
        })
      )
    );
    return {
      connectorId: CONNECTOR_ID,
      events,
      status: getBlueskyStatus(),
    };
  }

  const events: SourceEvent[] = [
    {
      externalId: "mock-trend-1",
      title: "[Bluesky fallback] Orta Doğu hashtag hızlanması",
      summary:
        "Jetstream önizleme boş veya timeout — mock erken sinyal; hakikat kaynağı değil.",
      category: "social_signal",
      publishedAt: now,
      sourceType: "social",
      sourceNames: ["Bluesky (fallback)"],
      sourceTrustScore: 0.35,
      tags: ["erken-sinyal", "fallback"],
    },
  ];

  lastStatus = {
    ...lastStatus,
    mode: "fallback",
    lastFetchAt: now,
    lastSuccessAt: now,
    itemCount: events.length,
    note: "Jetstream boş — fallback mock",
  };

  return { connectorId: CONNECTOR_ID, events, status: getBlueskyStatus() };
}
