import type { EventCategory, RawEventInput } from "./schemas.js";

export interface ClusterAssignment {
  clusterId: string;
  fingerprint: string;
  topicKey: string;
  clusterSize: number;
  isClusterPrimary: boolean;
  duplicateReason?: string;
}

const TR_STOP = new Set([
  "ve",
  "ile",
  "için",
  "bir",
  "bu",
  "da",
  "de",
  "den",
  "dan",
  "the",
  "a",
  "an",
]);

export function titleFingerprint(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !TR_STOP.has(w))
    .slice(0, 12)
    .join("-");
}

export function topicKey(category: EventCategory, tags?: string[]): string {
  const tagPart = (tags ?? []).slice(0, 2).join("-").toLowerCase();
  return tagPart ? `${category}:${tagPart}` : category;
}

function clusterIdFor(fingerprint: string, topic: string): string {
  const fp = fingerprint.slice(0, 48) || "empty";
  return `cl-${topic}-${fp}`.replace(/[^a-z0-9:-]/g, "").slice(0, 64);
}

function titleSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const wa = new Set(a.split("-"));
  const wb = new Set(b.split("-"));
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  const union = wa.size + wb.size - inter;
  return union === 0 ? 0 : inter / union;
}

interface ClusterBucket {
  clusterId: string;
  topic: string;
  fingerprint: string;
  memberIds: string[];
}

export function assignClusters(
  events: RawEventInput[]
): Map<string, ClusterAssignment> {
  const buckets: ClusterBucket[] = [];

  for (const e of events) {
    const fp = titleFingerprint(e.title);
    const topic = topicKey(e.category, e.tags);

    let bucketIdx = -1;
    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i];
      if (
        b.topic === topic &&
        titleSimilarity(fp, b.fingerprint) >= 0.55
      ) {
        bucketIdx = i;
        break;
      }
    }

    if (bucketIdx < 0) {
      bucketIdx = buckets.length;
      buckets.push({
        clusterId: clusterIdFor(fp, topic),
        topic,
        fingerprint: fp,
        memberIds: [],
      });
    }

    buckets[bucketIdx].memberIds.push(e.id);
  }

  const eventById = new Map(events.map((e) => [e.id, e]));
  const result = new Map<string, ClusterAssignment>();

  for (const bucket of buckets) {
    const members = bucket.memberIds
      .map((id) => eventById.get(id)!)
      .filter(Boolean);
    const sorted = [...members].sort(
      (a, b) =>
        b.importanceScore - a.importanceScore ||
        b.sourceTrustScore - a.sourceTrustScore
    );
    const primary = sorted[0];
    const size = members.length;

    for (const e of members) {
      const isPrimary = e.id === primary?.id;
      result.set(e.id, {
        clusterId: bucket.clusterId,
        fingerprint: titleFingerprint(e.title),
        topicKey: topicKey(e.category, e.tags),
        clusterSize: size,
        isClusterPrimary: isPrimary,
        duplicateReason: isPrimary
          ? undefined
          : `Aynı olay kümesinde tekrar (${size} kayıt)`,
      });
    }
  }

  return result;
}
