import type { RssSourceConfig } from '../config/rss-source-config.js';
import type { LegalMode } from './source-registry-schema.js';
import {
  getSourceById,
  loadSourceRegistryV0,
  type SourceRegistryV0Document,
} from './source-registry-loader.js';

/**
 * API RSS runtime parity v0 — yalnızca bu kaynaklar `RSS_SOURCES` çıktısına girer.
 * Registry’deki 21 kaynağın tamamı otomatik ingest’e açılmaz.
 */
export const API_RSS_RUNTIME_SOURCE_IDS = [
  'aa_guncel',
  'trt_haber',
  'ntv_son_dakika',
  'haberturk_ekonomi',
] as const;

export type ApiRssRuntimeSourceId = (typeof API_RSS_RUNTIME_SOURCE_IDS)[number];

/**
 * Runtime ingest enable matrisi — `publishEligible` DEĞİL.
 * SSOT planı: DISABLED/NEEDS_REVIEW production ingest’e girmez; parity korunur.
 */
export const API_RSS_RUNTIME_ENABLE_V0: Record<
  ApiRssRuntimeSourceId,
  { enabled: boolean; disabledReason?: string }
> = {
  aa_guncel: {
    enabled: false,
    disabledReason: 'registry_legal_mode_disabled_no_license',
  },
  trt_haber: {
    enabled: false,
    disabledReason: 'registry_needs_review_pending',
  },
  ntv_son_dakika: { enabled: true },
  haberturk_ekonomi: { enabled: true },
};

/** Registry displayName ile runtime `name` farklı olan alanlar (parity). */
export const API_RSS_RUNTIME_NAME_OVERRIDES_V0: Partial<Record<ApiRssRuntimeSourceId, string>> = {
  ntv_son_dakika: 'NTV',
  haberturk_ekonomi: 'Habertürk',
};

/** trustTier parity — authorityTier türetimi yerine dondurulmuş runtime değerleri. */
export const API_RSS_RUNTIME_TRUST_TIER_V0: Record<
  ApiRssRuntimeSourceId,
  RssSourceConfig['trustTier']
> = {
  aa_guncel: 'HIGH',
  trt_haber: 'HIGH',
  ntv_son_dakika: 'MEDIUM',
  haberturk_ekonomi: 'MEDIUM',
};

/** Pre-migration parity snapshot — regression test referansı. */
export const RSS_SOURCES_PARITY_SNAPSHOT_V0: readonly RssSourceConfig[] = [
  {
    id: 'aa_guncel',
    name: 'Anadolu Ajansı',
    url: 'https://www.aa.com.tr/tr/rss/default?cat=guncel',
    categoryHint: 'Güncel',
    language: 'tr',
    country: 'TR',
    enabled: false,
    disabledReason: 'registry_legal_mode_disabled_no_license',
    trustTier: 'HIGH',
  },
  {
    id: 'trt_haber',
    name: 'TRT Haber',
    url: 'https://www.trthaber.com/manset_articles.rss',
    categoryHint: 'Manşet',
    language: 'tr',
    country: 'TR',
    enabled: false,
    disabledReason: 'registry_needs_review_pending',
    trustTier: 'HIGH',
  },
  {
    id: 'ntv_son_dakika',
    name: 'NTV',
    url: 'https://www.ntv.com.tr/son-dakika.rss',
    categoryHint: 'Son Dakika',
    language: 'tr',
    country: 'TR',
    enabled: true,
    trustTier: 'MEDIUM',
  },
  {
    id: 'haberturk_ekonomi',
    name: 'Habertürk',
    url: 'https://www.haberturk.com/rss/ekonomi.xml',
    categoryHint: 'Ekonomi',
    language: 'tr',
    country: 'TR',
    enabled: true,
    trustTier: 'MEDIUM',
  },
];

export interface ApiRssSourceDerived extends RssSourceConfig {
  legalMode: LegalMode;
  registrySourceId: ApiRssRuntimeSourceId;
}

function assertRegistryEligibleForApiRssList(
  sourceId: ApiRssRuntimeSourceId,
  legalMode: LegalMode,
  runtimeEnabled: boolean,
): void {
  if (legalMode === 'DISABLED' || legalMode === 'NEEDS_REVIEW') {
    if (runtimeEnabled) {
      throw new Error(
        `API RSS parity guard: ${sourceId} legalMode=${legalMode} iken enabled=true olamaz`,
      );
    }
  }
}

export function deriveApiRssSourcesFromRegistry(
  registry: SourceRegistryV0Document = loadSourceRegistryV0(),
): ApiRssSourceDerived[] {
  const derived: ApiRssSourceDerived[] = [];

  for (const sourceId of API_RSS_RUNTIME_SOURCE_IDS) {
    const entry = getSourceById(registry, sourceId);
    if (!entry) {
      throw new Error(`Source registry SSOT kaydı eksik: ${sourceId}`);
    }
    if (!entry.feedUrl?.trim()) {
      throw new Error(`Source registry feedUrl eksik: ${sourceId}`);
    }

    const runtime = API_RSS_RUNTIME_ENABLE_V0[sourceId];
    assertRegistryEligibleForApiRssList(sourceId, entry.legalMode, runtime.enabled);

    const config: ApiRssSourceDerived = {
      id: entry.sourceId,
      name: API_RSS_RUNTIME_NAME_OVERRIDES_V0[sourceId] ?? entry.sourceName,
      url: entry.feedUrl,
      categoryHint: entry.category ?? '',
      language: entry.language ?? 'tr',
      country: entry.country ?? 'TR',
      enabled: runtime.enabled,
      trustTier: API_RSS_RUNTIME_TRUST_TIER_V0[sourceId],
      legalMode: entry.legalMode,
      registrySourceId: sourceId,
    };

    if (runtime.disabledReason) {
      config.disabledReason = runtime.disabledReason;
    }

    derived.push(config);
  }

  return derived;
}

/** `RssSourceConfig` public shape — smart-feed/ingest uyumluluğu için legalMode strip. */
export function toRssSourceConfigs(derived: ApiRssSourceDerived[]): RssSourceConfig[] {
  return derived.map(({ legalMode: _legalMode, registrySourceId: _registrySourceId, ...config }) => ({
    ...config,
  }));
}

export function buildApiRssSourcesFromRegistry(
  registry: SourceRegistryV0Document = loadSourceRegistryV0(),
): RssSourceConfig[] {
  return toRssSourceConfigs(deriveApiRssSourcesFromRegistry(registry));
}

export function getApiRssSourceLegalMode(
  sourceId: string,
  registry: SourceRegistryV0Document = loadSourceRegistryV0(),
): LegalMode | undefined {
  if (!(API_RSS_RUNTIME_SOURCE_IDS as readonly string[]).includes(sourceId)) {
    return undefined;
  }
  return getSourceById(registry, sourceId)?.legalMode;
}
