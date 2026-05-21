import { StyleSheet, Text, View } from "react-native";
import type { SocialSignal } from "../types";
import { colors } from "../theme/colors";
import { timeAgo } from "../utils/labels";

interface Props {
  signal: SocialSignal;
}

const statusLabels: Record<string, string> = {
  tracking: "Takip ediliyor",
  corroborating: "Teyit aranıyor",
  verified: "Doğrulandı",
  debunked: "Çürütüldü / yanlış alarm",
};

export function SignalCard({ signal }: Props) {
  const platformStr = signal.platforms
    .map((p) => `${p.name} ${p.postCount}`)
    .join(" · ");

  return (
    <View style={styles.card}>
      <View style={styles.badges}>
        <View style={[styles.badge, { borderColor: colors.early, backgroundColor: colors.early + "22" }]}>
          <Text style={[styles.badgeText, { color: colors.early }]}>ERKEN SİNYAL</Text>
        </View>
        <View style={styles.badgeMuted}>
          <Text style={styles.badgeTextMuted}>{statusLabels[signal.status] ?? signal.status}</Text>
        </View>
      </View>

      <Text style={styles.title}>{signal.title}</Text>
      <Text style={styles.summary}>{signal.summary}</Text>

      <Text style={styles.meta}>Kaynaklar: {platformStr}</Text>
      <Text style={styles.meta}>
        Durum: {signal.verificationState === "unverified" ? "Haber kaynaklarında teyit aranıyor" : "Kısmi teyit"}
      </Text>
      <Text style={styles.meta}>Bildirim: Kapalı — bildirim adayı değil</Text>
      <Text style={styles.socialWarn}>
        Sosyal sinyal; bağımsız teyit yok — hakikat kaynağı sayılmaz.
      </Text>
      <Text style={styles.time}>Hız skoru {(signal.velocityScore * 100).toFixed(0)}% · {timeAgo(signal.detectedAt)}</Text>
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
  badgeTextMuted: { fontSize: 10, color: colors.textMuted },
  title: { color: colors.text, fontSize: 15, fontWeight: "700", marginBottom: 6 },
  summary: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 8 },
  meta: { color: colors.textMuted, fontSize: 12, marginBottom: 4 },
  socialWarn: {
    color: colors.early,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 14,
    marginBottom: 4,
  },
  time: { color: colors.textMuted, fontSize: 10, marginTop: 6 },
});
