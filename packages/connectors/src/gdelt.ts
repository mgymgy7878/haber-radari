import type { EventCategory, RawEventInput } from "@haber-radari/news-core";
import { sourceEventsToRaw } from "./normalize.js";
import type { ConnectorIngestResult, SourceEvent } from "./source-event.js";

const CONNECTOR_ID = "gdelt";
const GDELT_DOC_URL =
  "https://api.gdeltproject.org/api/v2/doc/doc?query=world%20news&mode=ArtList&maxrecords=8&format=json&timespan=24h";
const FETCH_TIMEOUT_MS = 15_000;

interface GdeltArticle {
  title?: string;
  seendate?: string;
  url?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
}

interface GdeltDocResponse {
  articles?: GdeltArticle[];
}

function fallbackEvents(): SourceEvent[] {
  return [
    {
      externalId: "fallback-gdelt-1",
      title: "[GDELT fallback] Küresel haber akışı geçici olarak alınamadı",
      summary:
        "GDELT public API yanıt vermedi; sınırlı fallback kaydı. Daha sonra tekrar denenecek.",
      category: "world",
      publishedAt: new Date().toISOString(),
      sourceType: "aggregator",
      sourceNames: ["GDELT (fallback)"],
      sourceTrustScore: 0.75,
    },
  ];
}

function parseSeenDate(seendate?: string): string {
  if (!seendate || seendate.length < 8) return new Date().toISOString();
  const y = seendate.slice(0, 4);
  const m = seendate.slice(4, 6);
  const d = seendate.slice(6, 8);
  const h = seendate.length >= 10 ? seendate.slice(8, 10) : "00";
  const min = seendate.length >= 12 ? seendate.slice(10, 12) : "00";
  return new Date(`${y}-${m}-${d}T${h}:${min}:00Z`).toISOString();
}

function articleToEvent(article: GdeltArticle, idx: number): SourceEvent | null {
  const title = article.title?.trim();
  if (!title) return null;

  let category: EventCategory = "world";
  const t = title.toLowerCase();
  if (/econom|market|fed|ecb|borsa|stock|trade/i.test(t)) category = "finance";
  if (/war|conflict|military|nato|ukraine|gaza/i.test(t)) category = "geopolitics";

  return {
    externalId: `doc-${idx}-${Buffer.from(article.url ?? title)
      .toString("base64url")
      .slice(0, 20)}`,
    title,
    summary: `${article.domain ?? "GDELT"} — ${article.sourcecountry ?? "global"} kapsamında haber.`,
    category,
    publishedAt: parseSeenDate(article.seendate),
    sourceType: "aggregator",
    sourceNames: ["GDELT", article.domain ?? "Global press"].slice(0, 2),
    sourceTrustScore: 0.78,
    externalUrl: article.url,
    tags: ["gdelt", article.language ?? "unknown"].filter(Boolean) as string[],
    hints: { marketImpactScore: category === "finance" ? 0.65 : 0.2 },
  };
}

let lastStatus: ConnectorIngestResult["status"] = {
  connectorId: CONNECTOR_ID,
  displayName: "GDELT DOC API",
  mode: "mock",
  requiresApiKey: false,
  lastFetchAt: null,
  lastSuccessAt: null,
  lastError: null,
  itemCount: 0,
  feedUrl: GDELT_DOC_URL,
  note: "Public endpoint — API key gerekmez",
};

export function getGdeltStatus(): ConnectorIngestResult["status"] {
  return { ...lastStatus };
}

export async function ingestGdelt(): Promise<ConnectorIngestResult> {
  const now = new Date().toISOString();
  lastStatus = { ...lastStatus, lastFetchAt: now, lastError: null };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(GDELT_DOC_URL, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as GdeltDocResponse;
    const events = (data.articles ?? [])
      .map((a, i) => articleToEvent(a, i))
      .filter((e): e is SourceEvent => e !== null);

    if (events.length > 0) {
      lastStatus = {
        ...lastStatus,
        mode: "live",
        lastSuccessAt: now,
        itemCount: events.length,
        note: "GDELT DOC canlı (limitli)",
      };
      return { connectorId: CONNECTOR_ID, events, status: lastStatus };
    }
    throw new Error("Boş articles listesi");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const fallback = fallbackEvents();
    lastStatus = {
      ...lastStatus,
      mode: "fallback",
      lastError: msg,
      itemCount: fallback.length,
      note: "Fallback modu",
    };
    return { connectorId: CONNECTOR_ID, events: fallback, status: lastStatus };
  } finally {
    clearTimeout(timer);
  }
}

/** @deprecated MVP-1 uyumluluk */
export async function fetchGdeltMock(): Promise<RawEventInput[]> {
  const result = await ingestGdelt();
  return sourceEventsToRaw(result.events, CONNECTOR_ID, result.status.mode);
}
