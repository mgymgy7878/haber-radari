import type { SocialSignal } from "@haber-radari/news-core";

/** Platformdan gelen ham sosyal kayıt — policy öncesi */
export type SocialPlatform =
  | "bluesky"
  | "youtube"
  | "x"
  | "tiktok"
  | "instagram"
  | "mock";

export type SocialSignalMode =
  | "live"
  | "mock"
  | "gated"
  | "fallback"
  | "error";

export interface SocialSignalRecord {
  id: string;
  platform: SocialPlatform;
  text: string;
  title: string;
  author?: string;
  displayName?: string;
  url?: string;
  publishedAt: string;
  observedAt: string;
  language?: string;
  keywords: string[];
  engagement?: number;
  isVerifiedSource: boolean;
  confidence: number;
  requiresApiKey: boolean;
  mode: SocialSignalMode;
}

export interface SocialPlatformStatus {
  platform: SocialPlatform;
  displayName: string;
  mode: SocialSignalMode;
  requiresApiKey: boolean;
  requiresApprovalOrToken?: boolean;
  lastFetchAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  itemCount: number;
  note?: string;
}

export interface SocialPreviewResult {
  ok: boolean;
  mode: SocialSignalMode;
  records: SocialSignalRecord[];
  statuses: SocialPlatformStatus[];
  signals: SocialSignal[];
  error?: string;
  timedOut?: boolean;
  elapsedMs: number;
}
