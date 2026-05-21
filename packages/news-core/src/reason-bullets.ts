import { newsAgeLabel, type NewsAgeBand } from "./news-age.js";
import type { SourceQualityTier } from "./source-trust-matrix.js";
import type { ClusterAssignment } from "./cluster.js";
import type { EventDecision, RawEventInput } from "./schemas.js";

export function buildReasonBullets(input: {
  event: RawEventInput;
  decision: EventDecision;
  finalScore: number;
  newsAgeBand: NewsAgeBand;
  sourceQualityTier: SourceQualityTier;
  isSocialOnly: boolean;
  cluster?: ClusterAssignment;
  suppressReason?: string;
  newsAgePenalty: number;
}): string[] {
  const {
    event,
    decision,
    finalScore,
    newsAgeBand,
    sourceQualityTier,
    isSocialOnly,
    cluster,
    suppressReason,
    newsAgePenalty,
  } = input;
  const bullets: string[] = [];

  if (sourceQualityTier === "official") {
    bullets.push("Resmî kaynak katmanı (yüksek güven)");
  } else if (sourceQualityTier === "market") {
    bullets.push("Piyasa / kurum kaynağı");
  } else if (sourceQualityTier === "editorial") {
    bullets.push("Editoryal haber kaynağı");
  } else if (sourceQualityTier === "aggregator") {
    bullets.push("Küresel haber agregatörü (GDELT vb.)");
  }

  if (event.verificationState === "official") {
    bullets.push("Resmî doğrulama durumu");
  } else if (event.verificationState === "verified") {
    bullets.push("Doğrulanmış / çoklu kaynak teyidi");
  } else if (event.verificationState === "corroborated") {
    bullets.push("Bağımsız kaynaklarda görülüyor");
  }

  if (event.sourceNames.length >= 2) {
    bullets.push(`Birden fazla kaynakta görüldü (${event.sourceNames.length})`);
  }

  if (event.importanceScore >= 0.75) {
    bullets.push("Türkiye / dünya etkisi yüksek");
  }

  if (event.marketImpactScore >= 0.6) {
    bullets.push("Finansal / piyasa etkisi yüksek");
  }

  if (event.locationRelevance >= 0.5 && event.locationLabel) {
    bullets.push(`Konum ilgisi: ${event.locationLabel}`);
  }

  if (event.clickbaitPenalty >= 0.4) {
    bullets.push("Clickbait / yanıltıcı başlık cezası");
  }

  if (event.tabloidPenalty >= 0.4) {
    bullets.push("Magazin / sansasyon cezası");
  }

  if (event.localCrimePenalty >= 0.5 || event.isLocalViolentCrime) {
    bullets.push("3. sayfa / yerel şiddet filtresi");
  }

  if (newsAgePenalty >= 0.2) {
    bullets.push(`Eski haber cezası: ${newsAgeLabel(newsAgeBand)}`);
  } else if (newsAgeBand === "fresh") {
    bullets.push("Güncel gelişme (6 saat içi)");
  }

  if (isSocialOnly) {
    bullets.push("Sosyal erken sinyal — tek başına push adayı değil");
  }

  if (cluster && cluster.clusterSize > 1) {
    if (cluster.isClusterPrimary) {
      bullets.push(`Olay kümesi birinciliği (${cluster.clusterSize} benzer kayıt)`);
    } else if (cluster.duplicateReason) {
      bullets.push(cluster.duplicateReason);
    }
  }

  if (decision === "suppress") {
    bullets.push(
      suppressReason ?? "Sansasyon / yerel suç / tekrar — baskılandı"
    );
  } else if (decision === "notify_candidate") {
    bullets.push(`Yüksek önem skoru (${finalScore.toFixed(2)})`);
  } else if (decision === "review") {
    bullets.push("İnceleme: tam teyit veya tarih/kaynak eksik");
  }

  if (bullets.length === 0) {
    bullets.push("Genel önem eşiğini geçti");
  }

  return [...new Set(bullets)].slice(0, 8);
}
