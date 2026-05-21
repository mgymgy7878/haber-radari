import type { ProcessedEvent, SocialSignal } from "../types";
import {
  getApiConnectionHint,
  getApiNetworkProfile,
  resolveApiBaseUrl,
} from "./config";

export const API_BASE = resolveApiBaseUrl();
export const API_NETWORK_PROFILE = getApiNetworkProfile();
export const API_CONNECTION_HINT = getApiConnectionHint(API_NETWORK_PROFILE);

export function formatApiError(): string {
  const base = `API'ye bağlanılamadı (${API_BASE}).`;
  const action =
    API_NETWORK_PROFILE === "physical_needs_env"
      ? getApiConnectionHint("physical_needs_env")
      : "Sunucuyu başlatın: pnpm dev:api (proje kökünde).";
  return `${base}\n${action}`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchRadarEvents(): Promise<ProcessedEvent[]> {
  const data = await fetchJson<{ events: ProcessedEvent[] }>("/api/events");
  return data.events;
}

export async function fetchEventsByFilter(
  filter: "flash" | "finance" | "nearby" | "suppressed" | "all"
): Promise<ProcessedEvent[]> {
  const data = await fetchJson<{ events: ProcessedEvent[] }>(
    `/api/events?filter=${filter}`
  );
  return data.events;
}

export async function fetchSignals(): Promise<SocialSignal[]> {
  const data = await fetchJson<{ signals: SocialSignal[] }>("/api/signals");
  return data.signals;
}

export async function fetchNotificationCandidates(): Promise<ProcessedEvent[]> {
  const data = await fetchJson<{
    candidates: { event: ProcessedEvent }[];
  }>("/api/notification-candidates");
  return data.candidates.map((c) => c.event);
}

export async function checkHealth(): Promise<boolean> {
  try {
    const data = await fetchJson<{ status: string }>("/health");
    return data.status === "ok";
  } catch {
    return false;
  }
}

export interface ConnectorSourceStatus {
  connectorId: string;
  displayName: string;
  mode: "live" | "fallback" | "mock";
  requiresApiKey: boolean;
  lastFetchAt: string | null;
  lastError: string | null;
  itemCount: number;
  note?: string;
}

export async function fetchSourcesStatus(): Promise<ConnectorSourceStatus[]> {
  const data = await fetchJson<{ sources: ConnectorSourceStatus[] }>(
    "/api/sources/status"
  );
  return data.sources;
}

export interface SocialPlatformStatus {
  platform: string;
  displayName: string;
  mode: string;
  requiresApiKey: boolean;
  requiresApprovalOrToken?: boolean;
  lastError: string | null;
  itemCount: number;
  note?: string;
}

export async function fetchSocialStatus(): Promise<{
  platforms: SocialPlatformStatus[];
  signalCount: number;
  note?: string;
}> {
  const data = await fetchJson<{
    platforms: SocialPlatformStatus[];
    signalCount: number;
    note?: string;
  }>("/api/social/status");
  return data;
}

export interface NotificationQueueEntry {
  eventId: string;
  title: string;
  pushEligible: boolean;
  notificationReason: string;
  isSocialOnly: boolean;
  finalScore: number;
  note: string;
}

export async function fetchNotificationQueue(): Promise<{
  count: number;
  queue: NotificationQueueEntry[];
  excludedSocialOnly: Array<{ eventId: string; title: string; reason: string }>;
  note: string;
}> {
  return fetchJson("/api/notification-queue");
}
