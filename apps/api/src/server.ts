import cors from "@fastify/cors";
import Fastify from "fastify";
import {
  getAllEvents,
  getFinanceEvents,
  getFlashEvents,
  getIngestPreview,
  getMeta,
  getNearbyEvents,
  getNotificationCandidates,
  getRadarEvents,
  getSignals,
  getSourcesStatus,
  getSocialStatus,
  getSocialPreview,
  getNotificationQueue,
  getSuppressedEvents,
  refreshEvents,
  refreshSocialSignalsCache,
} from "./store.js";

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.get("/health", async () => ({
  status: "ok",
  service: "haber-radari-api",
  timestamp: new Date().toISOString(),
  meta: getMeta(),
}));

app.get("/api/events", async (req) => {
  const query = req.query as { filter?: string };
  let events;
  switch (query.filter) {
    case "flash":
      events = await getFlashEvents();
      break;
    case "finance":
      events = await getFinanceEvents();
      break;
    case "nearby":
      events = await getNearbyEvents();
      break;
    case "all":
      events = await getAllEvents();
      break;
    case "suppressed":
      events = await getSuppressedEvents();
      break;
    default:
      events = await getRadarEvents();
  }
  return { count: events.length, events, meta: getMeta() };
});

app.get("/api/signals", async () => {
  const signals = getSignals();
  return { count: signals.length, signals, meta: getMeta() };
});

app.get("/api/notification-candidates", async () => {
  const candidates = await getNotificationCandidates();
  return {
    count: candidates.length,
    candidates: candidates.map((event) => ({
      event,
      pushEligible: true,
      reasons: event.reasonBullets,
      notificationReason: event.notificationReason,
      suggestedTitle: event.title,
      note: "MVP-1: Gerçek push gönderilmez, yalnızca aday listesi.",
    })),
    meta: getMeta(),
  };
});

app.post("/api/refresh", async () => {
  const events = await refreshEvents();
  return { refreshed: true, count: events.length, meta: getMeta() };
});

app.get("/api/sources/status", async () => {
  const sources = await getSourcesStatus();
  return {
    count: sources.length,
    sources,
    meta: getMeta(),
    note: "TRT/GDELT canlı; Bluesky Jetstream / YouTube gated-live.",
  };
});

app.get("/api/social/status", async () => {
  const status = await getSocialStatus();
  return { ok: true, ...status, meta: getMeta() };
});

app.get("/api/social/preview", async (req) => {
  const query = req.query as { q?: string; limit?: string; timeoutMs?: string };
  const limit = query.limit ? Number(query.limit) : 5;
  const timeoutMs = query.timeoutMs ? Number(query.timeoutMs) : 5000;
  try {
    const preview = await getSocialPreview({
      q: query.q,
      limit: Number.isFinite(limit) ? limit : 5,
      timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 5000,
    });
    return {
      ...preview,
      meta: getMeta(),
      note: "Kısa timeout; env yoksa gated/fallback + örnek sinyaller.",
    };
  } catch (err) {
    return {
      ok: false,
      mode: "error",
      records: [],
      signals: [],
      statuses: [],
      error: err instanceof Error ? err.message : String(err),
      meta: getMeta(),
    };
  }
});

app.get("/api/notification-queue", async () => {
  const payload = await getNotificationQueue();
  return { ok: true, ...payload, meta: getMeta() };
});

app.post("/api/social/refresh", async (req) => {
  const body = (req.body ?? {}) as { q?: string; limit?: number; timeoutMs?: number };
  const signals = await refreshSocialSignalsCache(body);
  return {
    refreshed: true,
    count: signals.length,
    meta: getMeta(),
  };
});

app.get("/api/ingest/preview", async () => {
  try {
    const preview = await getIngestPreview();
    return {
      ok: true,
      ...preview,
      meta: getMeta(),
      note: "quality alanı cluster, haber yaşı ve sosyal-only özetini içerir",
    };
  } catch (err) {
    return {
      ok: false,
      previews: [],
      quality: null,
      error: err instanceof Error ? err.message : String(err),
      meta: getMeta(),
    };
  }
});

try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`Haber Radarı API → http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
