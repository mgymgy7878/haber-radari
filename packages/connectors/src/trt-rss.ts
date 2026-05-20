import type { RawEventInput } from "@haber-radari/news-core";

/** TRT RSS feed URL'leri — MVP'de mock; gerçek fetch ikinci faz */
export const TRT_RSS_FEEDS = {
  sonDakika: "https://www.trthaber.com/rss/sondakika.rss",
  turkiye: "https://www.trthaber.com/rss/turkiye.rss",
  dunya: "https://www.trthaber.com/rss/dunya.rss",
  ekonomi: "https://www.trthaber.com/rss/ekonomi.rss",
} as const;

export interface TrtRssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

/**
 * TRT RSS ingest iskeleti.
 * Gerçek HTTP fetch + XML parse MVP-2/3'te eklenecek.
 */
export async function fetchTrtRssMock(): Promise<RawEventInput[]> {
  const now = new Date().toISOString();
  return [
    {
      id: `trt-mock-${Date.now()}`,
      title: "[TRT Mock] Cumhurbaşkanı kabine toplantısı sonrası açıklama",
      summary: "TRT RSS connector mock verisi — gerçek feed bağlantısı sonraki fazda.",
      category: "turkey",
      sourceNames: ["TRT Haber"],
      sourceTrustScore: 0.88,
      verificationState: "corroborated",
      importanceScore: 0.72,
      verificationScore: 0.75,
      locationRelevance: 0.8,
      marketImpactScore: 0.2,
      socialVelocityScore: 0.35,
      noveltyScore: 0.9,
      clickbaitPenalty: 0,
      tabloidPenalty: 0,
      localCrimePenalty: 0,
      publishedAt: now,
      involvesPublicFigure: true,
    },
  ];
}
