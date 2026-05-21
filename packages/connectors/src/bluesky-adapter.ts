import type { ConnectorIngestResult, SourceEvent } from "./source-event.js";

const CONNECTOR_ID = "bluesky";

/**
 * Bluesky Jetstream / ATProto — MVP-2A sınırı: mock adapter.
 * Gerçek API: API key / app password gerekebilir (sonraki faz).
 */
let lastStatus: ConnectorIngestResult["status"] = {
  connectorId: CONNECTOR_ID,
  displayName: "Bluesky (adapter)",
  mode: "mock",
  requiresApiKey: true,
  lastFetchAt: null,
  lastSuccessAt: null,
  lastError: null,
  itemCount: 0,
  note: "Mock sınır — gerçek Jetstream entegrasyonu MVP-2B+",
};

export function getBlueskyStatus(): ConnectorIngestResult["status"] {
  return { ...lastStatus };
}

export async function ingestBlueskyMock(): Promise<ConnectorIngestResult> {
  const now = new Date().toISOString();
  const events: SourceEvent[] = [
    {
      externalId: "mock-trend-1",
      title: "[Bluesky mock] Orta Doğu hashtag hızlanması",
      summary:
        "Sosyal erken sinyal mock — hakikat kaynağı değil; haber teyidi gerekir.",
      category: "social_signal",
      publishedAt: now,
      sourceType: "social",
      sourceNames: ["Bluesky (mock)"],
      sourceTrustScore: 0.35,
      tags: ["erken-sinyal", "mock"],
    },
  ];

  lastStatus = {
    ...lastStatus,
    mode: "mock",
    lastFetchAt: now,
    lastSuccessAt: now,
    itemCount: events.length,
    lastError: null,
    note: "Mock adapter — push/notify tetiklemez",
  };

  return { connectorId: CONNECTOR_ID, events, status: lastStatus };
}
