import { SAMPLE_SOCIAL_SIGNALS, type SocialSignal } from "@haber-radari/news-core";
import {
  getBlueskySocialStatus,
  previewBlueskySocial,
} from "./bluesky-adapter.js";
import { socialRecordsToSignals } from "./social-normalize.js";
import type { SocialPreviewResult, SocialPlatformStatus } from "./social-signal.js";
import { getTikTokSocialStatus, previewTikTokGated } from "./tiktok-adapter.js";
import { getXSocialStatus, previewXGated } from "./x-adapter.js";
import {
  getYoutubeSocialStatus,
  previewYoutubeSocial,
} from "./youtube-adapter.js";

export function getAllSocialPlatformStatuses(): SocialPlatformStatus[] {
  return [
    getBlueskySocialStatus(),
    getYoutubeSocialStatus(),
    getXSocialStatus(),
    getTikTokSocialStatus(),
  ];
}

function parseQueryKeywords(q?: string): string[] | undefined {
  if (!q?.trim()) return undefined;
  return q
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
}

/** Tüm sosyal platformlardan kısa önizleme — API'yi kilitlemez. */
export async function runSocialPreview(options?: {
  q?: string;
  limit?: number;
  timeoutMs?: number;
}): Promise<SocialPreviewResult> {
  const started = Date.now();
  const limit = Math.min(options?.limit ?? 5, 15);
  const timeoutMs = Math.min(Math.max(options?.timeoutMs ?? 5000, 1000), 20000);
  const keywords = parseQueryKeywords(options?.q);

  const [bluesky, youtube, xGate, tiktokGate] = await Promise.all([
    previewBlueskySocial({ keywords, limit, timeoutMs }),
    previewYoutubeSocial({ q: options?.q ?? "turkey breaking news", limit }),
    previewXGated(),
    previewTikTokGated(),
  ]);

  const statuses: SocialPlatformStatus[] = [
    bluesky.status,
    youtube.status,
    xGate.status,
    tiktokGate.status,
  ];
  const records = [...bluesky.records, ...youtube.records];
  const liveSignals = socialRecordsToSignals(records);
  const sampleSlice = SAMPLE_SOCIAL_SIGNALS.slice(
    0,
    Math.max(0, 6 - liveSignals.length)
  );
  const signals: SocialSignal[] = [...liveSignals, ...sampleSlice];

  const elapsedMs = Date.now() - started;
  const hasLive = records.some((r) => r.mode === "live");
  const mode = hasLive ? "live" : records.length > 0 ? "fallback" : "gated";

  return {
    ok: true,
    mode,
    records,
    statuses,
    signals,
    timedOut: Boolean(bluesky.status.note?.includes("timeout")),
    elapsedMs,
    error:
      records.length === 0
        ? "Canlı önizleme boş — gated/fallback/mock örnekler kullanılabilir"
        : undefined,
  };
}
