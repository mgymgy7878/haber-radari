import type { SocialSignalRecord } from "./social-signal.js";

const DEFAULT_WS =
  "wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post";

const DEFAULT_KEYWORDS = [
  "deprem",
  "afad",
  "tcmb",
  "faiz",
  "iran",
  "israil",
  "suriye",
  "borsa",
  "istanbul",
];

export interface BlueskyJetstreamPreviewOptions {
  keywords?: string[];
  limit?: number;
  timeoutMs?: number;
  wsUrl?: string;
}

function parsePostText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;

  const commit = obj.commit as Record<string, unknown> | undefined;
  const record =
    (commit?.record as Record<string, unknown> | undefined) ??
    (obj.record as Record<string, unknown> | undefined);

  if (record && typeof record.text === "string") return record.text;

  if (typeof obj.text === "string") return obj.text;
  return null;
}

function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

function recordFromJetstreamMessage(
  raw: unknown,
  keywords: string[],
  index: number
): SocialSignalRecord | null {
  const text = parsePostText(raw);
  if (!text || text.length < 8) return null;
  if (!matchesKeywords(text, keywords)) return null;

  const obj = raw as Record<string, unknown>;
  const did = typeof obj.did === "string" ? obj.did : "unknown";
  const now = new Date().toISOString();
  const title =
    text.length > 80 ? `${text.slice(0, 77).trimEnd()}…` : text;

  return {
    id: `bsky-jet-${did.slice(-12)}-${index}-${Date.now()}`,
    platform: "bluesky",
    text,
    title,
    author: did,
    displayName: did.slice(0, 20),
    url: undefined,
    publishedAt: now,
    observedAt: now,
    language: "und",
    keywords: keywords.filter((k) => text.toLowerCase().includes(k.toLowerCase())),
    engagement: 0,
    isVerifiedSource: false,
    confidence: 0.42,
    requiresApiKey: false,
    mode: "live",
  };
}

/**
 * Kısa süreli Jetstream önizlemesi — sonsuz stream’i kilitlemez.
 */
export async function previewBlueskyJetstream(
  options: BlueskyJetstreamPreviewOptions = {}
): Promise<{
  records: SocialSignalRecord[];
  mode: "live" | "fallback" | "error";
  error?: string;
  timedOut?: boolean;
}> {
  const keywords =
    options.keywords?.length ? options.keywords : DEFAULT_KEYWORDS;
  const limit = Math.min(options.limit ?? 5, 20);
  const timeoutMs = Math.min(Math.max(options.timeoutMs ?? 4000, 1000), 15000);
  const wsUrl = options.wsUrl ?? process.env.BLUESKY_JETSTREAM_URL ?? DEFAULT_WS;

  let WebSocketImpl: typeof import("ws").default;
  try {
    const mod = await import("ws");
    WebSocketImpl = mod.default;
  } catch {
    return {
      records: [],
      mode: "error",
      error: "WebSocket modülü yüklenemedi",
    };
  }

  return new Promise((resolve) => {
    const records: SocialSignalRecord[] = [];
    let settled = false;
    const finish = (result: {
      records: SocialSignalRecord[];
      mode: "live" | "fallback" | "error";
      error?: string;
      timedOut?: boolean;
    }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({
        records,
        mode: records.length > 0 ? "live" : "fallback",
        timedOut: true,
        error: records.length === 0 ? "Jetstream zaman aşımı" : undefined,
      });
    }, timeoutMs);

    let ws: InstanceType<typeof WebSocketImpl>;
    try {
      ws = new WebSocketImpl(wsUrl);
    } catch (err) {
      finish({
        records: [],
        mode: "error",
        error: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    ws.on("error", (err) => {
      finish({
        records,
        mode: records.length > 0 ? "live" : "error",
        error: err instanceof Error ? err.message : String(err),
      });
    });

    ws.on("message", (data) => {
      try {
        const parsed = JSON.parse(
          typeof data === "string" ? data : data.toString("utf8")
        ) as unknown;
        const rec = recordFromJetstreamMessage(parsed, keywords, records.length);
        if (rec) records.push(rec);
        if (records.length >= limit) {
          finish({ records, mode: "live" });
        }
      } catch {
        /* skip malformed */
      }
    });

    ws.on("open", () => {
      /* wait for messages until timeout */
    });
  });
}
