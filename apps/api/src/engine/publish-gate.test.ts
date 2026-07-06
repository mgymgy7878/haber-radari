import { describe, it, expect } from 'vitest';
import { PublishGate, TopicQuality, PublishDecision, ContentType, EvidenceStatus } from './publish-gate.js';
import { Cluster } from './cluster-engine.js';
import { RawArticle } from '../models/raw-article.js';

describe('PublishGate', () => {
  const gate = new PublishGate();

  const mockArticle = (id: string, sourceName: string, title: string, desc: string): RawArticle => ({
    id,
    sourceId: sourceName.toLowerCase(),
    sourceName,
    sourceUrl: `http://${sourceName.toLowerCase()}`,
    originalUrl: `http://${sourceName.toLowerCase()}/${id}`,
    originalTitle: title,
    shortDescription: desc,
    publishedAt: Date.now(),
    fetchedAt: Date.now(),
    categoryHint: 'News',
    language: 'tr',
    country: 'TR'
  });

  it('filters out asayis/crime even with multiple sources', () => {
    const cluster: Cluster = {
      id: 'c1',
      articles: [
        mockArticle('1', 'AA', 'İstanbulda uyuşturucu operasyonu', 'büyük yakalama'),
        mockArticle('2', 'DHA', 'Polis uyuşturucu operasyonu yaptı', 'gözaltına alındı')
      ],
      mainCategory: 'News',
      earliestPublishedAt: Date.now()
    };
    
    const result = gate.evaluate(cluster);
    expect(result.contentType).toBe(ContentType.ASAYIS_CRIME);
    expect(result.topicQuality).toBe(TopicQuality.LOW_VALUE);
    expect(result.decision).toBe(PublishDecision.FILTERED_OUT);
  });

  it('publishes critical disaster even if single source', () => {
    const cluster: Cluster = {
      id: 'c2',
      articles: [
        mockArticle('3', 'AA', 'Büyük deprem şiddetli yıkıma yol açtı', 'can kaybı var')
      ],
      mainCategory: 'News',
      earliestPublishedAt: Date.now()
    };
    
    const result = gate.evaluate(cluster);
    expect(result.contentType).toBe(ContentType.DISASTER_ALERT);
    expect(result.topicQuality).toBe(TopicQuality.CRITICAL);
    expect(result.decision).toBe(PublishDecision.PUBLISH_MAIN);
    expect(result.evidenceStatus).toBe(EvidenceStatus.SINGLE_SOURCE);
  });

  it('publishes normal news when multiple sources', () => {
    const cluster: Cluster = {
      id: 'c3',
      articles: [
        mockArticle('4', 'AA', 'Yeni vergi paketi açıklandı', 'açıklamalar geldi'),
        mockArticle('5', 'DHA', 'Hükümetten yeni vergi paketi', 'detaylar belli oldu')
      ],
      mainCategory: 'News',
      earliestPublishedAt: Date.now()
    };
    
    const result = gate.evaluate(cluster);
    expect(result.decision).toBe(PublishDecision.PUBLISH_MAIN);
    expect(result.evidenceStatus).toBe(EvidenceStatus.PARTIAL);
  });

  it('handles same-source diversity correctly', () => {
    // 3 articles from the SAME source
    const cluster: Cluster = {
      id: 'c4',
      articles: [
        mockArticle('6', 'AA', 'Yeni paket açıklandı', 'detaylar'),
        mockArticle('7', 'AA', 'Yeni paket detayları', 'açıklandı'),
        mockArticle('8', 'AA', 'Paket yürürlüğe girdi', 'işte detaylar')
      ],
      mainCategory: 'News',
      earliestPublishedAt: Date.now()
    };
    
    const result = gate.evaluate(cluster);
    // Even though there are 3 articles, they are from 1 unique source.
    expect(result.evidenceStatus).toBe(EvidenceStatus.SINGLE_SOURCE);
    // And since it's single source and not critical disaster, it shouldn't be PUBLISH_MAIN
    expect(result.decision).toBe(PublishDecision.WATCHLIST_ONLY);
  });

  it('filters generic earthquake SEO news', () => {
    const cluster: Cluster = {
      id: 'c5',
      articles: [
        mockArticle('9', 'AA', 'Son dakika deprem mi oldu?', 'İstanbul, Ankara, İzmir son depremler listesi'),
        mockArticle('10', 'DHA', 'Az önce deprem nerede oldu?', 'Kandilli son depremler')
      ],
      mainCategory: 'News',
      earliestPublishedAt: Date.now()
    };
    
    const result = gate.evaluate(cluster);
    expect(result.topicQuality).toBe(TopicQuality.NOISE);
    expect(result.decision).toBe(PublishDecision.FILTERED_OUT);
    expect(result.decision).not.toBe(PublishDecision.PUBLISH_MAIN);
  });

  it('filters political speeches into watchlist', () => {
    const cluster: Cluster = {
      id: 'c6',
      articles: [
        mockArticle('11', 'AA', 'İletişim Başkanı konuştu', 'önemli mesajlar verdi'),
        mockArticle('12', 'DHA', 'Cumhurbaşkanı töreninde konuştu', 'açıklamalarda bulundu')
      ],
      mainCategory: 'News',
      earliestPublishedAt: Date.now()
    };
    
    const result = gate.evaluate(cluster);
    expect(result.contentType).toBe(ContentType.POLITICAL_STATEMENT);
    expect(result.decision).toBe(PublishDecision.WATCHLIST_ONLY);
  });

  it('publishes official decisions', () => {
    const cluster: Cluster = {
      id: 'c7',
      articles: [
        mockArticle('13', 'AA', 'Yeni yönetmelik Resmi Gazete\'de yayımlandı', 'yürürlüğe girdi'),
        mockArticle('14', 'DHA', 'Karar yayımlandı', 'detaylar belli oldu')
      ],
      mainCategory: 'News',
      earliestPublishedAt: Date.now()
    };
    
    const result = gate.evaluate(cluster);
    expect(result.contentType).toBe(ContentType.NEWS_EVENT);
    expect(result.decision).toBe(PublishDecision.PUBLISH_MAIN);
  });

  it('filters single-source humanitarian aid to watchlist', () => {
    const cluster: Cluster = {
      id: 'c8',
      articles: [
        mockArticle('15', 'TRT', 'Türkiye\'nin yardım eli Venezuela\'da', 'yardım ekipleri ulaştı')
      ],
      mainCategory: 'Dünya',
      earliestPublishedAt: Date.now()
    };
    
    const result = gate.evaluate(cluster);
    expect(result.contentType).toBe(ContentType.HUMANITARIAN_AID);
    expect(result.topicQuality).toBe(TopicQuality.NORMAL);
    expect(result.decision).toBe(PublishDecision.WATCHLIST_ONLY);
    expect(result.decision).not.toBe(PublishDecision.PUBLISH_MAIN);
  });

  it('publishes critical disaster even if single source and ensures importance is not LOW', () => {
    const cluster: Cluster = {
      id: 'c9',
      articles: [
        mockArticle('16', 'AA', 'Kentucky selde 4 kişi öldü', 'büyük yıkım yaşandı')
      ],
      mainCategory: 'Güncel',
      earliestPublishedAt: Date.now()
    };
    
    const result = gate.evaluate(cluster);
    expect(result.contentType).toBe(ContentType.DISASTER_ALERT);
    expect(result.topicQuality).toBe(TopicQuality.CRITICAL);
    expect(result.decision).toBe(PublishDecision.PUBLISH_MAIN);
    expect(result.importance).not.toBe('LOW');
    expect(result.warningLabel).toBe('Tek kaynak / kaynak sinyali');
  });

  it('never publishes LOW importance events to MAIN', () => {
    const cluster: Cluster = {
      id: 'c10',
      articles: [
        mockArticle('17', 'AA', 'Yerel ligde basketbol maçı oynandı', 'sıradan bir maç'),
        mockArticle('18', 'DHA', 'Basketbol maçında heyecan', 'maç sonucu')
      ],
      mainCategory: 'Spor',
      earliestPublishedAt: Date.now()
    };
    
    const result = gate.evaluate(cluster);
    expect(result.topicQuality).toBe(TopicQuality.LOW_VALUE);
    expect(result.importance).toBe('LOW');
    expect(result.decision).not.toBe(PublishDecision.PUBLISH_MAIN);
  });

  it('publishes official sources single-source if critical or high value', () => {
    const cluster: Cluster = {
      id: 'c11',
      articles: [
        mockArticle('19', 'AFAD', 'Afet bölgesinde çadır kurulumu tamamlandı', 'AFAD ekipleri bölgede')
      ],
      mainCategory: 'Afet',
      earliestPublishedAt: Date.now()
    };
    const registry = [
      {
        sourceId: 'afad',
        sourceName: 'AFAD',
        sourceType: 'OFFICIAL',
        authorityTier: 'OFFICIAL_PRIMARY',
        publishEligible: true
      }
    ] as any[];

    const result = gate.evaluate(cluster, registry);
    expect(result.decision).toBe(PublishDecision.PUBLISH_MAIN);
    expect(result.warningLabel).toBe('Tek kaynak / kaynak sinyali');
  });

  it('publishes strong earthquake M>=5.0 even if single-source', () => {
    const cluster: Cluster = {
      id: 'c12',
      articles: [
        mockArticle('20', 'RANDOM_NEWS', 'Ege Denizi\'nde 5.4 büyüklüğünde deprem meydana geldi', 'sarsıntı hissedildi')
      ],
      mainCategory: 'Afet',
      earliestPublishedAt: Date.now()
    };

    const result = gate.evaluate(cluster);
    expect(result.decision).toBe(PublishDecision.PUBLISH_MAIN);
    expect(result.warningLabel).toBe('Tek kaynak / kaynak sinyali');
  });

  it('keeps earthquake M<5.0 in watchlist if official source', () => {
    const cluster: Cluster = {
      id: 'c13',
      articles: [
        mockArticle('21', 'AFAD', 'Muğla\'da 3.2 büyüklüğünde sarsıntı', 'hafif deprem')
      ],
      mainCategory: 'Afet',
      earliestPublishedAt: Date.now()
    };
    const registry = [
      {
        sourceId: 'afad',
        sourceName: 'AFAD',
        sourceType: 'OFFICIAL',
        authorityTier: 'OFFICIAL_PRIMARY',
        publishEligible: true
      }
    ] as any[];

    const result = gate.evaluate(cluster, registry);
    expect(result.decision).toBe(PublishDecision.WATCHLIST_ONLY);
    expect(result.reason).toContain('Deprem büyüklüğü eşik değerin');
  });

  it('publishes trusted commercial single-source high-value and gets warning label', () => {
    const cluster: Cluster = {
      id: 'c14',
      articles: [
        mockArticle('22', 'ntv_son_dakika', 'Merkez Bankası faiz kararı duyurusu', 'Faizler sabit tutuldu')
      ],
      mainCategory: 'Ekonomi',
      earliestPublishedAt: Date.now()
    };
    const registry = [
      {
        sourceId: 'ntv_son_dakika',
        sourceName: 'NTV Son Dakika',
        sourceType: 'COMMERCIAL_MEDIA',
        authorityTier: 'ESTABLISHED_MEDIA',
        publishEligible: true,
        legalMode: 'TITLE_LINK_ONLY',
        licenseStatus: 'none'
      }
    ] as any[];

    const result = gate.evaluate(cluster, registry);
    expect(result.decision).toBe(PublishDecision.PUBLISH_MAIN);
    expect(result.warningLabel).toBe('Tek kaynak / kaynak sinyali');
  });

  it('filters out low-value commercial single-source', () => {
    const cluster: Cluster = {
      id: 'c15',
      articles: [
        mockArticle('23', 'ntv_son_dakika', 'Ünlü oyuncu yakalandı şok detaylar', 'asayiş magazin haberi')
      ],
      mainCategory: 'Genel',
      earliestPublishedAt: Date.now()
    };
    const registry = [
      {
        sourceId: 'ntv_son_dakika',
        sourceName: 'NTV Son Dakika',
        sourceType: 'COMMERCIAL_MEDIA',
        authorityTier: 'ESTABLISHED_MEDIA',
        publishEligible: true,
        legalMode: 'TITLE_LINK_ONLY',
        licenseStatus: 'none'
      }
    ] as any[];

    const result = gate.evaluate(cluster, registry);
    expect(result.decision).toBe(PublishDecision.FILTERED_OUT);
  });

  it('filters out clickbait title single-source', () => {
    const cluster: Cluster = {
      id: 'c16',
      articles: [
        mockArticle('24', 'ntv_son_dakika', 'Öyle bir şey yaptı ki herkes şok oldu! İşte en iyi öneri', 'tıklama tuzağı')
      ],
      mainCategory: 'Genel',
      earliestPublishedAt: Date.now()
    };
    const registry = [
      {
        sourceId: 'ntv_son_dakika',
        sourceName: 'NTV Son Dakika',
        sourceType: 'COMMERCIAL_MEDIA',
        authorityTier: 'ESTABLISHED_MEDIA',
        publishEligible: true,
        legalMode: 'TITLE_LINK_ONLY',
        licenseStatus: 'none'
      }
    ] as any[];

    const result = gate.evaluate(cluster, registry);
    expect(result.decision).toBe(PublishDecision.FILTERED_OUT);
    expect(result.reason).toContain('Düşük değerli içerik');
  });

  it('blocks publication if source is DISABLED or NEEDS_REVIEW', () => {
    const cluster: Cluster = {
      id: 'c17',
      articles: [
        mockArticle('25', 'trt_haber', 'Kritik dış yardım tamamlandı', 'TRT haber detayı')
      ],
      mainCategory: 'Genel',
      earliestPublishedAt: Date.now()
    };
    const registry = [
      {
        sourceId: 'trt_haber',
        sourceName: 'TRT Haber',
        sourceType: 'news_media',
        authorityTier: 'PRIMARY_WIRE_OR_AGENCY',
        publishEligible: false,
        legalMode: 'NEEDS_REVIEW',
        licenseStatus: 'none'
      }
    ] as any[];

    const result = gate.evaluate(cluster, registry);
    expect(result.decision).toBe(PublishDecision.FILTERED_OUT);
    expect(result.reason).toContain('Hukuki engel nedeniyle yayınlanamadı');
  });
});
