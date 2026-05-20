import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "../../src/theme/colors";

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Radar", tabBarIcon: tabIcon("radio-outline") }}
      />
      <Tabs.Screen
        name="flash"
        options={{ title: "Flaş", tabBarIcon: tabIcon("flash-outline") }}
      />
      <Tabs.Screen
        name="nearby"
        options={{ title: "Yakınımda", tabBarIcon: tabIcon("location-outline") }}
      />
      <Tabs.Screen
        name="finance"
        options={{ title: "Finans", tabBarIcon: tabIcon("trending-up-outline") }}
      />
      <Tabs.Screen
        name="signals"
        options={{ title: "Sinyaller", tabBarIcon: tabIcon("pulse-outline") }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Ayarlar", tabBarIcon: tabIcon("settings-outline") }}
      />
    </Tabs>
  );
}
