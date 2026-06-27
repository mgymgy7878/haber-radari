import { AiReaderService, GenerateSummaryRequest } from './ai-reader-service.js';
import { AiReaderSummary, EmotionalTone, VisibilityRecommendation } from './ai-reader-summary.js';

export class MockAiReaderService implements AiReaderService {
  async generateSummary(request: GenerateSummaryRequest): Promise<AiReaderSummary> {
    const now = Date.now();
    const ttl = 24 * 60 * 60 * 1000; // 24 hours
    
    return {
      articleId: request.articleId,
      sourceUrl: request.url,
      sourceName: request.sourceName,
      shortAiSummary: 'Mock short summary for ' + request.articleId,
      detailedAiSummary: 'Mock detailed summary explaining the events and their implications for ' + request.articleId,
      whatHappened: 'A mock event occurred according to the simulated article.',
      whyItMatters: 'It serves as a placeholder test for the AI Reader Backend contract.',
      keyActors: ['System', 'Developer'],
      location: 'Mock City, Testland',
      timeline: ['Event A happened', 'Event B followed'],
      publicInterestReason: 'Testing system integrity',
      emotionalTone: EmotionalTone.NEUTRAL,
      visibilityRecommendation: VisibilityRecommendation.VISIBLE,
      confidenceScore: 0.95,
      sourceAttribution: request.sourceName,
      generatedAt: now,
      expiresAt: now + ttl
    };
  }
}
