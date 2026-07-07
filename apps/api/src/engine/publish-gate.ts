import { Cluster } from './cluster-engine.js';
import {
  containsCriticalDisasterSeverity,
  containsDisasterAlertSignal,
  containsSportContext,
  containsHarmCasualtyToken,
} from './turkish-text-match.js';
import { SourceRegistryEntry } from '../source-registry/source-registry-types.js';

export enum EvidenceStatus {
  CONFIRMED = 'CONFIRMED',
  PARTIAL = 'PARTIAL',
  SINGLE_SOURCE = 'SINGLE_SOURCE',
  LOW_CONFIDENCE = 'LOW_CONFIDENCE'
}

export enum PublishDecision {
  PUBLISH_MAIN = 'PUBLISH_MAIN',
  WATCHLIST_ONLY = 'WATCHLIST_ONLY',
  FILTERED_OUT = 'FILTERED_OUT',
  RAW_ONLY = 'RAW_ONLY'
}

export enum TopicQuality {
  CRITICAL = 'CRITICAL',
  HIGH_VALUE = 'HIGH_VALUE',
  NORMAL = 'NORMAL',
  LOW_VALUE = 'LOW_VALUE',
  NOISE = 'NOISE'
}

export enum ContentType {
  NEWS_EVENT = 'NEWS_EVENT',
  POLITICAL_STATEMENT = 'POLITICAL_STATEMENT',
  ASAYIS_CRIME = 'ASAYIS_CRIME',
  NATIONAL_SECURITY = 'NATIONAL_SECURITY',
  ECONOMY_DATA = 'ECONOMY_DATA',
  DISASTER_ALERT = 'DISASTER_ALERT',
  DISASTER_FOLLOW_UP = 'DISASTER_FOLLOW_UP',
  LISTICLE_OR_ENTERTAINMENT = 'LISTICLE_OR_ENTERTAINMENT',
  SPORTS = 'SPORTS',
  HUMANITARIAN_AID = 'HUMANITARIAN_AID',
  UNKNOWN = 'UNKNOWN'
}

export interface PublishResult {
  decision: PublishDecision;
  evidenceStatus: EvidenceStatus;
  topicQuality: TopicQuality;
  contentType: ContentType;
  importance: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  reason: string | null;
  warningLabel: string | null;
}

export class PublishGate {
  
