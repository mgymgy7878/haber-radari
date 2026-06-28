/** Shadow/read-only kaynak otorite + sağlık skoru — publish kararını etkilemez. */

export enum AuthorityTier {
  OFFICIAL = 'OFFICIAL',
  PRIMARY_WIRE_OR_AGENCY = 'PRIMARY_WIRE_OR_AGENCY',
  ESTABLISHED_MEDIA = 'ESTABLISHED_MEDIA',
  LOCAL_MEDIA = 'LOCAL_MEDIA',
  UNKNOWN = 'UNKNOWN',
  BLOCKED_OR_LOW_TRUST = 'BLOCKED_OR_LOW_TRUST',
}

export interface SourceScore {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  sourceDomain: string;
  authorityTier: AuthorityTier;
  authorityScore: number;
  healthScore: number;
  freshnessScore: number;
  metadataCompletenessScore: number;
  failurePenalty: number;
  duplicateConfirmationBoost: number;
  finalSourceScore: number;
  reasons: string[];
}

export interface ArticleSourceScoreOverlay {
  articleId: string;
  sourceId: string;
  duplicateConfirmationBoost: number;
  finalSourceScore: number;
  reasons: string[];
}

export interface SourceScoreShadowPayload {
  version: 'v0';
  readOnly: true;
  disclaimer: 'Güvenilirlik sinyali / kaynak sağlığı; mutlak doğruluk iddiası değildir.';
  sources: SourceScore[];
  articleOverlays: ArticleSourceScoreOverlay[];
  clusterConfirmation: Array<{
    clusterId: string;
    uniqueSourceCount: number;
    duplicateConfirmationBoost: number;
  }>;
}

export interface SourceFetchStatus {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  success: boolean;
  fetchedAt: number;
  itemCount: number;
  skippedMissingMetadataCount: number;
}

export interface SourceHealthInput {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  trustTier: 'HIGH' | 'MEDIUM' | 'LOW';
  enabled: boolean;
  fetchStatus?: SourceFetchStatus;
  articles: Array<{
    id: string;
    originalTitle: string;
    originalUrl: string;
    publishedAt: number;
    shortDescription: string;
  }>;
  nowMs: number;
}

export interface ClusterConfirmationInput {
  clusterId: string;
  articleIds: string[];
  sourceIds: string[];
  uniqueSourceCount: number;
}
