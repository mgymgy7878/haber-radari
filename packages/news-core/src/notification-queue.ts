import type { ProcessedEvent } from "./schemas.js";
import { filterNotificationCandidates } from "./policy-engine.js";

export interface NotificationQueueEntry {
  eventId: string;
  title: string;
  decision: ProcessedEvent["decision"];
  pushEligible: boolean;
  notificationReason: string;
  suppressionReason?: string;
  isSocialOnly: boolean;
  finalScore: number;
  reasonBullets: string[];
  queuedAt: string;
  note: string;
}

/**
 * Push göndermez — yalnızca bildirim adayı kuyruğu ve gerekçeleri.
 * Sosyal-only adaylar policy tarafından zaten dışlanır.
 */
export function buildNotificationQueue(
  events: ProcessedEvent[],
  queuedAt = new Date().toISOString()
): NotificationQueueEntry[] {
  const candidates = filterNotificationCandidates(events);

  return candidates.map((event) => ({
    eventId: event.id,
    title: event.title,
    decision: event.decision,
    pushEligible: false,
    notificationReason: event.notificationReason,
    suppressionReason: event.suppressionReason,
    isSocialOnly: event.isSocialOnly,
    finalScore: event.finalScore,
    reasonBullets: event.reasonBullets.slice(0, 3),
    queuedAt,
    note: "MVP-2D: Gerçek push yok; kuyruk önizlemesi.",
  }));
}
