import { AuthorityTier } from './source-score-types.js';
import type {
  ArticleSourceScoreOverlay,
  SourceScore,
  SourceScoreShadowPayload,
} from './source-score-types.js';

export type SourceSignalScoreBand = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface SourceSignalPayload {
  label: string;
  tierLabel: string;
  scoreBand: SourceSignalScoreBand;
  reasons: string[];
  disclaimer: string;
}

export const SOURCE_SIGNAL_DISCLAIMER =
  'Bu sinyal haberin doğruluğunu tek başına garanti etmez.';

export const SOURCE_SIGNAL_LABEL = 'Kaynak sinyali';

const BANNED_PHRASES = [
  'kesin doğru',
  'güvenilir haber',
  'yalan',
  'manipülasyon',
  'onaylandı',
  'kanıtlandı',
  'doğrulandı',
];

const TIER_LABELS: Record<AuthorityTier, string> = {
  [AuthorityTier.OFFICIAL]: 'Resmi kaynak',
  [AuthorityTier.PRIMARY_WIRE_OR_AGENCY]: 'Ajans / kaynak sağlayıcı',
  [AuthorityTier.ESTABLISHED_MEDIA]: 'Bilinen medya',
  [AuthorityTier.LOCAL_MEDIA]: 'Yerel kaynak',
  [AuthorityTier.UNKNOWN]: 'Yeni / bilinmeyen kaynak',
  [AuthorityTier.BLOCKED_OR_LOW_TRUST]: 'Düşük güven profili',
};

const REASON_UI_MAP: Record<string, string> = {
  'Son RSS/API fetch başarısız — sağlık cezası': 'Son erişim sinyali zayıf',
  'Metadata eksikliği (title/link/time/description) sağlık sinyali': 'Metadata eksikliği var',
  'Kaynak tazeliği düşük (48s+ veya veri yok)': 'Kaynak tazeliği düşük',
  'Kaynak devre dışı (shadow skor)': 'Kaynak profili devre dışı',
};

export function mapScoreBand(finalScore: number): SourceSignalScoreBand {
  if (finalScore >= 75) return 'HIGH';
  if (finalScore >= 50) return 'MEDIUM';
  if (finalScore >= 25) return 'LOW';
  return 'UNKNOWN';
}

export function tierLabelFor(tier: AuthorityTier): string {
  return TIER_LABELS[tier];
}

export function containsBannedPhrase(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_PHRASES.some((phrase) => lower.includes(phrase));
}

export function sanitizeReasons(rawReasons: string[], max = 4): string[] {
  const out: string[] = [];
  for (const raw of rawReasons) {
    const mapped = REASON_UI_MAP[raw] ?? raw;
    if (containsBannedPhrase(mapped)) continue;
    if (!out.includes(mapped)) out.push(mapped);
    if (out.length >= max) break;
  }
  return out;
}

export function buildSourceSignalFromScore(
  score: SourceScore,
  overlay?: ArticleSourceScoreOverlay,
  clusterBoost?: number,
): SourceSignalPayload {
  const finalScore = overlay?.finalSourceScore ?? score.finalSourceScore;
  const reasons = sanitizeReasons(overlay?.reasons ?? score.reasons);

  if (clusterBoost != null && clusterBoost > 0) {
    reasons.unshift('Birden fazla kaynakla destekleniyor');
  }

  if (reasons.length === 0) {
    reasons.push('Kaynak profili değerlendirmesi yardımcı sinyaldir.');
  }

  return {
    label: SOURCE_SIGNAL_LABEL,
    tierLabel: tierLabelFor(score.authorityTier),
    scoreBand: mapScoreBand(finalScore),
    reasons: reasons.slice(0, 4),
    disclaimer: SOURCE_SIGNAL_DISCLAIMER,
  };
}

export function buildSourceSignalFromShadow(
  shadow: SourceScoreShadowPayload | null | undefined,
  clusterId: string,
  leadArticleId: string | undefined,
  sourceName?: string,
): SourceSignalPayload | null {
  if (!shadow) return null;

  const sourceById = new Map(shadow.sources.map((s) => [s.sourceId, s] as const));
  const sourceByName = new Map(shadow.sources.map((s) => [s.sourceName, s] as const));
  const overlayByArticle = new Map(
    shadow.articleOverlays.map((o) => [o.articleId, o] as const),
  );
  const clusterConf = shadow.clusterConfirmation.find((c) => c.clusterId === clusterId);

  if (sourceName) {
    const score = sourceByName.get(sourceName);
    if (!score) return null;
    const overlay = [...overlayByArticle.values()].find(
      (o) => o.sourceId === score.sourceId,
    );
    return buildSourceSignalFromScore(score, overlay);
  }

  const overlay = leadArticleId ? overlayByArticle.get(leadArticleId) : undefined;
  const score = overlay ? sourceById.get(overlay.sourceId) : shadow.sources[0];
  if (!score) return null;

  return buildSourceSignalFromScore(
    score,
    overlay,
    clusterConf?.duplicateConfirmationBoost,
  );
}

export interface PublishedItemWithSources {
  id: string;
  sources: Array<{ sourceName: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export function attachSourceSignalsToItems<T extends PublishedItemWithSources>(
  items: T[],
  shadow: SourceScoreShadowPayload | null | undefined,
  leadArticleIds: Map<string, string>,
): T[] {
  if (!shadow) return items;

  return items.map((item) => {
    const leadArticleId = leadArticleIds.get(item.id);
    const sourceSignal = buildSourceSignalFromShadow(
      shadow,
      item.id,
      leadArticleId,
    );

    const sources = item.sources.map((src) => ({
      ...src,
      sourceSignal: buildSourceSignalFromShadow(
        shadow,
        item.id,
        leadArticleId,
        src.sourceName,
      ),
    }));

    return { ...item, sourceSignal, sources };
  });
}
