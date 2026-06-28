import Parser from 'rss-parser';
import crypto from 'crypto';
import { RSS_SOURCES, RssSourceConfig } from '../config/rss-sources.js';
import { RawArticle } from '../models/raw-article.js';

const parser = new Parser({
  timeout: 10000, // 10 seconds
});

function sanitizeHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').trim();
}

function generateId(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

export interface IngestStats {
  sourceCount: number;
  successfulSourceCount: number;
  failedSourceCount: number;
  rawArticleCount: number;
  duplicateDroppedCount: number;
}

export interface IngestResult {
  articles: RawArticle[];
  stats: IngestStats;
}

export class RssIngestService {
  async fetchAll(): Promise<IngestResult> {
    const enabledSources = RSS_SOURCES.filter(s => s.enabled);
    const articles: RawArticle[] = [];
    const stats: IngestStats = {
      sourceCount: enabledSources.length,
      successfulSourceCount: 0,
      failedSourceCount: 0,
      rawArticleCount: 0,
      duplicateDroppedCount: 0
    };

    const seenUrls = new Set<string>();
    const now = Date.now();
    // Fetch only articles from the last 48 hours
    const timeLimit = now - (48 * 60 * 60 * 1000);

    const fetchPromises = enabledSources.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        stats.successfulSourceCount++;
        
        // Take at most 20 items per source
        const items = feed.items.slice(0, 20);
        
        for (const item of items) {
          if (!item.link || !item.title) continue;
          
          if (seenUrls.has(item.link)) {
            stats.duplicateDroppedCount++;
            continue;
          }
          seenUrls.add(item.link);

          const publishedAt = item.pubDate ? new Date(item.pubDate).getTime() : now;
          if (publishedAt < timeLimit) continue; // Skip old news

          const description = item.contentSnippet || item.content || item.summary || '';
          let shortDescription = sanitizeHtml(description);
          if (shortDescription.length > 300) {
            shortDescription = shortDescription.substring(0, 297) + '...';
          }

          // Very simple image extraction from enclosures or regex if needed
          let imageUrl: string | undefined = undefined;
          if (item.enclosure?.url) {
            imageUrl = item.enclosure.url;
          }

          const rawArticle: RawArticle = {
            id: generateId(item.link),
            sourceId: source.id,
            sourceName: source.name,
            sourceUrl: source.url,
            originalUrl: item.link,
            originalTitle: item.title.trim(),
            shortDescription: shortDescription,
            publishedAt,
            fetchedAt: now,
            categoryHint: source.categoryHint,
            imageUrl,
            language: source.language,
            country: source.country
          };
          
          articles.push(rawArticle);
          stats.rawArticleCount++;
        }
      } catch (error) {
        console.error(`Failed to fetch RSS source ${source.name} (${source.url}):`, error);
        stats.failedSourceCount++;
      }
    });

    await Promise.allSettled(fetchPromises);
    
    // Sort overall articles by publishedAt descending
    articles.sort((a, b) => b.publishedAt - a.publishedAt);
    
    // Global limit of 150 items
    const limitedArticles = articles.slice(0, 150);
    stats.rawArticleCount = limitedArticles.length;

    return {
      articles: limitedArticles,
      stats
    };
  }
}
