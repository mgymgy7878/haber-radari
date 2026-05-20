import cors from "@fastify/cors";
import Fastify from "fastify";
import {
  getAllEvents,
  getFinanceEvents,
  getFlashEvents,
  getMeta,
  getNearbyEvents,
  getNotificationCandidates,
  getRadarEvents,
  getSignals,
  getSuppressedEvents,
  refreshEvents,
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

try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`Haber Radarı API → http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
