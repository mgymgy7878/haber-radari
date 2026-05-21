import type { RawEventInput } from "@haber-radari/news-core";
import { ingestBlueskyMock, getBlueskyStatus } from "./bluesky-adapter.js";
import { ingestGdelt, getGdeltStatus } from "./gdelt.js";
import type { ConnectorIngestResult, ConnectorStatusSnapshot } from "./source-event.js";
import { sourceEventsToRaw } from "./normalize.js";
import { ingestTrtRss, getTrtRssStatus } from "./trt-rss.js";
import { ingestYoutubeMock, getYoutubeStatus } from "./youtube-adapter.js";

export type ConnectorRegistryEntry = {
  id: string;
  ingest: () => Promise<ConnectorIngestResult>;
  getStatus: () => ConnectorStatusSnapshot;
  includeInEventPool: boolean;
};

export const CONNECTOR_REGISTRY: ConnectorRegistryEntry[] = [
  {
    id: "trt-rss",
    ingest: () => ingestTrtRss(["sonDakika", "turkiye"]),
    getStatus: getTrtRssStatus,
    includeInEventPool: true,
  },
  {
    id: "gdelt",
    ingest: ingestGdelt,
    getStatus: getGdeltStatus,
    includeInEventPool: true,
  },
  {
    id: "bluesky",
    ingest: ingestBlueskyMock,
    getStatus: getBlueskyStatus,
    includeInEventPool: false,
  },
  {
    id: "youtube",
    ingest: ingestYoutubeMock,
    getStatus: getYoutubeStatus,
    includeInEventPool: false,
  },
];

export async function getAllConnectorStatuses(): Promise<ConnectorStatusSnapshot[]> {
  return CONNECTOR_REGISTRY.map((c) => c.getStatus());
}

export async function ingestAllForEventPool(): Promise<{
  raw: RawEventInput[];
  statuses: ConnectorStatusSnapshot[];
}> {
  const raw: RawEventInput[] = [];
  const statuses: ConnectorStatusSnapshot[] = [];

  for (const entry of CONNECTOR_REGISTRY) {
    if (!entry.includeInEventPool) {
      statuses.push(entry.getStatus());
      continue;
    }
    try {
      const result = await entry.ingest();
      statuses.push(result.status);
      raw.push(
        ...sourceEventsToRaw(
          result.events,
          result.connectorId,
          result.status.mode
        )
      );
    } catch (err) {
      statuses.push({
        ...entry.getStatus(),
        lastError: err instanceof Error ? err.message : String(err),
        mode: "fallback",
      });
    }
  }

  return { raw, statuses };
}

/** Canlı ingest önizlemesi — event pool'a yazmaz */
export async function ingestPreview(limitPerConnector = 3): Promise<{
  previews: Array<{
    connectorId: string;
    status: ConnectorStatusSnapshot;
    sampleTitles: string[];
  }>;
}> {
  const previews = [];

  for (const entry of CONNECTOR_REGISTRY) {
    try {
      const result = await entry.ingest();
      previews.push({
        connectorId: result.connectorId,
        status: result.status,
        sampleTitles: result.events.slice(0, limitPerConnector).map((e) => e.title),
      });
    } catch (err) {
      const st = entry.getStatus();
      previews.push({
        connectorId: entry.id,
        status: {
          ...st,
          lastError: err instanceof Error ? err.message : String(err),
          mode: "fallback" as const,
        },
        sampleTitles: [],
      });
    }
  }

  return { previews };
}
