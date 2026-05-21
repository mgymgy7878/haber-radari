import type { SocialPlatformStatus } from "./social-signal.js";

const PLATFORM = "tiktok" as const;

let lastStatus: SocialPlatformStatus = {
  platform: PLATFORM,
  displayName: "TikTok Research API",
  mode: "gated",
  requiresApiKey: true,
  requiresApprovalOrToken: true,
  lastFetchAt: null,
  lastSuccessAt: null,
  lastError: null,
  itemCount: 0,
  note: "MVP-2D: research.data.basic scope + access token; gerçek entegrasyon ertelendi.",
};

export function getTikTokSocialStatus(): SocialPlatformStatus {
  return { ...lastStatus };
}

export async function previewTikTokGated(): Promise<{
  records: [];
  status: SocialPlatformStatus;
}> {
  const now = new Date().toISOString();
  lastStatus = {
    ...lastStatus,
    mode: "gated",
    lastFetchAt: now,
    itemCount: 0,
    note: "Research API — max 30 gün aralık; scraping yok.",
  };
  return { records: [], status: lastStatus };
}
