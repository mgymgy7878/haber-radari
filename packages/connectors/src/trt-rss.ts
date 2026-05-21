import type { EventCategory, RawEventInput } from "@haber-radari/news-core";
import { sourceEventsToRaw } from "./normalize.js";
import type { ConnectorIngestResult, SourceEvent } from "./source-event.js";

export const TRT_RSS_FEEDS = {
  sonDakika: "https://www.trthaber.com/rss/sondakika.rss",
  turkiye: "https://www.trthaber.com/rss/turkiye.rss",
  dunya: "https://www.trthaber.com/rss/dunya.rss",
  ekonomi: "https://www.trthaber.com/rss/ekonomi.rss",
} as const;

const CONNECTOR_ID = "trt-rss";
const FETCH_TIMEOUT_MS = 12_000;
const MAX_ITEMS_PER_FEED = 5;

export interface TrtRssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? decodeXmlEntities(m[1].trim()) : "";
}

export function parseRssXml(xml: string): TrtRssItem[] {
  const items: TrtRssItem[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of itemBlocks.slice(0, MAX_ITEMS_PER_FEED)) {
    const title = extractTag(block, "title");
    if (!title) continue;
    items.push({
      title,
      link: extractTag(block, "link"),
      pubDate: extractTag(block, "pubDate"),
      description: extractTag(block, "description"),
    });
  }
  return items;
}

function categoryFromFeedKey(key: keyof typeof TRT_RSS_FEEDS): EventCategory {
  switch (key) {
    case "ekonomi":
      return "finance";
    case "dunya":
      return "world";
    case "sonDakika":
      return "flash";
    default:
      return "turkey";
  }
}

async function fetchFeed(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/rss+xml, application/xml, text/xml" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function itemsToSourceEvents(
  items: TrtRssItem[],
  feedKey: keyof typeof TRT_RSS_FEEDS
): SourceEvent[] {
  const category = categoryFromFeedKey(feedKey);
  return items.map((item, idx) => {
    const publishedAt = item.pubDate
      ? new Date(item.pubDate).toISOString()
      : new Date().toISOString();
    const externalId = `${feedKey}-${Buffer.from(item.link || item.title)
      .toString("base64url")
      .slice(0, 24)}-${idx}`;

    return {
      externalId,
      title: item.title,
      summary: item.description || item.title,
      category,
      publishedAt,
      sourceType: "editorial" as const,
      sourceNames: ["TRT Haber"],
      sourceTrustScore: 0.88,
      externalUrl: item.link,
      tags: [feedKey],
    };
  });
}

function fallbackEvents(): SourceEvent[] {
  return [
    {
      externalId: "fallback-1",
      title: "[TRT fallback] Kaynak geçici olarak alınamadı",
      summary:
        "TRT RSS ağına ulaşılamadı; örnek/fallback modu. Ağ veya feed erişimini kontrol edin.",
      category: "turkey",
      publishedAt: new Date().toISOString(),
      sourceType: "editorial",
      sourceNames: ["TRT Haber (fallback)"],
      sourceTrustScore: 0.88,
    },
  ];
}

let lastStatus: ConnectorIngestResult["status"] = {
  connectorId: CONNECTOR_ID,
  displayName: "TRT Haber RSS",
  mode: "mock",
  requiresApiKey: false,
  lastFetchAt: null,
  lastSuccessAt: null,
  lastError: null,
  itemCount: 0,
  feedUrl: TRT_RSS_FEEDS.sonDakika,
  note: "Henüz fetch yapılmadı",
};

export function getTrtRssStatus(): ConnectorIngestResult["status"] {
  return { ...lastStatus };
}

/** Gerçek RSS fetch — hata durumunda fallback, API'yi düşürmez */
export async function ingestTrtRss(
  feeds: (keyof typeof TRT_RSS_FEEDS)[] = ["sonDakika", "turkiye"]
): Promise<ConnectorIngestResult> {
  const now = new Date().toISOString();
  lastStatus = { ...lastStatus, lastFetchAt: now, lastError: null };

  const allEvents: SourceEvent[] = [];
  const errors: string[] = [];

  for (const key of feeds) {
    const url = TRT_RSS_FEEDS[key];
    try {
      const xml = await fetchFeed(url);
      const items = parseRssXml(xml);
      allEvents.push(...itemsToSourceEvents(items, key));
    } catch (err) {
      errors.push(`${key}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (allEvents.length > 0) {
    lastStatus = {
      ...lastStatus,
      mode: "live",
      lastSuccessAt: now,
      lastError: errors.length ? errors.join("; ") : null,
      itemCount: allEvents.length,
      note: errors.length ? "Kısmi feed hatası" : "Canlı RSS",
    };
    return { connectorId: CONNECTOR_ID, events: allEvents, status: lastStatus };
  }

  const fallback = fallbackEvents();
  lastStatus = {
    ...lastStatus,
    mode: "fallback",
    lastError: errors.join("; ") || "Tüm feed'ler başarısız",
    itemCount: fallback.length,
    note: "Fallback modu",
  };
  return { connectorId: CONNECTOR_ID, events: fallback, status: lastStatus };
}

/** @deprecated MVP-1 uyumluluk — ingestTrtRss kullanın */
export async function fetchTrtRssMock(): Promise<RawEventInput[]> {
  const result = await ingestTrtRss(["sonDakika"]);
  return sourceEventsToRaw(result.events, CONNECTOR_ID, result.status.mode);
}
