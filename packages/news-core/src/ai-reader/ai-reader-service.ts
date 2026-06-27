import { AiReaderSummary } from './ai-reader-summary.js';

export interface GenerateSummaryRequest {
  articleId: string;
  url: string;
  sourceName: string;
}

export interface AiReaderService {
  /**
   * Generates an AI summary for the given article request.
   * This service interface should NOT expose the full text or raw HTML to callers.
   */
  generateSummary(request: GenerateSummaryRequest): Promise<AiReaderSummary>;
}
