import { StyleSheet, Text, View } from "react-native";
import type { ProcessedEvent } from "../types";
import { colors } from "../theme/colors";
import {
  categoryLabel,
  decisionLabel,
  timeAgo,
  verificationColor,
  verificationLabel,
} from "../utils/labels";

interface Props {
  event: ProcessedEvent;
  compact?: boolean;
}

export function EventCard({ event, compact }: Props) {
  const vLabel = verificationLabel(event.verificationState);
  const vColor = verificationColor(event.verificationState);
  const dLabel = decisionLabel(event.decision);

  return (
    <View style={styles.card}>
      <View style={styles.badges}>
        <View style={[styles.badge, { backgroundColor: vColor + "33", borderColor: vColor }]}>
          <Text style={[styles.badgeText, { color: vColor }]}>{vLabel}</Text>
        </View>
        <View style={styles.badgeMuted}>
          <Text style={styles.badgeTextMuted}>{categoryLabel(event.category)}</Text>
        </View>
        {event.marketImpactScore >= 0.6 && (
          <View style={[styles.badge, { backgroundColor: colors.finance + "22", borderColor: colors.finance }]}>
            <Text style={[styles.badgeText, { color: colors.finance }]}>
              Piyasa: {event.marketImpactScore >= 0.8 ? "Yüksek" : "Orta"}
            </Text>
          </View>
        )}
        {dLabel && (
          <View style={[styles.badge, { backgroundColor: colors.notify + "22", borderColor: colors.notify }]}>
            <Text style={[styles.badgeText, { color: colors.notify }]}>{dLabel}</Text>
          </View>
        )}
      </View>

      <Text style={styles.title}>{event.title}</Text>
      {!compact && <Text style={styles.summary} numberOfLines={3}>{event.summary}</Text>}

      <View style={styles.whyBox}>
        <Text style={styles.whyTitle}>Neden gördüm?</Text>
        {event.reasonBullets.slice(0, 4).map((b, i) => (
          <Text key={i} style={styles.whyBullet}>• {b}</Text>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.sources}>{event.sourceNames.join(" · ")}</Text>
        <Text style={styles.time}>{timeAgo(event.publishedAt)} · Skor {event.finalScore.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeMuted: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
  },
  badgeText: { fontSize: 10, fontWeight: "700" },
  badgeTextMuted: { fontSize: 10, color: colors.textMuted, fontWeight: "600" },
  title: { color: colors.text, fontSize: 16, fontWeight: "700", lineHeight: 22, marginBottom: 6 },
  summary: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 10 },
  whyBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  whyTitle: { color: colors.textMuted, fontSize: 11, fontWeight: "600", marginBottom: 4 },
  whyBullet: { color: colors.text, fontSize: 12, lineHeight: 18 },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  sources: { color: colors.textMuted, fontSize: 11, marginBottom: 2 },
  time: { color: colors.textMuted, fontSize: 10 },
});
