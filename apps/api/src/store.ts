import {
  getAllConnectorStatuses,
  ingestAllForEventPool,
  ingestPreview,
} from "@haber-radari/connectors";
import {
  filterNotificationCandidates,
  filterRadarEvents,
  filterSuppressed,
  processEvent,
  getQualityStats,
  processEvents,
  SAMPLE_RAW_EVENTS,
  SAMPLE_SOCIAL_SIGNALS,
  type ProcessedEvent,
  type SocialSignal,
} from "@haber-radari/news-core";
import type { ConnectorStatusSnapshot } from "@haber-radari/connectors";

let cachedEvents: ProcessedEvent[] | null = null;
let cachedSignals: SocialSignal[] = SAMPLE_SOCIAL_SIGNALS;
let lastRefresh: string | null = null;
let lastConnectorStatuses: ConnectorStatusSnapshot[] = [];

async function buildEventPool(): Promise<ProcessedEvent[]> {
  const { raw: connectorRaw, statuses } = await ingestAllForEventPool();
  lastConnectorStatuses = statuses;
  const allRaw = [...SAMPLE_RAW_EVENTS, ...connectorRaw];
  const unique = new Map(allRaw.map((e) => [e.id, e]));
  return processEvents([...unique.values()]);
}

export async function getAllEvents(): Promise<ProcessedEvent[]> {
  if (!cachedEvents) {
    cachedEvents = await buildEventPool();
    lastRefresh = new Date().toISOString();
  }
  return cachedEvents;
}

export async function refreshEvents(): Promise<ProcessedEvent[]> {
  cachedEvents = await buildEventPool();
  lastRefresh = new Date().toISOString();
  return cachedEvents;
}

export function getSignals(): SocialSignal[] {
  return cachedSignals;
}

export async function getRadarEvents(): Promise<ProcessedEvent[]> {
  return filterRadarEvents(await getAllEvents());
}

export async function getFlashEvents(): Promise<ProcessedEvent[]> {
  const events = await getAllEvents();
  return events
    .filter(
      (e) =>
        (e.category === "flash" ||
          e.category === "disaster" ||
          e.category === "official" ||
          e.decision === "notify_candidate") &&
        e.decision !== "suppress"
    )
    .sort((a, b) => b.finalScore - a.finalScore);
}

export async function getFinanceEvents(): Promise<ProcessedEvent[]> {
  const events = await getAllEvents();
  return events
    .filter((e) => e.category === "finance" && e.decision !== "suppress")
    .sort((a, b) => b.marketImpactScore - a.marketImpactScore);
}

export async function getNearbyEvents(): Promise<ProcessedEvent[]> {
  const events = await getAllEvents();
  return events
    .filter(
      (e) =>
        e.locationRelevance >= 0.5 &&
        e.decision !== "suppress" &&
        (e.locationLabel || e.category === "disaster" || e.category === "local")
    )
    .sort((a, b) => b.locationRelevance - a.locationRelevance);
}

export async function getNotificationCandidates(): Promise<ProcessedEvent[]> {
  return filterNotificationCandidates(await getAllEvents());
}

export async function getSuppressedEvents(): Promise<ProcessedEvent[]> {
  return filterSuppressed(await getAllEvents());
}

export async function getSourcesStatus(): Promise<ConnectorStatusSnapshot[]> {
  if (lastConnectorStatuses.length === 0) {
    return getAllConnectorStatuses();
  }
  return lastConnectorStatuses;
}

export async function getIngestPreview() {
  const preview = await ingestPreview(3);
  const events = await getAllEvents();
  return {
    ...preview,
    quality: getQualityStats(events),
  };
}

export function getMeta() {
  return {
    lastRefresh,
    eventCount: cachedEvents?.length ?? 0,
    signalCount: cachedSignals.length,
    connectorCount: lastConnectorStatuses.length,
  };
}

export function reprocessOne(raw: Parameters<typeof processEvent>[0]): ProcessedEvent {
  return processEvent(raw);
}
