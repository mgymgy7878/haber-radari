import type { EventDecision, ProcessedEvent, VerificationState } from "../types";
import { colors } from "../theme/colors";

export function verificationLabel(state: VerificationState): string {
  switch (state) {
    case "official":
      return "RESMÎ";
    case "verified":
      return "DOĞRULANDI";
    case "corroborated":
      return "TEYİTLİ";
    case "suppressed":
      return "BASKILANDI";
    default:
      return "ERKEN SİNYAL";
  }
}

export function verificationColor(state: VerificationState): string {
  switch (state) {
    case "official":
      return colors.official;
    case "verified":
      return colors.verified;
    case "corroborated":
      return colors.accent;
    case "suppressed":
      return colors.suppressed;
    default:
      return colors.early;
  }
}

export function decisionLabel(decision: EventDecision): string | null {
  switch (decision) {
    case "notify_candidate":
      return "BİLDİRİM ADAYI";
    case "review":
      return "İNCELE";
    case "suppress":
      return "BASKILANDI";
    default:
      return null;
  }
}

/** Kart üstü birincil karar etiketi */
export function primaryDecisionBadge(event: ProcessedEvent): {
  label: string;
  color: string;
} | null {
  if (event.decision === "notify_candidate") {
    return { label: "BİLDİRİM ADAYI", color: colors.notify };
  }
  if (event.decision === "suppress") {
    return { label: "BASKILANDI", color: colors.suppressed };
  }
  if (event.isSocialOnly || (event.decision === "review" && event.verificationState === "unverified")) {
    return { label: "ERKEN SİNYAL", color: colors.early };
  }
  if (event.decision === "review") {
    return { label: "İNCELE", color: colors.review };
  }
  if (event.verificationState === "official") {
    return { label: "RESMÎ", color: colors.official };
  }
  if (event.verificationState === "verified") {
    return { label: "DOĞRULANDI", color: colors.verified };
  }
  return null;
}

export function sourceTierLabel(tier?: string): string {
  const map: Record<string, string> = {
    official: "Resmî",
    market: "Piyasa",
    editorial: "Editoryal",
    aggregator: "Agregatör",
    social: "Sosyal",
  };
  return tier ? map[tier] ?? tier : "—";
}

export function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    flash: "Flaş",
    turkey: "Türkiye",
    world: "Dünya",
    finance: "Finans",
    official: "Resmî",
    disaster: "Afet",
    geopolitics: "Jeopolitik",
    politics: "Siyaset",
    celebrity: "Kamu figürü",
    local: "Yerel",
    social_signal: "Sosyal sinyal",
  };
  return map[cat] ?? cat;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}
