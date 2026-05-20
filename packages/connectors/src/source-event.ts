import type { EventCategory, SourceFetchMode, SourceType } from "@haber-radari/news-core";

/** Connector çıkışı — policy öncesi normalize edilir */
export interface SourceEvent {
  externalId: string;
  title: string;
  summary: string;
  category: EventCategory;
  publishedAt: string;
  sourceType: SourceType;
  sourceNames: string[];
  sourceTrustScore?: number;
  tags?: string[];
  externalUrl?: string;
  locationLabel?: string;
  /** Skor ipuçları — normalize aşamasında kullanılır */
  hints?: {
    importanceScore?: number;
    marketImpactScore?: number;
    involvesPublicFigure?: boolean;
    isOfficialSource?: boolean;
  };
}

export type ConnectorMode = SourceFetchMode;

export interface ConnectorStatusSnapshot {
  connectorId: string;
  displayName: string;
  mode: ConnectorMode;
  requiresApiKey: boolean;
  lastFetchAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  itemCount: number;
  feedUrl?: string;
  note?: string;
}

export interface ConnectorIngestResult {
  connectorId: string;
  events: SourceEvent[];
  status: ConnectorStatusSnapshot;
}
