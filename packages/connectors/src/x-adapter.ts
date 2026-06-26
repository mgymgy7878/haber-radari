import type { SocialPlatformStatus } from "./social-signal.js";

const PLATFORM = "x" as const;

let lastStatus: SocialPlatformStatus = {
  platform: PLATFORM,
  displayName: "X (Filtered Stream)",
  mode: "gated",
  requiresApiKey: true,
  requiresApprovalOrToken: true,
  lastFetchAt: null,
  lastSuccessAt: null,
  lastError: null,
  itemCount: 0,
  note: "MVP-2D: Bearer token / erişim seviyesi gerekir; gerçek entegrasyon ertelendi.",
};

export function getXSocialStatus(): SocialPlatformStatus {
  return { ...lastStatus };
}

/** Gerçek API çağrısı yok — yalnızca sözleşme / durum */
export async function previewXGated(): Promise<{
  records: [];
  status: SocialPlatformStatus;
}> {
  const now = new Date().toISOString();
  lastStatus = {
    ...lastStatus,
    mode: "gated",
    lastFetchAt: now,
    itemCount: 0,
    note: "Filtered Stream — scraping yok; onaylı token gerekir.",
  };
  return { records: [], status: lastStatus };
}
