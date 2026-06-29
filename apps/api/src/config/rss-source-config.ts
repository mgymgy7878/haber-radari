export interface RssSourceConfig {
  id: string;
  name: string;
  url: string;
  categoryHint: string;
  language: string;
  country: string;
  enabled: boolean;
  /** Registry legalMode=DISABLED / NEEDS_REVIEW vb. nedenlerle runtime ingest kapalı. */
  disabledReason?: string;
  trustTier: 'HIGH' | 'MEDIUM' | 'LOW';
}
