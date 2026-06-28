import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { smartFeedRoute, resetSmartFeedCacheForTests } from './smart-feed.js';

vi.mock('../services/rss-ingest.js', () => {
  return {
    RssIngestService: class {
      async fetchAll() {
        return {
          stats: { rawArticleCount: 20, sourceCount: 1, successfulSourceCount: 1, failedSourceCount: 0 },
          sourceStatuses: [],
          articles: Array.from({ length: 20 }).map((_, i) => ({
            id: `id-${i}`,
            sourceId: 'aa_guncel',
            sourceName: 'Mock',
            originalTitle: i === 0 ? 'Deprem uyarısı geldi' : `UniqueWordA${i} UniqueWordB${i} UniqueWordC${i} UniqueWordD${i}`,
            shortDescription: 'desc',
            categoryHint: 'Gündem',
            publishedAt: Date.now() - i * 1000,
            originalUrl: `http://example.com/${i}`,
          })),
        };
      }
    },
  };
});

import { PublishDecision, ContentType } from '../engine/publish-gate.js';
vi.mock('../engine/publish-gate.js', () => {
  return {
    PublishDecision: {
      PUBLISH_MAIN: 'PUBLISH_MAIN',
      WATCHLIST_ONLY: 'WATCHLIST_ONLY',
      RAW_ONLY: 'RAW_ONLY',
      FILTERED_OUT: 'FILTERED_OUT',
    },
    ContentType: { GENERAL: 'GENERAL' },
    PublishGate: class {
      evaluate(cluster: any) {
        if (cluster.articles[0].originalTitle.includes('Deprem')) {
          return {
            decision: 'PUBLISH_MAIN',
            reason: 'Critical',
            contentType: 'DISASTER_ALERT',
            importance: 'HIGH',
            evidenceStatus: 'CONFIRMED',
            topicQuality: 'CRITICAL',
          };
        } else if (cluster.articles[0].originalTitle.includes('15') || cluster.articles[0].originalTitle.includes('16')) {
          return { decision: 'FILTERED_OUT', reason: 'Filtered' };
        } else if (cluster.articles[0].originalTitle.includes('18')) {
          return { decision: 'RAW_ONLY', reason: 'Raw' };
        } else {
          return { decision: 'WATCHLIST_ONLY', reason: 'Watchlist' };
        }
      }
    },
  };
});

