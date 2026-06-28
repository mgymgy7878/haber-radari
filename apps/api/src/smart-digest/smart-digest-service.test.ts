import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  SmartDigestService,
  buildDigestInputFromClusterItem,
} from './smart-digest-service.js';
import { SmartDigestFileCache } from './file-cache.js';
import { SmartDigestBudgetGuard } from './budget-guard.js';
import { normalizeSmartDigestInput } from './normalize-input.js';
import { buildDigestCacheKey } from './cache-key.js';
import { FORBIDDEN_DIGEST_FIELDS } from './types.js';
import { getProviderLogs, resetProviderLogs } from './provider-log.js';
import { ExternalSmartDigestProvider } from './providers/external-smart-digest-provider.js';
import { MockSmartDigestProvider } from './providers/mock-smart-digest-provider.js';
import type { SmartDigestInput } from './types.js';

function sampleInput(overrides: Partial<SmartDigestInput> = {}): SmartDigestInput {
  return {
    clusterId: 'cluster-abc',
    title: 'Merkez Bankası faiz kararını açıkladı',
    shortDescription: 'TCMB politika faizini sabit tuttu.',
    category: 'Ekonomi',
    publishDecision: 'PUBLISH_MAIN',
    publishReason: 'Çok kaynaklı doğrulama',
    sourceCount: 2,
    sourceNames: ['AA', 'TRT'],
    publishedAt: Date.now() - 60_000,
    sources: [
      {
        sourceName: 'TRT',
        title: 'Merkez Bankası faiz kararını açıkladı',
        shortDescription: 'TRT özeti',
        originalUrl: 'https://example.com/trt',
        publishedAt: Date.now() - 60_000,
      },
      {
        sourceName: 'AA',
        title: 'Merkez Bankası faiz kararını açıkladı',
        shortDescription: 'AA özeti',
        originalUrl: 'https://example.com/aa',
        publishedAt: Date.now() - 120_000,
      },
    ],
    importance: 'HIGH',
    evidenceStatus: 'CONFIRMED',
    contentType: 'ECONOMY_DATA',
    ...overrides,
  };
}

function mockExternalFetch() {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: '[external] Metadata özeti',
              keyPoints: ['Nokta 1', 'Nokta 2'],
              whyItMatters: 'Ekonomi gündeminde önemli',
              confidence: 'HIGH',
            }),
          },
        },
      ],
    }),
  }) as unknown as typeof fetch;
}

