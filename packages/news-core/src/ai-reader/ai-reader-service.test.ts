import { describe, it, expect } from 'vitest';
import { MockAiReaderService } from './mock-ai-reader-service';

describe('AiReaderService Contract', () => {
  it('should return a valid summary matching the AiReaderSummary contract', async () => {
    const service = new MockAiReaderService();
    const summary = await service.generateSummary({
      articleId: 'test-article-123',
      url: 'https://example.com/test-article',
      sourceName: 'Example News'
    });

    // Check mandatory fields
    expect(summary.articleId).toBe('test-article-123');
    expect(summary.sourceUrl).toBe('https://example.com/test-article');
    expect(summary.sourceName).toBe('Example News');
    expect(summary.sourceAttribution).toBe('Example News');

    // Check confidence score is within 0-1 bounds
    expect(summary.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(summary.confidenceScore).toBeLessThanOrEqual(1.0);

    // Check TTL logic
    expect(summary.expiresAt).toBeGreaterThan(summary.generatedAt);

    // Verify raw fullText or HTML fields are NOT present
    expect((summary as any).fullText).toBeUndefined();
    expect((summary as any).articleBody).toBeUndefined();
    expect((summary as any).contentHtml).toBeUndefined();
  });
});