  private extractEarthquakeMagnitude(text: string): number | null {
    const match = text.match(/(\d+(?:[,.]\d+)?)\s*(?:büyüklüğünde|magnitüd|ml|mw|md|magnitude|deprem)/i) || 
                  text.match(/(?:büyüklüğünde|magnitüd|ml|mw|md|magnitude)\s*(\d+(?:[,.]\d+)?)/i) ||
                  text.match(/m\s*:\s*(\d+(?:[,.]\d+)?)/i) ||
                  text.match(/m\s*(\d+(?:[,.]\d+)?)\s+deprem/i);
    if (match) {
      const val = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(val)) return val;
    }
    return null;
  }

  public evaluate(cluster: Cluster, registry?: SourceRegistryEntry[]): PublishResult {
    const combinedText = cluster.articles.map(a => a.originalTitle + ' ' + a.shortDescription).join(' ').toLowerCase();
    
    const uniqueSourceCount = new Set(cluster.articles.map(a => a.sourceName)).size;

    const contentType = this.determineContentType(combinedText);
    const topicQuality = this.determineTopicQuality(contentType, combinedText);
    const evidenceStatus = this.determineEvidenceStatus(uniqueSourceCount);
    let importance = this.determineImportance(topicQuality);
    
    let decision = PublishDecision.WATCHLIST_ONLY;
    let reason: string | null = null;
    let warningLabel: string | null = null;
    
    let isOfficialSource = false;
    let isTrustedCommercialSource = false;
    let hasLegallyBlockedSource = false;
    let blockedReason: string | null = null;

    if (registry) {
      const sourceIds = cluster.articles.map(a => a.sourceId);
      for (const sId of sourceIds) {
        const sourceEntry = registry.find(s => s.sourceId === sId);
        if (sourceEntry) {
          if (
            sourceEntry.legalMode === 'DISABLED' ||
            sourceEntry.legalMode === 'NEEDS_REVIEW' ||
            !sourceEntry.publishEligible ||
            (sourceEntry.legalMode === 'LICENSED' && sourceEntry.licenseStatus !== 'active')
          ) {
            hasLegallyBlockedSource = true;
            blockedReason = `Hukuki engel nedeniyle yayınlanamadı: ${sourceEntry.sourceName}`;
            break;
          }
          if (
            sourceEntry.sourceType === 'OFFICIAL' ||
            sourceEntry.sourceType === 'official_institution' ||
            sourceEntry.sourceType === 'regulator' ||
            sourceEntry.sourceType === 'market_data' ||
            sourceEntry.authorityTier === 'OFFICIAL_PRIMARY'
          ) {
            isOfficialSource = true;
          } else if (sourceEntry.publishEligible) {
            isTrustedCommercialSource = true;
          }
        }
      }
    }

    if (hasLegallyBlockedSource) {
      return {
        decision: PublishDecision.FILTERED_OUT,
        evidenceStatus,
        topicQuality,
        contentType,
        importance,
        confidence: 0,
        reason: blockedReason,
        warningLabel: null
      };
    }

    const isEarthquake = /(deprem|sarsıntı)/i.test(combinedText);
    const magnitude = isEarthquake ? this.extractEarthquakeMagnitude(combinedText) : null;
    const isStrongEarthquake = magnitude !== null && magnitude >= 5.0;

    if (contentType === ContentType.UNKNOWN && topicQuality === TopicQuality.NOISE) {
      decision = PublishDecision.FILTERED_OUT;
      reason = "Generic SEO veya Evergreen içerik (Son dakika deprem vb.)";
    } else if (topicQuality === TopicQuality.NOISE || topicQuality === TopicQuality.LOW_VALUE) {
      decision = PublishDecision.FILTERED_OUT;
      reason = "Düşük değerli içerik (Asayiş, Magazin veya Liste)";
    } else if (contentType === ContentType.POLITICAL_STATEMENT) {
      decision = PublishDecision.WATCHLIST_ONLY;
      reason = "Siyasi demeçler ana akış yerine takip listesine alındı.";
    } else if (evidenceStatus === EvidenceStatus.SINGLE_SOURCE) {
      if (importance === 'LOW') {
         decision = PublishDecision.FILTERED_OUT;
         reason = "Tek kaynaklı ve düşük öncelikli olay.";
      } else if (isStrongEarthquake) {
         decision = PublishDecision.PUBLISH_MAIN;
         reason = "Ana akışa alınma nedeni: Tek kaynaklı ama kritik olay bildirimi";
         warningLabel = "Tek kaynak / kaynak sinyali";
         importance = 'HIGH';
      } else if (
        topicQuality === TopicQuality.CRITICAL &&
        contentType === ContentType.DISASTER_ALERT &&
        !containsSportContext(combinedText) &&
        (!isEarthquake || containsHarmCasualtyToken(combinedText)) &&
        containsCriticalDisasterSeverity(combinedText)
      ) {
         decision = PublishDecision.PUBLISH_MAIN;
         reason = "Ana akışa alınma nedeni: Tek kaynaklı ama kritik olay bildirimi";
         warningLabel = "Tek kaynak / kaynak sinyali";
         importance = 'MEDIUM'; 
      } else if (isOfficialSource) {
         if (isEarthquake && !isStrongEarthquake && !containsHarmCasualtyToken(combinedText)) {
            decision = PublishDecision.WATCHLIST_ONLY;
            reason = "Deprem büyüklüğü eşik değerin (M≥5.0) altında veya bilinmiyor. İzlemeye alındı.";
         } else {
            decision = PublishDecision.PUBLISH_MAIN;
            reason = "Ana akışa alınma nedeni: Resmi kaynaktan tek kaynaklı önemli duyuru";
            warningLabel = "Tek kaynak / kaynak sinyali";
         }
      } else if (isTrustedCommercialSource) {
         decision = PublishDecision.PUBLISH_MAIN;
         reason = "Ana akışa alınma nedeni: Kaynak profili uygun ticari kaynaktan tek kaynaklı haber";
         warningLabel = "Tek kaynak / kaynak sinyali";
      } else if (contentType === ContentType.DISASTER_FOLLOW_UP) {
         decision = PublishDecision.WATCHLIST_ONLY;
         reason = "Afet sonrası takip/yerel dönüşüm haberi. Tek kaynaklı olduğu için ana akışa alınmadı.";
      } else {
         decision = PublishDecision.WATCHLIST_ONLY;
         reason = "Doğrulama bekleniyor (Tek kaynaklı)";
      }
    } else if (uniqueSourceCount >= 2) {
      decision = PublishDecision.PUBLISH_MAIN;
      reason = "Ana akışa alınma nedeni: Çok kaynaklı doğrulama";
    } else {
      decision = PublishDecision.WATCHLIST_ONLY;
      reason = "Doğrulama bekleniyor";
    }
    
    if (decision === PublishDecision.PUBLISH_MAIN && importance === 'LOW') {
       decision = PublishDecision.WATCHLIST_ONLY;
       reason = "Düşük öncelikli olduğu için ana akışa alınmadı.";
    }
    
    return {
      decision,
      evidenceStatus,
      topicQuality,
      contentType,
      importance,
      confidence: Math.min(0.95, 0.5 + (cluster.articles.length * 0.15)),
      reason,
      warningLabel
    };
  }
  
  private determineContentType(text: string): ContentType {
    if (/(son dakika deprem mi oldu|az önce deprem nerede oldu|son depremler|canlı|son dakika haberleri|güncel gelişmeler|tüm detaylar|ne zaman, nerede, nasıl)/i.test(text)) return ContentType.UNKNOWN;
    if (/(en iyi|tarihinin|lanetli|görmeniz gereken|öneri)/i.test(text)) return ContentType.LISTICLE_OR_ENTERTAINMENT;
    if (/(yakalandı|gözaltına alındı|operasyon|koçbaşı|uyuşturucu|cinayet|kavga)/i.test(text)) return ContentType.ASAYIS_CRIME;
    if (/(resmi gazete'de yayımlandı|yürürlüğe girdi)/i.test(text)) return ContentType.NEWS_EVENT;
    if (/(konuştu|dedi|açıkladı|değerlendirdi|mesaj verdi|töreninde konuştu|toplantısında konuştu|cumhurbaşkanı|iletişim başkanı|parti sözcüsü)/i.test(text)) return ContentType.POLITICAL_STATEMENT;
    if (/(yardım|arama kurtarma|insani yardım|ekip|yardım eli)/i.test(text)) return ContentType.HUMANITARIAN_AID;
    if (/(gençlik alanına|dönüştürülecek|anma töreni|yeniden inşa)/i.test(text)) return ContentType.DISASTER_FOLLOW_UP;
    if (containsSportContext(text) && !containsDisasterAlertSignal(text)) return ContentType.SPORTS;
    if (containsDisasterAlertSignal(text)) return ContentType.DISASTER_ALERT;
    if (/(faiz|enflasyon|tüik|merkez bankası|bddk|spk)/i.test(text)) return ContentType.ECONOMY_DATA;
    if (/(savaş|sınır|harekat|terör)/i.test(text)) return ContentType.NATIONAL_SECURITY;
    if (/(futbol|basketbol|transfer|maç)/i.test(text)) return ContentType.SPORTS;
    
    return ContentType.NEWS_EVENT;
  }
  
  private determineTopicQuality(contentType: ContentType, text: string): TopicQuality {
    if (contentType === ContentType.UNKNOWN && /(son dakika deprem mi oldu|az önce deprem nerede oldu|son depremler|canlı|son dakika haberleri|güncel gelişmeler|tüm detaylar|ne zaman, nerede, nasıl)/i.test(text)) return TopicQuality.NOISE;
    if (contentType === ContentType.LISTICLE_OR_ENTERTAINMENT) return TopicQuality.NOISE;
    if (contentType === ContentType.ASAYIS_CRIME || contentType === ContentType.SPORTS) return TopicQuality.LOW_VALUE;
    
    if (contentType === ContentType.DISASTER_ALERT && containsCriticalDisasterSeverity(text)) return TopicQuality.CRITICAL;
    if (contentType === ContentType.ECONOMY_DATA && /(açıkladı|kararı)/i.test(text)) return TopicQuality.CRITICAL;
    if (contentType === ContentType.NATIONAL_SECURITY) return TopicQuality.CRITICAL;
    
    if (contentType === ContentType.POLITICAL_STATEMENT) return TopicQuality.NORMAL;
    if (contentType === ContentType.HUMANITARIAN_AID) return TopicQuality.NORMAL;
    if (contentType === ContentType.DISASTER_FOLLOW_UP) return TopicQuality.NORMAL;
    
    return TopicQuality.NORMAL;
  }
  
  private determineEvidenceStatus(sourceCount: number): EvidenceStatus {
    if (sourceCount >= 3) return EvidenceStatus.CONFIRMED;
    if (sourceCount === 2) return EvidenceStatus.PARTIAL;
    return EvidenceStatus.SINGLE_SOURCE;
  }
  
  private determineImportance(quality: TopicQuality): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    switch (quality) {
      case TopicQuality.CRITICAL: return 'CRITICAL';
      case TopicQuality.HIGH_VALUE: return 'HIGH';
      case TopicQuality.NORMAL: return 'MEDIUM';
      default: return 'LOW';
    }
  }
}
