import type { ConnectorIngestResult, SourceEvent } from "./source-event.js";
import { socialRecordToSourceEvent } from "./social-normalize.js";
import { scoreSocialSignal } from "@haber-radari/news-core";
import type { SocialPlatformStatus, SocialSignalRecord } from "./social-signal.js";

const CONNECTOR_ID = "youtube";
const API_KEY = process.env.YOUTUBE_API_KEY?.trim();

let lastStatus: SocialPlatformStatus = {
  platform: "youtube",
  displayName: "YouTube Data API",
  mode: API_KEY ? "live" : "gated",
  requiresApiKey: true,
  lastFetchAt: null,
  lastSuccessAt: null,
  lastError: null,
  itemCount: 0,
  note: API_KEY
    ? "search.list etkin (100 quota unit / çağrı)"
    : "YOUTUBE_API_KEY yok — gated mod",
};

export function getYoutubeStatus(): ConnectorIngestResult["status"] {
  return {
    connectorId: CONNECTOR_ID,
    displayName: lastStatus.displayName,
    mode: lastStatus.mode,
    requiresApiKey: true,
    lastFetchAt: lastStatus.lastFetchAt,
    lastSuccessAt: lastStatus.lastSuccessAt,
    lastError: lastStatus.lastError,
    itemCount: lastStatus.itemCount,
    note: lastStatus.note,
  };
}

export function getYoutubeSocialStatus(): SocialPlatformStatus {
  return { ...lastStatus };
}

interface YoutubeSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    channelTitle?: string;
  };
}

export async function previewYoutubeSocial(options?: {
  q?: string;
  limit?: number;
}): Promise<{
  records: SocialSignalRecord[];
  status: SocialPlatformStatus;
}> {
  const now = new Date().toISOString();
  const q = options?.q ?? "turkey news breaking";
  const limit = Math.min(options?.limit ?? 5, 10);

  if (!API_KEY) {
    lastStatus = {
      ...lastStatus,
      mode: "gated",
      lastFetchAt: now,
      itemCount: 0,
      lastError: null,
      note: "YOUTUBE_API_KEY tanımlı değil — gated",
    };
    return { records: [], status: lastStatus };
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", String(limit));
    url.searchParams.set("q", q);
    url.searchParams.set("relevanceLanguage", "tr");
    url.searchParams.set("key", API_KEY);

    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) {
      throw new Error(`YouTube API ${res.status}`);
    }

    const data = (await res.json()) as { items?: YoutubeSearchItem[] };
    const records: SocialSignalRecord[] = (data.items ?? []).map((item, i) => {
      const vid = item.id?.videoId ?? `yt-${i}`;
      const title = item.snippet?.title ?? "YouTube video";
      const text = item.snippet?.description ?? title;
      return {
        id: `youtube-${vid}`,
        platform: "youtube",
        text,
        title,
        author: item.snippet?.channelTitle,
        displayName: item.snippet?.channelTitle,
        url: `https://www.youtube.com/watch?v=${vid}`,
        publishedAt: item.snippet?.publishedAt ?? now,
        observedAt: now,
        language: "tr",
        keywords: q.split(/\s+/).filter(Boolean),
        engagement: 0,
        isVerifiedSource: false,
        confidence: 0.48,
        requiresApiKey: true,
        mode: "live",
      };
    });

    lastStatus = {
      ...lastStatus,
      mode: "live",
      lastFetchAt: now,
      lastSuccessAt: now,
      lastError: null,
      itemCount: records.length,
      note: "YouTube search.list",
    };

    return { records, status: lastStatus };
  } catch (err) {
    lastStatus = {
      ...lastStatus,
      mode: "error",
      lastFetchAt: now,
      lastError: err instanceof Error ? err.message : String(err),
      itemCount: 0,
      note: "YouTube API hatası — sunucu ayakta kalır",
    };
    return { records: [], status: lastStatus };
  }
}

export async function ingestYoutubeMock(): Promise<ConnectorIngestResult> {
  const preview = await previewYoutubeSocial({ limit: 3 });
  const now = new Date().toISOString();

  if (preview.records.length > 0) {
    const events = preview.records.map((r) =>
      socialRecordToSourceEvent(
        r,
        scoreSocialSignal({
          confidence: r.confidence,
          isVerifiedSource: r.isVerifiedSource,
        })
      )
    );
    return {
      connectorId: CONNECTOR_ID,
      events,
      status: getYoutubeStatus(),
    };
  }

  if (!API_KEY) {
    lastStatus = {
      ...lastStatus,
      mode: "gated",
      lastFetchAt: now,
      itemCount: 0,
      note: "API key yok — ingest boş",
    };
    return {
      connectorId: CONNECTOR_ID,
      events: [],
      status: getYoutubeStatus(),
    };
  }

  const events: SourceEvent[] = [
    {
      externalId: "mock-live-1",
      title: "[YouTube fallback] Canlı yayın — kriz görüntüleri iddiası",
      summary: "YouTube API boş yanıt — fallback mock.",
      category: "social_signal",
      publishedAt: now,
      sourceType: "social",
      sourceNames: ["YouTube (fallback)"],
      sourceTrustScore: 0.32,
      tags: ["video", "fallback"],
    },
  ];

  lastStatus = {
    ...lastStatus,
    mode: "fallback",
    lastFetchAt: now,
    lastSuccessAt: now,
    itemCount: events.length,
    note: "Fallback mock",
  };

  return { connectorId: CONNECTOR_ID, events, status: getYoutubeStatus() };
}
