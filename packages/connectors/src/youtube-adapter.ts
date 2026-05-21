import type { ConnectorIngestResult, SourceEvent } from "./source-event.js";

const CONNECTOR_ID = "youtube";

/**
 * YouTube Data API — MVP-2A sınırı: mock adapter.
 * Gerçek entegrasyon API key gerektirir (sonraki faz).
 */
let lastStatus: ConnectorIngestResult["status"] = {
  connectorId: CONNECTOR_ID,
  displayName: "YouTube (adapter)",
  mode: "mock",
  requiresApiKey: true,
  lastFetchAt: null,
  lastSuccessAt: null,
  lastError: null,
  itemCount: 0,
  note: "Mock sınır — YouTube Data API key MVP-2B+",
};

export function getYoutubeStatus(): ConnectorIngestResult["status"] {
  return { ...lastStatus };
}

export async function ingestYoutubeMock(): Promise<ConnectorIngestResult> {
  const now = new Date().toISOString();
  const events: SourceEvent[] = [
    {
      externalId: "mock-live-1",
      title: "[YouTube mock] Canlı yayın — kriz görüntüleri iddiası",
      summary:
        "Video tabanlı erken sinyal mock — editoryal teyit olmadan radar önceliği düşük.",
      category: "social_signal",
      publishedAt: now,
      sourceType: "social",
      sourceNames: ["YouTube (mock)"],
      sourceTrustScore: 0.32,
      tags: ["video", "mock"],
    },
  ];

  lastStatus = {
    ...lastStatus,
    mode: "mock",
    lastFetchAt: now,
    lastSuccessAt: now,
    itemCount: events.length,
    lastError: null,
    note: "Mock adapter",
  };

  return { connectorId: CONNECTOR_ID, events, status: lastStatus };
}
