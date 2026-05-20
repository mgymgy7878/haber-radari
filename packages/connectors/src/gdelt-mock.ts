import type { RawEventInput } from "@haber-radari/news-core";

export async function fetchGdeltMock(): Promise<RawEventInput[]> {
  return [
    {
      id: "gdelt-mock-001",
      title: "[GDELT] Avrupa'da enerji fiyatlarında küresel hareketlilik",
      summary:
        "GDELT connector mock — 15 dk güncellenen global olay akışı simülasyonu.",
      category: "world",
      sourceNames: ["GDELT", "Reuters"],
      sourceTrustScore: 0.8,
      verificationState: "corroborated",
      importanceScore: 0.68,
      verificationScore: 0.7,
      locationRelevance: 0.2,
      marketImpactScore: 0.6,
      socialVelocityScore: 0.25,
      noveltyScore: 0.85,
      clickbaitPenalty: 0,
      tabloidPenalty: 0,
      localCrimePenalty: 0,
      publishedAt: new Date().toISOString(),
    },
  ];
}
