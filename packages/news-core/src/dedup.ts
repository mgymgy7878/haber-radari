import type { ProcessedEvent } from "./schemas.js";

/** Kümede birincil olmayan düşük skorlu tekrarları baskıla */
export function applyClusterDedup(events: ProcessedEvent[]): ProcessedEvent[] {
  return events.map((e) => {
    if (!e.cluster || e.cluster.clusterSize <= 1 || e.cluster.isClusterPrimary) {
      return e;
    }

    if (e.decision === "suppress") {
      return {
        ...e,
        suppressReason:
          e.suppressReason ??
          e.cluster.duplicateReason ??
          "Küme tekrarı (zaten baskılanmış)",
      };
    }

    if (e.finalScore < 0.72) {
      return {
        ...e,
        decision: "suppress" as const,
        verificationState: "suppressed" as const,
        suppressReason: e.cluster.duplicateReason ?? "Küme tekrarı — düşük skor",
        reasonBullets: [
          ...e.reasonBullets,
          "Tekrarlayan haber — küme birinciliği dışında baskılandı",
        ],
      };
    }

    return e;
  });
}

export function countClusters(events: ProcessedEvent[]): {
  totalClusters: number;
  multiMemberClusters: number;
  suppressedAsDuplicate: number;
} {
  const ids = new Set<string>();
  let multi = 0;
  let dupSuppress = 0;

  for (const e of events) {
    if (e.cluster) {
      if (!ids.has(e.cluster.clusterId)) {
        ids.add(e.cluster.clusterId);
        if (e.cluster.clusterSize > 1) multi++;
      }
    }
    if (
      e.decision === "suppress" &&
      e.cluster &&
      !e.cluster.isClusterPrimary &&
      (e.suppressReason?.toLowerCase().includes("küme") ||
        !!e.cluster.duplicateReason)
    ) {
      dupSuppress++;
    }
  }

  return {
    totalClusters: ids.size,
    multiMemberClusters: multi,
    suppressedAsDuplicate: dupSuppress,
  };
}
