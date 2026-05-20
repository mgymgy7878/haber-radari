import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { formatApiError, fetchSignals } from "../../src/api/client";
import { SignalCard } from "../../src/components/SignalCard";
import { colors } from "../../src/theme/colors";
import type { SocialSignal } from "../../src/types";

export default function SignalsScreen() {
  const [signals, setSignals] = useState<SocialSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setSignals(await fetchSignals());
    } catch {
      setError(formatApiError());
    } finally {
      setLoading(false);
    }
  }, []);

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
      data={signals}
      keyExtractor={(s) => s.id}
      renderItem={({ item }) => <SignalCard signal={item} />}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.accent} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Sinyaller</Text>
          <Text style={styles.subtitle}>
            X, Bluesky, YouTube — erken sinyal; hakikat kaynağı değil
          </Text>
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  list: { padding: 16, backgroundColor: colors.bg },
  header: { marginBottom: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  error: { color: colors.notify, fontSize: 12, marginTop: 8 },
});
