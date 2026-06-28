export interface RssSourceConfig {
  id: string;
  name: string;
  url: string;
  categoryHint: string;
  language: string;
  country: string;
  enabled: boolean;
  trustTier: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const RSS_SOURCES: RssSourceConfig[] = [
  {
    id: 'aa_guncel',
    name: 'Anadolu Ajansı',
    url: 'https://www.aa.com.tr/tr/rss/default?cat=guncel',
    categoryHint: 'Güncel',
    language: 'tr',
    country: 'TR',
    enabled: true,
    trustTier: 'HIGH'
  },
  {
    id: 'trt_haber',
    name: 'TRT Haber',
    url: 'https://www.trthaber.com/manset_articles.rss',
    categoryHint: 'Manşet',
    language: 'tr',
    country: 'TR',
    enabled: true,
    trustTier: 'HIGH'
  },
  {
    id: 'ntv_son_dakika',
    name: 'NTV',
    url: 'https://www.ntv.com.tr/son-dakika.rss',
    categoryHint: 'Son Dakika',
    language: 'tr',
    country: 'TR',
    enabled: true,
    trustTier: 'MEDIUM'
  },
  {
    id: 'haberturk_ekonomi',
    name: 'Habertürk',
    url: 'https://www.haberturk.com/rss/ekonomi.xml',
    categoryHint: 'Ekonomi',
    language: 'tr',
    country: 'TR',
    enabled: true,
    trustTier: 'MEDIUM'
  }
];
