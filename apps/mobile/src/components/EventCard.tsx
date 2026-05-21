import { StyleSheet, Text, View } from "react-native";
import type { ProcessedEvent } from "../types";
import { colors } from "../theme/colors";
import {
  categoryLabel,
  decisionLabel,
  primaryDecisionBadge,
  sourceTierLabel,
  timeAgo,
  verificationColor,
  verificationLabel,
} from "../utils/labels";

interface Props {
  event: ProcessedEvent;
  compact?: boolean;
}

const MAX_SOURCE_SUMMARY = 100;
const MAX_EXPLAIN_BODY = 140;

function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function ExplainRow({
  title,
  body,
  compact,
}: {
  title: string;
  body: string;
  compact?: boolean;
}) {
  return (
    <View style={styles.explainRow}>
      <Text style={styles.explainLabel}>{title}</Text>
      <Text style={styles.explainBody} numberOfLines={compact ? 2 : 3}>
        {truncateText(body, compact ? 100 : MAX_EXPLAIN_BODY)}
      </Text>
    </View>
  );
}

export function EventCard({ event, compact }: Props) {
  const vLabel = verificationLabel(event.verificationState);
  const vColor = verificationColor(event.verificationState);
  const dLabel = decisionLabel(event.decision);
  const primary = primaryDecisionBadge(event);

  const notificationText =
    event.notificationReason ??
    (event.decision === "notify_candidate"
      ? "Bildirim adayı"
      : "Bildirim gönderilmez");

  const suppressionText =
    event.suppressionReason ??
    event.suppressReason ??
    (event.decision === "suppress" ? "Baskılandı" : undefined);

  const verificationText =
    event.verificationSummary ?? "Teyit özeti yok";

  const sourceText = truncateText(
    event.sourceSummary ??
      `${sourceTierLabel(event.sourceQualityTier)}: ${event.sourceNames.join(", ")}`,
    compact ? MAX_SOURCE_SUMMARY - 20 : MAX_SOURCE_SUMMARY
  );

  const whyBullets = (
    event.reasonBullets.length > 0
      ? event.reasonBullets
      : ["Özet gerekçe üretilemedi"]
  ).slice(0, 3);

  return (
    <View style={styles.card}>
      <View style={styles.badges}>
        <View style={[styles.badge, { backgroundColor: vColor + "33", borderColor: vColor }]}>
          <Text style={[styles.badgeText, { color: vColor }]} numberOfLines={1}>
            {vLabel}
          </Text>
        </View>
        {primary && primary.label !== vLabel && (
          <View
            style={[
              styles.badge,
              { backgroundColor: primary.color + "33", borderColor: primary.color },
            ]}
          >
            <Text style={[styles.badgeText, { color: primary.color }]} numberOfLines={1}>
              {primary.label}
            </Text>
          </View>
        )}
        <View style={styles.badgeMuted}>
          <Text style={styles.badgeTextMuted}>{categoryLabel(event.category)}</Text>
        </View>
        {dLabel && dLabel !== primary?.label && (
          <View style={[styles.badge, { backgroundColor: colors.review + "22", borderColor: colors.review }]}>
            <Text style={[styles.badgeText, { color: colors.review }]}>{dLabel}</Text>
          </View>
        )}
        {!compact && event.marketImpactScore >= 0.6 && (
          <View style={[styles.badge, { backgroundColor: colors.finance + "22", borderColor: colors.finance }]}>
            <Text style={[styles.badgeText, { color: colors.finance }]}>
              Piyasa: {event.marketImpactScore >= 0.8 ? "Yüksek" : "Orta"}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={compact ? 2 : 3}>
        {event.title}
      </Text>
      {!compact && (
        <Text style={styles.summary} numberOfLines={2}>
          {event.summary}
        </Text>
      )}

      <View style={styles.whyBox}>
        <Text style={styles.sectionTitle}>Neden gördüm?</Text>
        {whyBullets.map((b, i) => (
          <Text key={i} style={styles.whyBullet}>
            • {b}
          </Text>
        ))}
      </View>

      <View style={styles.explainBlock}>
        <ExplainRow title="Bildirim durumu" body={notificationText} compact={compact} />
        <ExplainRow title="Kaynak / güven" body={sourceText} compact={compact} />
        {!compact && (
          <ExplainRow title="Teyit özeti" body={verificationText} />
        )}
        {event.isSocialOnly && (
          <Text style={styles.socialWarn}>
            Sosyal sinyal; bağımsız teyit yok — bildirim adayı değil.
          </Text>
        )}
        {suppressionText && (compact || event.decision === "suppress") && (
          <ExplainRow title="Baskılama" body={suppressionText} compact />
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.time}>
          {timeAgo(event.publishedAt)} · Skor {event.finalScore.toFixed(2)}
          {event.sourceQualityTier ? ` · ${sourceTierLabel(event.sourceQualityTier)}` : ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 6, rowGap: 4 },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    maxWidth: "48%",
  },
  badgeMuted: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: colors.surfaceElevated,
  },
  badgeText: { fontSize: 9, fontWeight: "700" },
  badgeTextMuted: { fontSize: 9, color: colors.textMuted, fontWeight: "600" },
  title: { color: colors.text, fontSize: 15, fontWeight: "700", lineHeight: 20, marginBottom: 4 },
  summary: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginBottom: 8 },
  whyBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  sectionTitle: { color: colors.accent, fontSize: 11, fontWeight: "700", marginBottom: 4 },
  whyBullet: { color: colors.text, fontSize: 11, lineHeight: 16 },
  explainBlock: { gap: 5, marginBottom: 6 },
  explainRow: {},
  explainLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "600", marginBottom: 1 },
  explainBody: { color: colors.text, fontSize: 11, lineHeight: 15 },
  socialWarn: {
    color: colors.early,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6 },
  time: { color: colors.textMuted, fontSize: 10 },
});
