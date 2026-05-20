import { applyNoveltyPenalty, calculateFinalScore, isStaleNews } from "./scoring.js";
import type {
  EventDecision,
  ProcessedEvent,
  RawEventInput,
} from "./schemas.js";

const LOCAL_CRIME_KEYWORDS = [
  "bıçaklama",
  "bicaklama",
  "kavga",
  "yaralama",
  "cinayet",
  "gaspa",
  "soygun",
  "aile içi",
  "trafik kazası",
  "motosiklet kazası",
];

const PUBLIC_FIGURE_KEYWORDS = [
  "cumhurbaşkanı",
  "bakan",
  "milletvekili",
  "siyasetçi",
  "ceo",
  "borsa",
  "şirket",
  "ünlü",
  "sanatçı",
];

function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function buildReasonBullets(
  event: RawEventInput,
  decision: EventDecision,
  finalScore: number
): string[] {
  const bullets: string[] = [];

  if (event.verificationState === "official") {
    bullets.push("Resmî kaynak eşleşmesi");
  } else if (event.verificationState === "verified") {
    bullets.push("Doğrulanmış / çoklu kaynak teyidi");
  } else if (event.verificationState === "corroborated") {
    bullets.push("Bağımsız kaynaklarda görülüyor");
  }

  if (event.sourceNames.length >= 2) {
    bullets.push(`${event.sourceNames.length} kaynakta geçti`);
  }

  if (event.importanceScore >= 0.75) {
    bullets.push("Türkiye / dünya etkisi yüksek");
  }

  if (event.marketImpactScore >= 0.6) {
    bullets.push("Piyasa / finans etkisi olası");
  }

  if (event.locationRelevance >= 0.5 && event.locationLabel) {
    bullets.push(`Konum ilgisi: ${event.locationLabel}`);
  }

  if (event.localCrimePenalty >= 0.5 || event.isLocalViolentCrime) {
    bullets.push("3. sayfa filtresi devrede");
  }

  if (event.involvesPublicFigure) {
    bullets.push("Kamu figürü / siyaset bağlamı");
  }

  if (isStaleNews(event.publishedAt)) {
    bullets.push("Eski haber — önem cezası uygulandı");
  }

  if (decision === "suppress") {
    bullets.push("Sansasyon / yerel suç — baskılandı");
  } else if (decision === "notify_candidate") {
    bullets.push(`Yüksek önem skoru (${finalScore.toFixed(2)})`);
  } else if (decision === "review") {
    bullets.push("İnceleme gerektiriyor — henüz tam teyit yok");
  }

  if (bullets.length === 0) {
    bullets.push("Genel önem eşiğini geçti");
  }

  return bullets;
}

function resolveDecision(
  event: RawEventInput,
  finalScore: number
): EventDecision {
  const text = `${event.title} ${event.summary}`;
  const isLocalCrime =
    event.isLocalViolentCrime ||
    event.localCrimePenalty >= 0.6 ||
    matchesKeywords(text, LOCAL_CRIME_KEYWORDS);

  const hasPublicContext =
    event.involvesPublicFigure ||
    matchesKeywords(text, PUBLIC_FIGURE_KEYWORDS) ||
    ["politics", "celebrity", "geopolitics", "finance", "official", "disaster", "world"].includes(
      event.category
    );

  if (isLocalCrime && !hasPublicContext) {
    return "suppress";
  }

  if (isStaleNews(event.publishedAt, 24) && finalScore < 0.85) {
    return "suppress";
  }

  const highTrust =
    event.verificationState === "official" ||
    event.verificationState === "verified" ||
    (event.verificationState === "corroborated" && event.sourceNames.length >= 2);

  if (
    finalScore >= 0.78 &&
    event.localCrimePenalty < 0.4 &&
    !isStaleNews(event.publishedAt, 6) &&
    highTrust &&
    event.importanceScore >= 0.7
  ) {
    return "notify_candidate";
  }

  if (
    event.verificationState === "unverified" &&
    event.socialVelocityScore >= 0.6
  ) {
    return "review";
  }

  if (finalScore < 0.35 || event.verificationState === "suppressed") {
    return "suppress";
  }

  if (event.involvesPublicFigure && isLocalCrime) {
    return "review";
  }

  if (
    event.involvesPublicFigure &&
    event.verificationScore < 0.7 &&
    event.verificationState !== "official" &&
    finalScore >= 0.35
  ) {
    return "review";
  }

  return "show";
}

export function processEvent(raw: RawEventInput): ProcessedEvent {
  const adjusted: RawEventInput = {
    ...raw,
    noveltyScore: applyNoveltyPenalty(raw),
  };

  const finalScore = calculateFinalScore(adjusted);
  const decision = resolveDecision(adjusted, finalScore);
  const reasonBullets = buildReasonBullets(adjusted, decision, finalScore);

  let verificationState = adjusted.verificationState;
  if (decision === "suppress") {
    verificationState = "suppressed";
  }

  return {
    ...adjusted,
    finalScore,
    decision,
    reasonBullets,
    verificationState,
  };
}

export function processEvents(rawEvents: RawEventInput[]): ProcessedEvent[] {
  return rawEvents.map(processEvent);
}

export function filterRadarEvents(events: ProcessedEvent[]): ProcessedEvent[] {
  return events
    .filter((e) => e.decision === "show" || e.decision === "notify_candidate" || e.decision === "review")
    .sort((a, b) => b.finalScore - a.finalScore);
}

export function filterNotificationCandidates(
  events: ProcessedEvent[]
): ProcessedEvent[] {
  return events
    .filter((e) => e.decision === "notify_candidate")
    .sort((a, b) => b.finalScore - a.finalScore);
}

export function filterSuppressed(events: ProcessedEvent[]): ProcessedEvent[] {
  return events.filter((e) => e.decision === "suppress");
}
