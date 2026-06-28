import { RawArticle } from '../models/raw-article.js';
import crypto from 'crypto';

export interface Cluster {
  id: string;
  articles: RawArticle[];
  mainCategory: string;
  earliestPublishedAt: number;
}

export class ClusterEngine {
  
  public clusterArticles(articles: RawArticle[]): Cluster[] {
    const clusters: Cluster[] = [];
    
    // Sort articles so we process older ones first to form base clusters
    const sorted = [...articles].sort((a, b) => a.publishedAt - b.publishedAt);
    
    for (const article of sorted) {
      let matchedCluster: Cluster | undefined;
      
      for (const cluster of clusters) {
        if (this.isMatch(article, cluster)) {
          matchedCluster = cluster;
          break;
        }
      }
      
      if (matchedCluster) {
        matchedCluster.articles.push(article);
      } else {
        clusters.push({
          id: crypto.randomUUID(),
          articles: [article],
          mainCategory: article.categoryHint,
          earliestPublishedAt: article.publishedAt
        });
      }
    }
    
    // Sort clusters by latest article
    return clusters.sort((a, b) => {
      const aLatest = Math.max(...a.articles.map(x => x.publishedAt));
      const bLatest = Math.max(...b.articles.map(x => x.publishedAt));
      return bLatest - aLatest;
    });
  }
  
  private isMatch(article: RawArticle, cluster: Cluster): boolean {
    // 1. Time proximity (within 24 hours)
    const timeDiff = Math.abs(article.publishedAt - cluster.earliestPublishedAt);
    if (timeDiff > 24 * 60 * 60 * 1000) return false;
    
    // 2. Category mismatch (Strong Barrier)
    if (article.categoryHint !== cluster.mainCategory) {
       // If one is clearly DISASTER and other is SPORTS, don't mix.
       const categoryBarrier = ['spor', 'ekonomi', 'magazin', 'siyaset', 'dünya', 'sağlık', 'teknoloji', 'asayiş', 'afet'];
       const aCat = this.mapToBaseCategory(article.categoryHint);
       const cCat = this.mapToBaseCategory(cluster.mainCategory);
       
       if (aCat && cCat && aCat !== cCat) {
          return false;
       }
    }

    // 3. Keyword Barrier
    const strongKeywords = ['deprem', 'yangın', 'sel', 'kaza', 'cinayet', 'futbol', 'transfer', 'kupa', 'bakan', 'cumhurbaşkanı'];
    const articleStrongTokens = this.tokenize(article.originalTitle).filter(t => strongKeywords.includes(t));
    const clusterStrongTokens = cluster.articles.flatMap(a => this.tokenize(a.originalTitle)).filter(t => strongKeywords.includes(t));
    
    if (articleStrongTokens.length > 0 && clusterStrongTokens.length > 0) {
       const hasOverlap = articleStrongTokens.some(t => clusterStrongTokens.includes(t));
       if (!hasOverlap) {
          return false; // Mutually exclusive strong topics
       }
    }
    
    // 4. Token overlap similarity
    const titleTokens = this.tokenize(article.originalTitle);
    
    for (const existingArticle of cluster.articles) {
      const existingTokens = this.tokenize(existingArticle.originalTitle);
      const overlap = titleTokens.filter(t => existingTokens.includes(t)).length;
      
      // Require at least 3 significant tokens to match, or 50% overlap for short titles
      const requiredOverlap = Math.min(3, Math.ceil(Math.min(titleTokens.length, existingTokens.length) * 0.5));
      
      if (overlap >= requiredOverlap && overlap > 1) {
        return true;
      }
    }
    
    return false;
  }
  
  private mapToBaseCategory(category: string): string | null {
     const lower = category.toLowerCase();
     if (lower.includes('spor') || lower.includes('futbol')) return 'spor';
     if (lower.includes('ekonomi') || lower.includes('piyasa')) return 'ekonomi';
     if (lower.includes('magazin')) return 'magazin';
     if (lower.includes('siyaset') || lower.includes('politika')) return 'siyaset';
     if (lower.includes('dünya') || lower.includes('dış yardım')) return 'dünya';
     if (lower.includes('sağlık') || lower.includes('çevre') || lower.includes('doğa')) return 'çevre / halk sağlığı';
     if (lower.includes('teknoloji')) return 'teknoloji';
     if (lower.includes('asayiş') || lower.includes('güvenlik') || lower.includes('polis')) return 'asayiş';
     if (lower.includes('afet') || lower.includes('deprem') || lower.includes('sel') || lower.includes('yangın')) return 'afet';
     return null;
  }
  
  private tokenize(text: string): string[] {
    // Basic deterministic tokenization: lowercased, no punctuation, remove short stop words
    return text.toLowerCase()
      .replace(/[.,'"`?!:;()]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 3)
      .filter(t => !['icin', 'gibi', 'ile', 'veya', 'olan', 'gore', 'son', 'dakika', 'açıklandı', 'belli', 'oldu', 'güncel'].includes(t));
  }
}
