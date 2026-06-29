import type { RssSourceConfig } from '../config/rss-source-config.js';
import { AuthorityTier } from './source-score-types.js';

const TIER_BASE_SCORE: Record<AuthorityTier, number> = {
  [AuthorityTier.OFFICIAL]: 95,
  [AuthorityTier.PRIMARY_WIRE_OR_AGENCY]: 85,
  [AuthorityTier.ESTABLISHED_MEDIA]: 70,
  [AuthorityTier.LOCAL_MEDIA]: 55,
  [AuthorityTier.UNKNOWN]: 35,
  [AuthorityTier.BLOCKED_OR_LOW_TRUST]: 10,
};

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function resolveAuthorityTier(
  source: Pick<RssSourceConfig, 'id' | 'name' | 'url' | 'trustTier' | 'enabled'>,
): { tier: AuthorityTier; authorityScore: number; reasons: string[] } {
  const reasons: string[] = [];

  if (!source.enabled) {
    return {
      tier: AuthorityTier.BLOCKED_OR_LOW_TRUST,
      authorityScore: TIER_BASE_SCORE[AuthorityTier.BLOCKED_OR_LOW_TRUST],
      reasons: ['Kaynak devre dışı (shadow skor)'],
    };
  }

  const urlLower = source.url.toLowerCase();
  const nameLower = source.name.toLowerCase();

  if (
    /\.gov\.tr|\.bel\.tr|afad\.gov|kandilli|emniyet\.gov|icisleri\.gov|saglik\.gov|meb\.gov/.test(
      urlLower,
    )
  ) {
    reasons.push('Resmi kurum domain sinyali');
    return {
      tier: AuthorityTier.OFFICIAL,
      authorityScore: TIER_BASE_SCORE[AuthorityTier.OFFICIAL],
      reasons,
    };
  }

  if (
    source.id === 'aa_guncel' ||
    nameLower.includes('anadolu ajans') ||
    nameLower === 'aa'
  ) {
    reasons.push('Ajans / birincil haber sağlayıcı profili');
    return {
      tier: AuthorityTier.PRIMARY_WIRE_OR_AGENCY,
      authorityScore: TIER_BASE_SCORE[AuthorityTier.PRIMARY_WIRE_OR_AGENCY],
      reasons,
    };
  }

  if (nameLower.includes('trt') && source.trustTier === 'HIGH') {
    reasons.push('Kamu yayıncısı yüksek trust profili');
    return {
      tier: AuthorityTier.PRIMARY_WIRE_OR_AGENCY,
      authorityScore: TIER_BASE_SCORE[AuthorityTier.PRIMARY_WIRE_OR_AGENCY],
      reasons,
    };
  }

  if (source.trustTier === 'HIGH' || source.trustTier === 'MEDIUM') {
    reasons.push('Bilinen ulusal/yerel medya trust tier');
    return {
      tier: AuthorityTier.ESTABLISHED_MEDIA,
      authorityScore: TIER_BASE_SCORE[AuthorityTier.ESTABLISHED_MEDIA],
      reasons,
    };
  }

  if (source.trustTier === 'LOW') {
    reasons.push('Düşük trust tier — yerel/bilinmeyen profil');
    return {
      tier: AuthorityTier.LOCAL_MEDIA,
      authorityScore: TIER_BASE_SCORE[AuthorityTier.LOCAL_MEDIA],
      reasons,
    };
  }

  reasons.push('Kaynak profili tanımsız');
  return {
    tier: AuthorityTier.UNKNOWN,
    authorityScore: TIER_BASE_SCORE[AuthorityTier.UNKNOWN],
    reasons,
  };
}

/** Fixture/test için bilinmeyen kaynak profili. */
export function resolveUnknownSourceProfile(
  sourceName: string,
  sourceUrl: string,
): { tier: AuthorityTier; authorityScore: number; reasons: string[] } {
  return {
    tier: AuthorityTier.UNKNOWN,
    authorityScore: TIER_BASE_SCORE[AuthorityTier.UNKNOWN],
    reasons: [`Bilinmeyen kaynak: ${sourceName}`, `Domain: ${extractDomain(sourceUrl)}`],
  };
}

export function tierBaseScore(tier: AuthorityTier): number {
  return TIER_BASE_SCORE[tier];
}
