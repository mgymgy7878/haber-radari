import { describe, it, expect, vi } from 'vitest';
import { app } from './server.js';

// We need to mock process.exit to avoid the server stopping the test runner if it fails to start.
// Also we must wait for the fastify instance to be ready.
describe('POST /ai-reader/summary/mock', () => {
  it('should return 400 if required fields are missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/ai-reader/summary/mock',
      payload: {
        articleId: 'test-123' // missing sourceName and title
      }
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('Missing required fields: articleId, sourceName, title');
  });

  it('should return 400 if invalid sourceUrl is provided', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/ai-reader/summary/mock',
      payload: {
        articleId: 'test-123',
        sourceName: 'News',
        title: 'Title',
        sourceUrl: 'invalid-url'
      }
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('Invalid sourceUrl');
  });

  it('should return 400 if raw text is provided', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/ai-reader/summary/mock',
      payload: {
        articleId: 'test-123',
        sourceName: 'News',
        title: 'Title',
        sourceUrl: 'https://example.com/test',
        fullText: 'This is the full text'
      }
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('Raw full text is not accepted');
  });

  it('should return 200 and a mock summary for valid request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/ai-reader/summary/mock',
      payload: {
        articleId: 'test-123',
        sourceName: 'Example News',
        title: 'Test Article Title',
        sourceUrl: 'https://example.com/test'
      }
    });
    expect(response.statusCode).toBe(200);
    
    const summary = response.json();
    expect(summary.articleId).toBe('test-123');
    expect(summary.sourceName).toBe('Example News');
    expect(summary.shortAiSummary).toContain('Mock short summary');
    expect(summary.confidenceScore).toBeGreaterThanOrEqual(0);
  });
});
