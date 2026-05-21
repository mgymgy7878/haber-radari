import { newsAgeLabel, type NewsAgeBand } from "./news-age.js";
import type { SourceQualityTier } from "./source-trust-matrix.js";
import type { EventDecision, RawEventInput, VerificationState } from "./schemas.js";

export interface EventExplainability {
  notificationReason: string;
  suppressionReason?: string;
  verificationSummary: string;
  sourceSummary: string;
}

const TIER_LABELS: Record<SourceQualityTier, string> = {
  official: "Resmî kaynak katmanı",
  market: "Piyasa / kurum kaynağı",
  editorial: "Editoryal haber kaynağı",
  aggregator: "Haber agregatörü (küresel tarama)",
  social: "Sosyal sinyal kaynağı",
};

function verificationSummaryText(
  state: VerificationState,
  isSocialOnly: boolean
): string {
  if (isSocialOnly) {
    return "Sosyal medyada konuşuluyor; bağımsız editoryal/resmî teyit henüz yok.";
  }
  switch (state) {
    case "official":
      return "Resmî kurum veya doğrulanmış resmî açıklama.";
    case "verified":
      return "Birden fazla güvenilir kaynakta teyit edilmiş.";
    case "corroborated":
      return "Bağımsız kaynaklarda görülüyor; tam resmî teyit bekleniyor olabilir.";
    case "suppressed":
      return "Kalite filtresi nedeniyle baskılandı.";
    default:
      return "Henüz yeterli editoryal teyit yok — erken sinyal olabilir.";
  }
}

function buildNotificationReason(input: {
  decision: EventDecision;
  isSocialOnly: boolean;
  finalScore: number;
  newsAgeBand: NewsAgeBand;
  verificationState: VerificationState;
}): string {
  const { decision, isSocialOnly, finalScore, newsAgeBand, verificationState } =
    input;

  if (decision === "notify_candidate") {
    return `Bildirim adayı: yüksek önem (${finalScore.toFixed(2)}) ve güven eşiği sağlandı. (MVP: gerçek push henüz yok.)`;
  }

  if (decision === "suppress") {
    return "Bildirim gönderilmez — haber baskılandı.";
  }

  if (isSocialOnly) {
    return "Bildirim yok: yalnızca sosyal sinyal; bağımsız haber teyidi gerekir.";
  }

  if (decision === "review") {
    if (verificationState === "unverified") {
      return "Bildirim yok: erken sinyal — doğrulama tamamlanmadan push açılmaz.";
    }
    if (newsAgeBand === "unknown") {
      return "Bildirim yok: yayın tarihi belirsiz; inceleme gerekli.";
    }
    return "Bildirim yok: inceleme modunda; teyit veya skor eşiği henüz yeterli değil.";
  }

  return `Bildirim yok: radar eşiğinde (${finalScore.toFixed(2)}) ancak push adayı değil.`;
}

export function buildEventExplainability(input: {
  event: RawEventInput;
  decision: EventDecision;
  finalScore: number;
  newsAgeBand: NewsAgeBand;
  sourceQualityTier: SourceQualityTier;
  isSocialOnly: boolean;
  suppressReason?: string;
}): EventExplainability {
  const { event, decision, finalScore, newsAgeBand, sourceQualityTier, isSocialOnly, suppressReason } =
    input;

  const sources = event.sourceNames.join(", ") || "Kaynak belirtilmedi";
  const tierLabel = TIER_LABELS[sourceQualityTier];
  const ageNote =
    newsAgeBand !== "fresh" ? ` · ${newsAgeLabel(newsAgeBand)}` : "";

  const sourceSummary = isSocialOnly
    ? `${tierLabel}: ${sources}. Sosyal sinyal; bağımsız teyit yok.`
    : `${tierLabel}: ${sources}. Güven skoru ${(event.sourceTrustScore * 100).toFixed(0)}%.${ageNote}`;

  return {
    notificationReason: buildNotificationReason({
      decision,
      isSocialOnly,
      finalScore,
      newsAgeBand,
      verificationState: event.verificationState,
    }),
    suppressionReason:
      decision === "suppress"
        ? suppressReason ?? "Kalite filtresi — radar dışı"
        : undefined,
    verificationSummary: verificationSummaryText(
      event.verificationState,
      isSocialOnly
    ),
    sourceSummary,
  };
}
