import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { formatApiError } from "../api/client";
import { EventCard } from "./EventCard";
import { colors } from "../theme/colors";
import type { ProcessedEvent } from "../types";

interface Props {
  title: string;
  subtitle: string;
  load: () => Promise<ProcessedEvent[]>;
}

export function EventListScreen({ title, subtitle, load }: Props) {
  const [events, setEvents] = useState<ProcessedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const data = await load();
      setEvents(data);
    } catch {
      setError(formatApiError());
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <EventCard event={item} />}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.accent} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {error && <Text style={styles.error}>{error}</Text>}
          {!error && (
            <Text style={styles.count}>{events.length} gelişme</Text>
          )}
        </View>
      }
      ListEmptyComponent={
        !error ? (
          <Text style={styles.empty}>Gösterilecek olay yok.</Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  list: { padding: 16, paddingBottom: 32, backgroundColor: colors.bg },
  header: { marginBottom: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 8 },
  count: { color: colors.accent, fontSize: 12, fontWeight: "600" },
  error: { color: colors.notify, fontSize: 12, marginTop: 8, lineHeight: 18 },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: 40 },
});
