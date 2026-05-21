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
  fetchNotificationQueue,
  fetchSocialStatus,
  fetchSourcesStatus,
  type ConnectorSourceStatus,
  type NotificationQueueEntry,
  type SocialPlatformStatus,
} from "../../src/api/client";
import { EventCard } from "../../src/components/EventCard";
import { colors } from "../../src/theme/colors";
import type { ProcessedEvent } from "../../src/types";

export default function SettingsScreen() {
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [candidates, setCandidates] = useState<ProcessedEvent[]>([]);
  const [suppressed, setSuppressed] = useState<ProcessedEvent[]>([]);
  const [sources, setSources] = useState<ConnectorSourceStatus[]>([]);
  const [socialPlatforms, setSocialPlatforms] = useState<SocialPlatformStatus[]>([]);
  const [notifyQueue, setNotifyQueue] = useState<NotificationQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setHealthy(await checkHealth());
    try {
      const [c, s, src, social, queue] = await Promise.all([
        fetchNotificationCandidates(),
        fetchEventsByFilter("suppressed"),
        fetchSourcesStatus().catch(() => []),
        fetchSocialStatus().catch(() => ({ platforms: [], signalCount: 0 })),
        fetchNotificationQueue().catch(() => ({
          count: 0,
          queue: [],
          excludedSocialOnly: [],
          note: "",
        })),
      ]);
      setCandidates(c);
      setSuppressed(s);
      setSources(src);
      setSocialPlatforms(social.platforms);
      setNotifyQueue(queue.queue);
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
        <Text style={styles.sectionTitle}>Kaynak durumu (MVP-2A)</Text>
        {sources.length === 0 ? (
          <Text style={styles.hint}>Kaynak listesi alınamadı — API çevrimdışı olabilir.</Text>
        ) : (
          sources.map((s) => (
            <View key={s.connectorId} style={styles.sourceRow}>
              <Text style={styles.sourceName}>
                {s.displayName} · {s.mode.toUpperCase()}
                {s.requiresApiKey ? " · key gerekir" : ""}
              </Text>
              <Text style={styles.hint}>
                {s.itemCount} kayıt{s.lastError ? ` · ${s.lastError}` : ""}
                {s.note ? ` — ${s.note}` : ""}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sosyal kaynak durumu (MVP-2D)</Text>
        <Text style={styles.hint}>
          Bluesky Jetstream önizleme; YouTube API key ile gated-live; X/TikTok onaylı token
          bekliyor.
        </Text>
        {socialPlatforms.length === 0 ? (
          <Text style={styles.hint}>Sosyal durum alınamadı.</Text>
        ) : (
          socialPlatforms.map((p) => (
            <View key={p.platform} style={styles.sourceRow}>
              <Text style={styles.sourceName}>
                {p.displayName} · {p.mode.toUpperCase()}
                {p.requiresApiKey ? " · key" : ""}
                {p.requiresApprovalOrToken ? " · onay/token" : ""}
              </Text>
              <Text style={styles.hint} numberOfLines={2}>
                {p.itemCount} kayıt{p.lastError ? ` · ${p.lastError}` : ""}
                {p.note ? ` — ${p.note}` : ""}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Bildirim kuyruğu ({notifyQueue.length}) — push yok
        </Text>
        <Text style={styles.hint}>
          Sosyal-only haberler kuyrukta değil; teyit yoksa bildirim açılmaz.
        </Text>
        {notifyQueue.slice(0, 4).map((q) => (
          <View key={q.eventId} style={styles.queueRow}>
            <Text style={styles.sourceName} numberOfLines={1}>
              {q.title}
            </Text>
            <Text style={styles.hint} numberOfLines={2}>
              {q.notificationReason}
            </Text>
          </View>
        ))}
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
          <View key={e.id} style={styles.debugCard}>
            <EventCard event={e} compact />
            <Text style={styles.debugReason} numberOfLines={3}>
              Baskı: {e.suppressionReason ?? e.suppressReason ?? "—"}
            </Text>
            <Text style={styles.debugReason} numberOfLines={2}>
              Bildirim: {e.notificationReason ?? "Gönderilmez"}
            </Text>
          </View>
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
  sourceRow: { marginBottom: 10, paddingLeft: 4 },
  sourceName: { color: colors.text, fontSize: 13, fontWeight: "600" },
  debugCard: { marginBottom: 8 },
  debugReason: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    paddingLeft: 4,
    lineHeight: 14,
  },
  queueRow: { marginBottom: 10, paddingLeft: 4 },
});
