import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  API_BASE,
  API_CONNECTION_HINT,
  API_NETWORK_PROFILE,
  checkHealth,
  fetchEventsByFilter,
  fetchNotificationCandidates,
} from "../../src/api/client";
import { EventCard } from "../../src/components/EventCard";
import { colors } from "../../src/theme/colors";
import type { ProcessedEvent } from "../../src/types";

export default function SettingsScreen() {
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [candidates, setCandidates] = useState<ProcessedEvent[]>([]);
  const [suppressed, setSuppressed] = useState<ProcessedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setHealthy(await checkHealth());
    try {
      const [c, s] = await Promise.all([
        fetchNotificationCandidates(),
        fetchEventsByFilter("suppressed"),
      ]);
      setCandidates(c);
      setSuppressed(s);
    } catch {
      /* API offline */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ayarlar</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bağlantı</Text>
        <Text style={styles.row}>API: {API_BASE}</Text>
        <Text style={styles.row}>Profil: {API_NETWORK_PROFILE}</Text>
        <Text style={styles.hint}>{API_CONNECTION_HINT}</Text>
        <Text style={styles.row}>
          Durum:{" "}
          {healthy === null ? "…" : healthy ? "Çevrimiçi" : "Çevrimdışı"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Filtre politikası (MVP-1)</Text>
        <Text style={styles.bullet}>• 3. sayfa yerel şiddet → baskıla</Text>
        <Text style={styles.bullet}>• Kamu figürü / siyaset → incele veya göster</Text>
        <Text style={styles.bullet}>• Sosyal medya tek başına push yok</Text>
        <Text style={styles.bullet}>• Eski haber cezası (6–24 saat)</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Bildirim adayları ({candidates.length}) — push gönderilmez
        </Text>
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          candidates.map((e) => <EventCard key={e.id} event={e} compact />)
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Baskılanan haberler — debug ({suppressed.length})
        </Text>
        <Text style={styles.hint}>
          Mahalle kavgası, bıçaklama, clickbait vb. burada görünür; ana akışta değil.
        </Text>
        {suppressed.map((e) => (
          <EventCard key={e.id} event={e} compact />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800", marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { color: colors.accent, fontSize: 14, fontWeight: "700", marginBottom: 8 },
  row: { color: colors.textMuted, fontSize: 13, marginBottom: 4 },
  bullet: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  hint: { color: colors.textMuted, fontSize: 12, marginBottom: 10, fontStyle: "italic" },
});