describe('Smart Feed Route', () => {
  let cacheDir: string;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    resetSmartFeedCacheForTests();
    cacheDir = path.join(os.tmpdir(), `smart-feed-digest-${Date.now()}-${Math.random()}`);
    await fs.mkdir(cacheDir, { recursive: true });
    process.env.LLM_DIGEST_CACHE_DIR = cacheDir;
    process.env.LLM_DIGEST_ENABLED = '0';
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    await fs.rm(cacheDir, { recursive: true, force: true }).catch(() => undefined);
  });

  it('handles includeWatchlist=1 correctly', async () => {
    const mockReply = {
      send: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };

    const mockReq1 = {
      query: { bypassCache: '1', includeWatchlist: '1' },
      log: { error: vi.fn() },
    } as any;

    await smartFeedRoute(mockReq1, mockReply as any);

    const response = mockReply.send.mock.calls[0][0];
    expect(response.watchlistPreview).toBeDefined();
    expect(response.watchlistPreview.length).toBeLessThanOrEqual(10);
    expect(response.watchlistPreview[0].smartDigest).toBeUndefined();
  });

  it('handles includeRaw=1 and includeNoise=1 correctly', async () => {
    const mockReply = {
      send: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };

    const mockReq = {
      query: { bypassCache: '1', includeRaw: '1', includeNoise: '1' },
      log: { error: vi.fn() },
    } as any;

    await smartFeedRoute(mockReq, mockReply as any);
    const response = mockReply.send.mock.calls[0][0];

    expect(response.rawPreview).toBeDefined();
    expect(response.noisePreview).toBeDefined();
    expect(response.rawPreview.every((i: any) => !i.smartDigest)).toBe(true);
  });

  it('handles includeLatest=1 correctly without smartDigest on latestRssPreview', async () => {
    const mockReply = {
      send: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };

    const mockReq = {
      query: { bypassCache: '1', includeLatest: '1' },
      log: { error: vi.fn() },
    } as any;

    await smartFeedRoute(mockReq, mockReply as any);
    const response = mockReply.send.mock.calls[0][0];

    expect(response.latestRssPreview).toBeDefined();
    expect(response.latestRssPreview.length).toBe(20);
    expect(response.latestRssPreview[0].smartDigest).toBeUndefined();
  });

  it('successful response is valid JSON with smartDigestStats', async () => {
    const mockReply = {
      send: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };

    const mockReq = {
      query: { bypassCache: '1' },
      log: { error: vi.fn() },
    } as any;

    await smartFeedRoute(mockReq, mockReply as any);
    const response = mockReply.send.mock.calls[0][0];

    expect(() => JSON.stringify(response)).not.toThrow();
    expect(response.smartDigestStats).toBeDefined();
    expect(response.code).not.toBe('INTERNAL_ERROR');
  });

  it('PUBLISH_MAIN item gets smartDigest DISABLED when LLM_DIGEST_ENABLED=0', async () => {
    process.env.LLM_DIGEST_ENABLED = '0';

    const mockReply = {
      send: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };

    const mockReq = {
      query: { bypassCache: '1' },
      log: { error: vi.fn() },
    } as any;

    await smartFeedRoute(mockReq, mockReply as any);
    const response = mockReply.send.mock.calls[0][0];

    expect(response.items.length).toBeGreaterThan(0);
    expect(response.items[0].smartDigest.status).toBe('DISABLED');
    expect(response.items[0].fullText).toBeUndefined();
    expect(response.smartDigestStats.enabled).toBe(false);
    expect(response.smartDigestStats.provider).toBe('disabled');
  });

  it('PUBLISH_MAIN item gets MOCKED digest when enabled', async () => {
    process.env.LLM_DIGEST_ENABLED = '1';
    process.env.LLM_DIGEST_PROVIDER = 'mock';

    const mockReply = {
      send: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };

    const mockReq = {
      query: { bypassCache: '1' },
      log: { error: vi.fn() },
    } as any;

    await smartFeedRoute(mockReq, mockReply as any);
    const response = mockReply.send.mock.calls[0][0];

    expect(response.items[0].smartDigest.status).toBe('MOCKED');
    expect(response.items[0].smartDigest.summary).toContain('[AI metadata özeti');
    expect(response.smartDigestStats.provider).toBe('mock');
    expect(response.smartDigestStats.generatedCount).toBeGreaterThan(0);
  });

  it('provider failure still returns HTTP 200 response with FAILED digest', async () => {
    process.env.LLM_DIGEST_ENABLED = '1';
    process.env.LLM_DIGEST_SIMULATE_FAILURE = '1';

    const mockReply = {
      send: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };

    const mockReq = {
      query: { bypassCache: '1' },
      log: { error: vi.fn() },
    } as any;

    await smartFeedRoute(mockReq, mockReply as any);
    const response = mockReply.send.mock.calls[0][0];

    expect(mockReply.status).not.toHaveBeenCalledWith(500);
    expect(response.items[0].smartDigest.status).toBe('FAILED');
    expect(response.items.length).toBeGreaterThan(0);
    expect(response.smartDigestStats.failedCount).toBeGreaterThan(0);
  });

  it('publishedCount=0 still returns stats + latestRssPreview', async () => {
    const mockReply = {
      send: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };

    const originalEvaluate = (await import('../engine/publish-gate.js')).PublishGate.prototype.evaluate;
    (await import('../engine/publish-gate.js')).PublishGate.prototype.evaluate = vi.fn().mockReturnValue({
      decision: 'WATCHLIST_ONLY',
      reason: 'Force Watchlist',
    });

    const mockReq = {
      query: { bypassCache: '1', includeLatest: '1' },
      log: { error: vi.fn() },
    } as any;

    await smartFeedRoute(mockReq, mockReply as any);
    const response = mockReply.send.mock.calls[0][0];

    expect(response.stats.publishedCount).toBe(0);
    expect(response.items.length).toBe(0);
    expect(response.latestRssPreview.length).toBeGreaterThan(0);

    (await import('../engine/publish-gate.js')).PublishGate.prototype.evaluate = originalEvaluate;
  });

  it('debugStats.sourceScoreShadow read-only shadow katmanı ekler; publish sayısı değişmez', async () => {
    const mockReply = {
      send: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };

    const mockReq = {
      query: { bypassCache: '1' },
      log: { error: vi.fn() },
    } as any;

    await smartFeedRoute(mockReq, mockReply as any);
    const response = mockReply.send.mock.calls[0][0];

    expect(response.debugStats.sourceScoreShadow).toBeDefined();
    expect(response.debugStats.sourceScoreShadow.readOnly).toBe(true);
    expect(response.debugStats.sourceScoreShadow.version).toBe('v0');
    expect(response.stats.publishedCount).toBeGreaterThan(0);
  });
});
