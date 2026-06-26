import {
  scoreSocialSignal,
  type SocialScoreFields,
} from "@haber-radari/news-core";
import type { SocialSignal } from "@haber-radari/news-core";
import type { SourceEvent } from "./source-event.js";
import type { SocialSignalRecord } from "./social-signal.js";

export function socialRecordToSourceEvent(
  record: SocialSignalRecord,
  scores: SocialScoreFields
): SourceEvent {
  return {
    externalId: record.id,
    title: record.title,
    summary: record.text,
    category: "social_signal",
    publishedAt: record.publishedAt,
    sourceType: "social",
    sourceNames: [
      record.platform === "bluesky"
        ? "Bluesky"
        : record.platform === "youtube"
          ? "YouTube"
          : record.platform,
    ],
    sourceTrustScore: scores.verifiedSourceMatch ? 0.55 : 0.35,
    tags: [...record.keywords, "social-pipeline", record.mode],
    externalUrl: record.url,
    hints: {
      importanceScore: scores.socialVelocityScore * 0.6,
      involvesPublicFigure: false,
      isOfficialSource: record.isVerifiedSource,
    },
  };
}

export function socialRecordsToSignals(
  records: SocialSignalRecord[]
): SocialSignal[] {
  return records.map((r, i) => {
    const scores = scoreSocialSignal({
      confidence: r.confidence,
      engagement: r.engagement,
      isVerifiedSource: r.isVerifiedSource,
      sourceNames: [r.platform],
    });

    return {
      id: r.id || `social-${i}`,
      title: r.title,
      summary: r.text,
      keywords: r.keywords,
      platforms: [
        {
          name:
            r.platform === "bluesky"
              ? "Bluesky"
              : r.platform === "youtube"
                ? "YouTube"
                : r.platform,
          postCount: Math.round((r.engagement ?? 0) + scores.socialVelocityScore * 100),
        },
      ],
      velocityScore: scores.socialVelocityScore,
      status: scores.verifiedSourceMatch ? "corroborating" : "tracking",
      relatedEventIds: [],
      detectedAt: r.observedAt,
      verificationState: r.isVerifiedSource ? "corroborated" : "unverified",
    };
  });
}
