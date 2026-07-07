export enum AiNewsValueDecision {
  SHOW_MAIN = 'SHOW_MAIN',
  SHOW_MONITORING = 'SHOW_MONITORING',
  HIDE_CLICKBAIT = 'HIDE_CLICKBAIT',
  HIDE_LOW_VALUE = 'HIDE_LOW_VALUE',
  HIDE_LEGAL_BLOCKED = 'HIDE_LEGAL_BLOCKED',
}

export type LegalModeStatus = 'ENABLED' | 'DISABLED' | 'NEEDS_REVIEW';
export type SourceAuthorityTier = 'OFFICIAL_PUBLIC_SOURCE' | 'SOURCE_PROFILE_STRONG' | 'REPUTABLE' | 'STANDARD' | 'UNVERIFIED';

export interface NewsValueInput {
  title: string;
  sourceName: string;
  category: string;
  legalMode: LegalModeStatus;
  authorityTier: SourceAuthorityTier;
  hasLicensedContent?: boolean; // For AA, DHA, İHA etc.
  personalPriorityBoost?: number; // 0 to 30
}

export interface NewsValueOutput {
  decision: AiNewsValueDecision;
  newsValueScore: number;
  noiseScore: number;
  personalizedScore: number;
  reasonCode: string;
}

export class AiNewsValueEngine {
  static evaluate(input: NewsValueInput): NewsValueOutput {
    // 1. Legal Order
    if (input.legalMode === 'DISABLED' || input.legalMode === 'NEEDS_REVIEW') {
      return {
        decision: AiNewsValueDecision.HIDE_LEGAL_BLOCKED,
        newsValueScore: 0,
        noiseScore: 0,
        personalizedScore: 0,
        reasonCode: `LEGAL_BLOCKED_${input.legalMode}`
      };
    }

    const licensedSources = ['AA', 'DHA', 'İHA', 'IHA', 'Reuters', 'AP', 'AFP'];
    const isLicensedSource = licensedSources.some(s => input.sourceName.toUpperCase().includes(s.toUpperCase()));
    if (isLicensedSource && input.hasLicensedContent === false) {
      return {
        decision: AiNewsValueDecision.HIDE_LEGAL_BLOCKED,
        newsValueScore: 0,
        noiseScore: 0,
        personalizedScore: 0,
        reasonCode: 'LEGAL_BLOCKED_UNLICENSED_AGENCY'
      };
    }

    let newsValueScore = 0;
    let noiseScore = 0;

    // 2. Source Bonuses
    if (input.authorityTier === 'OFFICIAL_PUBLIC_SOURCE') {
      newsValueScore += 40;
    } else if (input.authorityTier === 'SOURCE_PROFILE_STRONG' || input.authorityTier === 'REPUTABLE') {
      newsValueScore += 20;
    }

    // 3. Category Bonuses
    const categoryLower = input.category.toLowerCase();
    if (categoryLower.match(/(afet|deprem|güvenlik|acil)/i)) {
      newsValueScore += 40;
    } else if (categoryLower.match(/(ekonomi|piyasa|bist|tcmb|kap|spk|finans)/i)) {
      newsValueScore += 30;
    } else if (categoryLower.match(/(resmi|duyuru)/i)) {
      newsValueScore += 30;
    } else if (categoryLower.match(/(dünya|savaş|kriz|diplomasi)/i)) {
      newsValueScore += 25;
    } else if (categoryLower.match(/(teknoloji|yapay zeka|ai|startup)/i)) {
      newsValueScore += 20;
    }

    // 4. Keyword Bonuses (Title)
    const titleLower = input.title.toLowerCase();
    let keywordBonus = 0;
    if (titleLower.match(/(karar|açıklandı|faiz|atama|deprem\s*m[>=]?5|düzenleme|soruşturma|yaptırım|bilanço)/i)) {
      keywordBonus += 20;
    } else if (titleLower.match(/(açıklama|beklenti|uyarı)/i)) {
      keywordBonus += 10;
    }
    newsValueScore += Math.min(keywordBonus, 20); // Cap keyword bonus just in case
    newsValueScore = Math.min(newsValueScore, 100);

    // 5. Noise Score
    if (titleLower.match(/(mi oldu\?|nerede oldu\?|ne zaman\?)$/i)) {
      noiseScore += 50;
    }
    if (titleLower.match(/(şoke eden|işte o detay|görenleri şaşırt|korkutan|son dakika deprem mi oldu)/i)) {
      noiseScore += 40;
    }
    if (categoryLower.match(/(magazin|asayiş|3\. sayfa)/i)) {
      noiseScore += 60;
    }
    // Simplistic SEO evergreen check
    if (titleLower.match(/deprem.*son depremler.*kandilli/i) || titleLower.match(/hangi ilde deprem oldu/i)) {
      noiseScore += 70;
    }
    noiseScore = Math.min(noiseScore, 100);

    // 6. Calculate Personalized Score
    const personalBoost = input.personalPriorityBoost ? Math.min(input.personalPriorityBoost, 30) : 0;
    const personalizedScore = Math.min(100, newsValueScore + personalBoost);

    // 7. Decision Thresholds
    let decision: AiNewsValueDecision;
    let reasonCode = '';

    if (noiseScore > 50) {
      // Official/Public Source exemption:
      if (input.authorityTier === 'OFFICIAL_PUBLIC_SOURCE' && newsValueScore >= 70) {
        decision = AiNewsValueDecision.SHOW_MAIN;
        reasonCode = 'SHOW_MAIN_OFFICIAL_OVERRIDE';
      } else {
        decision = categoryLower.match(/(magazin|asayiş)/i) ? AiNewsValueDecision.HIDE_LOW_VALUE : AiNewsValueDecision.HIDE_CLICKBAIT;
        reasonCode = decision === AiNewsValueDecision.HIDE_CLICKBAIT ? 'NOISE_CLICKBAIT' : 'NOISE_LOW_VALUE';
      }
    } else if (newsValueScore >= 85) {
      decision = AiNewsValueDecision.SHOW_MAIN;
      reasonCode = 'SHOW_MAIN_GLOBAL_CRITICAL';
    } else if (personalizedScore >= 75) {
      decision = AiNewsValueDecision.SHOW_MAIN;
      reasonCode = 'SHOW_MAIN_PERSONALIZED';
    } else if (personalizedScore >= 40) {
      decision = AiNewsValueDecision.SHOW_MONITORING;
      reasonCode = 'SHOW_MONITORING_THRESHOLD';
    } else {
      decision = AiNewsValueDecision.HIDE_LOW_VALUE;
      reasonCode = 'LOW_VALUE_THRESHOLD';
    }

    return {
      decision,
      newsValueScore,
      noiseScore,
      personalizedScore,
      reasonCode
    };
  }
}
