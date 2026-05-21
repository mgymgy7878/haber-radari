import {
  getAllConnectorStatuses,
  ingestAllForEventPool,
  ingestPreview,
  getAllSocialPlatformStatuses,
  runSocialPreview,
} from "@haber-radari/connectors";
import {
  filterNotificationCandidates,
  filterRadarEvents,
  filterSuppressed,
  processEvent,
  getQualityStats,
  processEvents,
  buildNotificationQueue,
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
let lastSocialPreviewAt: string | null = null;

async function buildEventPool(): Promise<ProcessedEvent[]> {
  const { raw: connectorRaw, statuses } = await ingestAllForEventPool();
  lastConnectorStatuses = statuses;
  const allRaw = [...SAMPLE_RAW_EVENTS, ...connectorRaw];
  const unique = new Map(allRaw.map((e) => [e.id, e]));
  return processEvents([...unique.values()]);
}

export async function refreshSocialSignalsCache(options?: {
  q?: string;
  limit?: number;
  timeoutMs?: number;
}): Promise<SocialSignal[]> {
  try {
    const preview = await runSocialPreview(options);
    if (preview.signals.length > 0) {
      cachedSignals = preview.signals;
      lastSocialPreviewAt = new Date().toISOString();
    }
  } catch {
    /* sample signals remain */
  }
  return cachedSignals;
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

export async function getNotificationQueue() {
  const events = await getAllEvents();
  const queue = buildNotificationQueue(events);
  const allCandidates = events.filter((e) => e.decision === "notify_candidate");
  const socialOnlyBlocked = allCandidates.filter((e) => e.isSocialOnly);

  return {
    count: queue.length,
    queue,
    excludedSocialOnly: socialOnlyBlocked.map((e) => ({
      eventId: e.id,
      title: e.title,
      reason: e.notificationReason,
    })),
    note: "MVP-2D: Push gönderilmez; sosyal-only adaylar kuyrukta yok.",
  };
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

export async function getSocialStatus() {
  return {
    platforms: getAllSocialPlatformStatuses(),
    lastPreviewAt: lastSocialPreviewAt,
    signalCount: cachedSignals.length,
    note: "Bluesky Jetstream önizleme; YouTube gated; X/TikTok yalnızca durum.",
  };
}

export async function getSocialPreview(query: {
  q?: string;
  limit?: number;
  timeoutMs?: number;
}) {
  const preview = await runSocialPreview(query);
  cachedSignals = preview.signals;
  lastSocialPreviewAt = new Date().toISOString();
  return preview;
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
    lastSocialPreviewAt,
    eventCount: cachedEvents?.length ?? 0,
    signalCount: cachedSignals.length,
    connectorCount: lastConnectorStatuses.length,
  };
}

export function reprocessOne(raw: Parameters<typeof processEvent>[0]): ProcessedEvent {
  return processEvent(raw);
}