describe('SmartDigestService v0.6.1', () => {
  let cacheDir: string;
  let budgetDir: string;

  beforeEach(async () => {
    cacheDir = path.join(os.tmpdir(), `sd-cache-${Date.now()}-${Math.random()}`);
    budgetDir = path.join(os.tmpdir(), `sd-budget-${Date.now()}-${Math.random()}`);
    await fs.mkdir(cacheDir, { recursive: true });
    await fs.mkdir(budgetDir, { recursive: true });
    resetProviderLogs();
  });

  afterEach(async () => {
    await fs.rm(cacheDir, { recursive: true, force: true }).catch(() => undefined);
    await fs.rm(budgetDir, { recursive: true, force: true }).catch(() => undefined);
  });

  it('1. external disabled → DISABLED, no external call', async () => {
    const fetchFn = mockExternalFetch();
    const service = new SmartDigestService(
      { enabled: false, cacheDir, budgetDir },
      undefined,
      { externalProvider: new ExternalSmartDigestProvider({ enabled: false, cacheDir, budgetDir, apiKey: 'secret-key-123' } as any, fetchFn) }
    );
    service.beginBatch();
    const digest = await service.getDigest(sampleInput());

    expect(digest.status).toBe('DISABLED');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('2. mock provider → deterministic result', async () => {
    const service = new SmartDigestService({ enabled: true, provider: 'mock', cacheDir, budgetDir });
    service.beginBatch();
    const input = sampleInput();
    const first = await service.getDigest(input);
    const second = await service.getDigest(input);

    expect(first.status).toBe('MOCKED');
    expect(second.status).toBe('CACHED');
    expect(first.summary).toBe(second.summary);
  });

  it('3. external provider env kapalı → external call yok', async () => {
    const fetchFn = mockExternalFetch();
    const external = new ExternalSmartDigestProvider(
      {
        enabled: true,
        provider: 'external',
        externalEnabled: false,
        cacheDir,
        budgetDir,
        apiKey: 'test-key',
        apiUrl: 'https://example.com/v1/chat',
        model: 'test',
        timeoutMs: 5000,
        requireCache: true,
        dailyLimit: 20,
        perRequestLimit: 3,
        promptVersion: 'v0.6.1',
        digestVersion: 'v0.6.1',
        simulateProviderFailure: false,
        cacheTtlMs: 60_000,
      },
      fetchFn
    );
    const service = new SmartDigestService(
      { enabled: true, provider: 'external', externalEnabled: false, cacheDir, budgetDir },
      undefined,
      { externalProvider: external }
    );
    service.beginBatch();
    const digest = await service.getDigest(sampleInput());

    expect(digest.status).toBe('FAILED');
    expect(digest.errorCode).toBe('EXTERNAL_DISABLED');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('4. external enabled + cache miss → provider çağrılır', async () => {
    const fetchFn = mockExternalFetch();
    const external = new ExternalSmartDigestProvider(
      {
        enabled: true,
        provider: 'external',
        externalEnabled: true,
        cacheDir,
        budgetDir,
        apiKey: 'test-key-abc',
        apiUrl: 'https://example.com/v1/chat',
        model: 'test-model',
        timeoutMs: 5000,
        requireCache: true,
        dailyLimit: 20,
        perRequestLimit: 3,
        promptVersion: 'v0.6.1',
        digestVersion: 'v0.6.1',
        simulateProviderFailure: false,
        cacheTtlMs: 60_000,
      },
      fetchFn
    );
    const service = new SmartDigestService(
      { enabled: true, provider: 'external', externalEnabled: true, cacheDir, budgetDir },
      undefined,
      { externalProvider: external, budgetGuard: new SmartDigestBudgetGuard(budgetDir, 20) }
    );
    service.beginBatch();
    const digest = await service.getDigest(sampleInput());

    expect(digest.status).toBe('GENERATED');
    expect(digest.modelProvider).toBe('external');
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(service.getFeedStats().externalCallCount).toBe(1);
  });

  it('5. same input second run → cache hit, provider çağrılmaz', async () => {
    const fetchFn = mockExternalFetch();
    const external = new ExternalSmartDigestProvider(
      {
        enabled: true,
        provider: 'external',
        externalEnabled: true,
        cacheDir,
        budgetDir,
        apiKey: 'test-key',
        apiUrl: 'https://example.com/v1/chat',
        model: 'test',
        timeoutMs: 5000,
        requireCache: true,
        dailyLimit: 20,
        perRequestLimit: 3,
        promptVersion: 'v0.6.1',
        digestVersion: 'v0.6.1',
        simulateProviderFailure: false,
        cacheTtlMs: 60_000,
      },
      fetchFn
    );
    const service = new SmartDigestService(
      { enabled: true, provider: 'external', externalEnabled: true, cacheDir, budgetDir },
      undefined,
      { externalProvider: external, budgetGuard: new SmartDigestBudgetGuard(budgetDir, 20) }
    );
    service.beginBatch();
    const input = sampleInput();
    await service.getDigest(input);
    const second = await service.getDigest(input);

    expect(second.status).toBe('CACHED');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('6. daily budget exceeded → BUDGET_EXCEEDED', async () => {
    const fetchFn = mockExternalFetch();
    const budgetGuard = new SmartDigestBudgetGuard(budgetDir, 1);
    await budgetGuard.recordExternalCall();

    const external = new ExternalSmartDigestProvider(
      {
        enabled: true,
        provider: 'external',
        externalEnabled: true,
        cacheDir,
        budgetDir,
        apiKey: 'key',
        apiUrl: 'https://example.com/v1/chat',
        model: 'm',
        timeoutMs: 5000,
        requireCache: true,
        dailyLimit: 1,
        perRequestLimit: 3,
        promptVersion: 'v0.6.1',
        digestVersion: 'v0.6.1',
        simulateProviderFailure: false,
        cacheTtlMs: 60_000,
      },
      fetchFn
    );
    const service = new SmartDigestService(
      { enabled: true, provider: 'external', externalEnabled: true, cacheDir, budgetDir, dailyLimit: 1 },
      undefined,
      { externalProvider: external, budgetGuard }
    );
    service.beginBatch();
    const digest = await service.getDigest(sampleInput());

    expect(digest.status).toBe('FAILED');
    expect(digest.errorCode).toBe('BUDGET_EXCEEDED');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('7. per-request limit exceeded → yalnızca limit kadar external call', async () => {
    const fetchFn = mockExternalFetch();
    const external = new ExternalSmartDigestProvider(
      {
        enabled: true,
        provider: 'external',
        externalEnabled: true,
        cacheDir,
        budgetDir,
        apiKey: 'key',
        apiUrl: 'https://example.com/v1/chat',
        model: 'm',
        timeoutMs: 5000,
        requireCache: true,
        dailyLimit: 20,
        perRequestLimit: 1,
        promptVersion: 'v0.6.1',
        digestVersion: 'v0.6.1',
        simulateProviderFailure: false,
        cacheTtlMs: 60_000,
      },
      fetchFn
    );
    const service = new SmartDigestService(
      {
        enabled: true,
        provider: 'external',
        externalEnabled: true,
        cacheDir,
        budgetDir,
        perRequestLimit: 1,
      },
      undefined,
      { externalProvider: external, budgetGuard: new SmartDigestBudgetGuard(budgetDir, 20) }
    );
    service.beginBatch();

    const inputA = sampleInput({ clusterId: 'a' });
    const inputB = sampleInput({ clusterId: 'b', title: 'İkinci haber başlığı farklı' });

    const first = await service.getDigest(inputA);
    const second = await service.getDigest(inputB);

    expect(first.status).toBe('GENERATED');
    expect(second.errorCode).toBe('PER_REQUEST_LIMIT');
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(service.getFeedStats().externalCallCount).toBe(1);
    expect(service.getFeedStats().budgetDeniedCount).toBe(1);
  });

  it('8. provider timeout/failure → FAILED, endpoint logic continues', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('timeout')) as unknown as typeof fetch;
    const external = new ExternalSmartDigestProvider(
      {
        enabled: true,
        provider: 'external',
        externalEnabled: true,
        cacheDir,
        budgetDir,
        apiKey: 'key',
        apiUrl: 'https://example.com/v1/chat',
        model: 'm',
        timeoutMs: 100,
        requireCache: true,
        dailyLimit: 20,
        perRequestLimit: 3,
        promptVersion: 'v0.6.1',
        digestVersion: 'v0.6.1',
        simulateProviderFailure: false,
        cacheTtlMs: 60_000,
      },
      fetchFn
    );
    const service = new SmartDigestService(
      { enabled: true, provider: 'external', externalEnabled: true, cacheDir, budgetDir },
      undefined,
      { externalProvider: external, budgetGuard: new SmartDigestBudgetGuard(budgetDir, 20) }
    );
    service.beginBatch();
    const digest = await service.getDigest(sampleInput());

    expect(digest.status).toBe('FAILED');
    expect(digest.errorCode).toBe('DIGEST_PROVIDER_FAILED');
  });

  it('9. forbidden full-text field → input reject', () => {
    const polluted = { ...sampleInput(), scrapedText: 'full scraped' } as SmartDigestInput & {
      scrapedText: string;
    };
    expect(() => normalizeSmartDigestInput(polluted)).toThrow(/Forbidden digest field/);
    expect(FORBIDDEN_DIGEST_FIELDS).toContain('scrapedText');
    expect(FORBIDDEN_DIGEST_FIELDS).toContain('rawHtml');
  });

  it('10. API key loglanmaz — log hygiene', async () => {
    const secret = 'super-secret-api-key-xyz';
    const fetchFn = vi.fn().mockRejectedValue(new Error(`Bearer ${secret} invalid`));
    const external = new ExternalSmartDigestProvider(
      {
        enabled: true,
        provider: 'external',
        externalEnabled: true,
        cacheDir,
        budgetDir,
        apiKey: secret,
        apiUrl: 'https://example.com/v1/chat',
        model: 'm',
        timeoutMs: 5000,
        requireCache: true,
        dailyLimit: 20,
        perRequestLimit: 3,
        promptVersion: 'v0.6.1',
        digestVersion: 'v0.6.1',
        simulateProviderFailure: false,
        cacheTtlMs: 60_000,
      },
      fetchFn as unknown as typeof fetch
    );
    const service = new SmartDigestService(
      { enabled: true, provider: 'external', externalEnabled: true, cacheDir, budgetDir },
      undefined,
      { externalProvider: external, budgetGuard: new SmartDigestBudgetGuard(budgetDir, 20) }
    );
    service.beginBatch();
    await service.getDigest(sampleInput());

    const logs = JSON.stringify(getProviderLogs());
    expect(logs).not.toContain(secret);
    expect(logs).not.toContain('Bearer');
  });

  it('same input → same cacheKey; promptVersion change → different key', () => {
    const input = normalizeSmartDigestInput(sampleInput());
    const a = buildDigestCacheKey(input, 'v0.6.1', 'v0.6.1');
    const b = buildDigestCacheKey(input, 'v0.6.2', 'v0.6.1');
    expect(a).toBe(buildDigestCacheKey(input, 'v0.6.1', 'v0.6.1'));
    expect(a).not.toBe(b);
  });

  it('buildDigestInputFromClusterItem metadata-only', () => {
    const input = buildDigestInputFromClusterItem({
      clusterId: 'c1',
      title: 'Test',
      shortDescription: 'Kısa',
      category: 'Genel',
      publishDecision: 'PUBLISH_MAIN',
      publishReason: null,
      sourceCount: 1,
      sources: [
        {
          sourceName: 'AA',
          originalTitle: 'Test',
          url: 'https://example.com',
          publishedAt: Date.now(),
        },
      ],
    });
    expect((input as any).fullText).toBeUndefined();
    expect((input as any).body).toBeUndefined();
  });

  it('file cache roundtrip', async () => {
    const cache = new SmartDigestFileCache(cacheDir, 60_000);
    await cache.set('abc', {
      summary: 'test',
      keyPoints: ['a'],
      whyItMatters: 'why',
      confidence: 'LOW',
      sourcePolicy: 'METADATA_ONLY',
      modelProvider: 'mock',
      generatedAt: new Date().toISOString(),
    });
    expect((await cache.get('abc'))?.digest.summary).toBe('test');
  });
});
