import { describe, it, expect } from 'vitest';
import { ClusterEngine } from './cluster-engine.js';
import { RawArticle } from '../models/raw-article.js';

describe('ClusterEngine', () => {
  const engine = new ClusterEngine();

  const mockArticle = (id: string, title: string, desc: string, category: string): RawArticle => ({
    id,
    sourceId: 'src1',
    sourceName: 'Source',
    sourceUrl: 'http://src',
    originalUrl: `http://src/${id}`,
    originalTitle: title,
    shortDescription: desc,
    publishedAt: Date.now(),
    fetchedAt: Date.now(),
    categoryHint: category,
    language: 'tr',
    country: 'TR'
  });

  it('prevents FIFA and earthquake contamination', () => {
    const articles = [
      mockArticle('1', '2026 FIFA Dünya Kupası eleme grupları belli oldu', 'kura çekimi tamamlandı', 'Spor'),
      mockArticle('2', 'Dünya Kupası kura çekimi sonuçları açıklandı', 'rakiplerimiz belli oldu', 'Spor'),
      mockArticle('3', 'Son dakika deprem: İstanbul sallandı', 'kandilli rasathanesi', 'Gündem') // Deprem haberi
    ];
    
    const clusters = engine.clusterArticles(articles);
    
    // Should be at least 2 clusters (FIFA and Deprem)
    expect(clusters.length).toBeGreaterThanOrEqual(2);
    
    const fifaCluster = clusters.find(c => c.articles.some(a => a.originalTitle.includes('FIFA')));
    const depremCluster = clusters.find(c => c.articles.some(a => a.originalTitle.includes('deprem')));
    
    expect(fifaCluster).toBeDefined();
    expect(depremCluster).toBeDefined();
    
    // FIFA cluster shouldn't contain earthquake news
    expect(fifaCluster?.articles.some(a => a.originalTitle.includes('deprem'))).toBe(false);
  });
});
