import type { RawEventInput } from "./schemas.js";

export type NewsAgeBand = "fresh" | "recent" | "aging" | "stale" | "unknown";

/** Eşikler saat cinsindendir — saniye değil */
export const NEWS_AGE_THRESHOLDS_HOURS = {
  freshMax: 6,
  recentMax: 24,
  agingMax: 48,
} as const;

const MS_PER_HOUR = 3_600_000;

const EVERGREEN_CATEGORIES = new Set([
  "official",
  "finance",
  "disaster",
  "geopolitics",
]);

export function isEvergreenCandidate(event: RawEventInput): boolean {
  return (
    !!event.isOfficialSource ||
    event.verificationState === "official" ||
    EVERGREEN_CATEGORIES.has(event.category) ||
    (event.category === "finance" &&
      /tcmb|kap|fed|borsa|faiz/i.test(`${event.title} ${event.summary}`))
  );
}

export function getNewsAgeHours(publishedAt?: string): number | null {
  if (!publishedAt) return null;
  const t = Date.parse(publishedAt);
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / MS_PER_HOUR;
}

export function getNewsAgeBand(publishedAt?: string): NewsAgeBand {
  const hours = getNewsAgeHours(publishedAt);
  const { freshMax, recentMax, agingMax } = NEWS_AGE_THRESHOLDS_HOURS;
  if (hours === null) return "unknown";
  if (hours <= freshMax) return "fresh";
  if (hours <= recentMax) return "recent";
  if (hours <= agingMax) return "aging";
  return "stale";
}

/** 0 = taze, 1 = maksimum eski haber cezası */
export function getNewsAgePenalty(
  band: NewsAgeBand,
  evergreen: boolean
): number {
  switch (band) {
    case "fresh":
      return 0;
    case "recent":
      return evergreen ? 0.05 : 0.12;
    case "aging":
      return evergreen ? 0.1 : 0.28;
    case "stale":
      return evergreen ? 0.18 : 0.48;
    case "unknown":
      return 0.22;
    default:
      return 0;
  }
}

export function newsAgeLabel(band: NewsAgeBand): string {
  const labels: Record<NewsAgeBand, string> = {
    fresh: "Güncel (6 saat içi)",
    recent: "Yakın (6–24 saat)",
    aging: "Orta yaş (24–48 saat)",
    stale: "Eski (48 saat+)",
    unknown: "Tarih belirsiz",
  };
  return labels[band];
}
