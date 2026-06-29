export type { RssSourceConfig } from './rss-source-config.js';
import { buildApiRssSourcesFromRegistry } from '../source-registry/source-registry-rss-sources.js';

/** API RSS kaynakları — Source Registry SSOT’tan türetilir (parity v0). */
export const RSS_SOURCES = buildApiRssSourcesFromRegistry();
