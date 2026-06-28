export interface RawArticle {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  originalUrl: string;
  originalTitle: string;
  shortDescription: string;
  publishedAt: number;
  fetchedAt: number;
  categoryHint: string;
  imageUrl?: string;
  language: string;
  country: string;
}
