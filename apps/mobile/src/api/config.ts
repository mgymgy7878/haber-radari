import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = 3001;

/** Expo build-time public env (no secrets) */
function readEnvApiUrl(): string | undefined {
  const url = process.env.EXPO_PUBLIC_API_URL;
  return url?.replace(/\/$/, "") || undefined;
}

/**
 * Android AVD emülatörü → bilgisayardaki API: 10.0.2.2
 * iOS simülatör / web → localhost
 * Fiziksel cihaz (Expo Go) → EXPO_PUBLIC_API_URL zorunlu (LAN IP)
 */
export function resolveApiBaseUrl(): string {
  const fromEnv = readEnvApiUrl();
  if (fromEnv) return fromEnv;

  if (Platform.OS === "android" && !Constants.isDevice) {
    return `http://10.0.2.2:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
}

export type ApiNetworkProfile =
  | "env"
  | "android_emulator"
  | "localhost"
  | "physical_needs_env";

export function getApiNetworkProfile(): ApiNetworkProfile {
  if (readEnvApiUrl()) return "env";
  if (Platform.OS === "android" && !Constants.isDevice) return "android_emulator";
  if (Platform.OS === "android" && Constants.isDevice) return "physical_needs_env";
  return "localhost";
}

export function getApiConnectionHint(profile: ApiNetworkProfile): string {
  switch (profile) {
    case "env":
      return "API adresi ortam değişkeninden alındı.";
    case "android_emulator":
      return "Android emülatör: API otomatik 10.0.2.2 üzerinden.";
    case "physical_needs_env":
      return (
        "Fiziksel Android (Expo Go): EXPO_PUBLIC_API_URL ile bilgisayarınızın LAN IP'sini verin. " +
        "Örnek: http://192.168.1.50:3001 — ardından pnpm dev:mobile yeniden başlatın."
      );
    default:
      return "iOS simülatör veya web: localhost. Fiziksel iPhone için LAN IP gerekir.";
  }
}
