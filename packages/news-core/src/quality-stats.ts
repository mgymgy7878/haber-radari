import { countClusters } from "./dedup.js";
import type { ProcessedEvent } from "./schemas.js";

export function getQualityStats(events: ProcessedEvent[]) {
  const cluster = countClusters(events);
  const byAge = { fresh: 0, recent: 0, aging: 0, stale: 0, unknown: 0 };
  let socialOnly = 0;
  let notifyBlockedSocial = 0;

  for (const e of events) {
    byAge[e.newsAgeBand]++;
    if (e.isSocialOnly) socialOnly++;
    if (e.isSocialOnly && e.finalScore >= 0.78) notifyBlockedSocial++;
  }

  return {
    total: events.length,
    cluster,
    newsAgeBands: byAge,
    socialOnlyCount: socialOnly,
    socialOnlyWouldNotifyWithoutBlock: notifyBlockedSocial,
    decisions: {
      show: events.filter((e) => e.decision === "show").length,
      review: events.filter((e) => e.decision === "review").length,
      notify_candidate: events.filter((e) => e.decision === "notify_candidate")
        .length,
      suppress: events.filter((e) => e.decision === "suppress").length,
    },
  };
}
