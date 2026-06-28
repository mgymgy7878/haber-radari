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
              summary: 'Bu metadata tabanlı özet — external pilot',
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

function externalServiceConfig(
  cacheDir: string,
  budgetDir: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    enabled: true,
    provider: 'external' as const,
    externalEnabled: true,
    requireOperatorApproval: true,
    operatorApproved: true,
    apiKey: 'test-key-abc',
    cacheDir,
    budgetDir,
    ...overrides,
  };
}

function externalProviderConfig(
  cacheDir: string,
  budgetDir: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    enabled: true,
    provider: 'external' as const,
    externalEnabled: true,
    requireOperatorApproval: true,
    operatorApproved: true,
    cacheDir,
    budgetDir,
    apiKey: 'test-key-abc',
    apiUrl: 'https://example.com/v1/chat',
    model: 'test-model',
    timeoutMs: 5000,
    requireCache: true,
    dailyLimit: 20,
    perRequestLimit: 3,
    promptVersion: 'v0.6.3',
    digestVersion: 'v0.6.3',
    simulateProviderFailure: false,
    cacheTtlMs: 60_000,
    logPrompts: false,
    logResponses: false,
    ...overrides,
  };
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
      externalProviderConfig(cacheDir, budgetDir, { externalEnabled: false }) as any,
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
      externalProviderConfig(cacheDir, budgetDir) as any,
      fetchFn
    );
    const service = new SmartDigestService(
      externalServiceConfig(cacheDir, budgetDir),
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
      externalProviderConfig(cacheDir, budgetDir, { apiKey: 'test-key' }) as any,
      fetchFn
    );
    const service = new SmartDigestService(
      externalServiceConfig(cacheDir, budgetDir, { apiKey: 'test-key' }),
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
      externalProviderConfig(cacheDir, budgetDir, { apiKey: 'key', dailyLimit: 1, model: 'm' }) as any,
      fetchFn
    );
    const service = new SmartDigestService(
      externalServiceConfig(cacheDir, budgetDir, { apiKey: 'key', dailyLimit: 1 }),
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
      externalProviderConfig(cacheDir, budgetDir, {
        apiKey: 'key',
        model: 'm',
        perRequestLimit: 1,
      }) as any,
      fetchFn
    );
    const service = new SmartDigestService(
      externalServiceConfig(cacheDir, budgetDir, { apiKey: 'key', perRequestLimit: 1 }),
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
      externalProviderConfig(cacheDir, budgetDir, {
        apiKey: 'key',
        model: 'm',
        timeoutMs: 100,
      }) as any,
      fetchFn
    );
    const service = new SmartDigestService(
      externalServiceConfig(cacheDir, budgetDir, { apiKey: 'key' }),
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
      externalProviderConfig(cacheDir, budgetDir, { apiKey: secret, model: 'm' }) as any,
      fetchFn as unknown as typeof fetch
    );
    const service = new SmartDigestService(
      externalServiceConfig(cacheDir, budgetDir, { apiKey: secret }),
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

describe('SmartDigestService v0.6.3 controlled pilot', () => {
  let cacheDir: string;
  let budgetDir: string;

  beforeEach(async () => {
    cacheDir = path.join(os.tmpdir(), `sd-v063-${Date.now()}-${Math.random()}`);
    budgetDir = path.join(os.tmpdir(), `sd-budget-v063-${Date.now()}-${Math.random()}`);
    await fs.mkdir(cacheDir, { recursive: true });
    await fs.mkdir(budgetDir, { recursive: true });
    resetProviderLogs();
  });

  afterEach(async () => {
    await fs.rm(cacheDir, { recursive: true, force: true }).catch(() => undefined);
    await fs.rm(budgetDir, { recursive: true, force: true }).catch(() => undefined);
  });

  it('1. external enabled, operator approval yok → OPERATOR_APPROVAL_REQUIRED', async () => {
    const fetchFn = mockExternalFetch();
    const service = new SmartDigestService(
      {
        enabled: true,
        provider: 'external',
        externalEnabled: true,
        requireOperatorApproval: true,
        operatorApproved: false,
        cacheDir,
        budgetDir,
        apiKey: 'test-key',
      },
      undefined,
      {
        externalProvider: new ExternalSmartDigestProvider(
          externalProviderConfig(cacheDir, budgetDir) as any,
          fetchFn
        ),
        budgetGuard: new SmartDigestBudgetGuard(budgetDir, 5),
      }
    );
    service.beginBatch();
    const digest = await service.getDigest(sampleInput());

    expect(digest.status).toBe('FAILED');
    expect(digest.errorCode).toBe('OPERATOR_APPROVAL_REQUIRED');
    expect(fetchFn).not.toHaveBeenCalled();
    expect(service.getFeedStats().approvalDeniedCount).toBe(1);
    const budget = await new SmartDigestBudgetGuard(budgetDir, 5).getTodayStats();
    expect(budget.approvalDenied).toBe(1);
    expect(budget.lastUpdatedAt).toBeTruthy();
  });

  it('2. operator approval var, API key yok → PROVIDER_CONFIG_MISSING', async () => {
    const fetchFn = mockExternalFetch();
    const service = new SmartDigestService(
      {
        enabled: true,
        provider: 'external',
        externalEnabled: true,
        operatorApproved: true,
        apiKey: '',
        cacheDir,
        budgetDir,
      },
      undefined,
      {
        externalProvider: new ExternalSmartDigestProvider(
          externalProviderConfig(cacheDir, budgetDir, { apiKey: '' }) as any,
          fetchFn
        ),
        budgetGuard: new SmartDigestBudgetGuard(budgetDir, 5),
      }
    );
    service.beginBatch();
    const digest = await service.getDigest(sampleInput());

    expect(digest.status).toBe('FAILED');
    expect(digest.errorCode).toBe('PROVIDER_CONFIG_MISSING');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('3. approval + key + cache miss + budget → injectable fake external', async () => {
    const fetchFn = mockExternalFetch();
    const service = new SmartDigestService(
      externalServiceConfig(cacheDir, budgetDir),
      undefined,
      {
        externalProvider: new ExternalSmartDigestProvider(
          externalProviderConfig(cacheDir, budgetDir) as any,
          fetchFn
        ),
        budgetGuard: new SmartDigestBudgetGuard(budgetDir, 5),
      }
    );
    service.beginBatch();
    const digest = await service.getDigest(sampleInput());

    expect(digest.status).toBe('GENERATED');
    expect(digest.modelProvider).toBe('external');
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(service.getFeedStats().externalCallCount).toBe(1);
  });

  it('4. same input second run → CACHED, external çağrı yok', async () => {
    const fetchFn = mockExternalFetch();
    const service = new SmartDigestService(
      externalServiceConfig(cacheDir, budgetDir),
      undefined,
      {
        externalProvider: new ExternalSmartDigestProvider(
          externalProviderConfig(cacheDir, budgetDir) as any,
          fetchFn
        ),
        budgetGuard: new SmartDigestBudgetGuard(budgetDir, 5),
      }
    );
    service.beginBatch();
    const input = sampleInput();
    await service.getDigest(input);
    const second = await service.getDigest(input);

    expect(second.status).toBe('CACHED');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('5. daily limit exceeded → BUDGET_EXCEEDED', async () => {
    const fetchFn = mockExternalFetch();
    const budgetGuard = new SmartDigestBudgetGuard(budgetDir, 5);
    for (let i = 0; i < 5; i += 1) {
      await budgetGuard.recordExternalCall();
    }
    const service = new SmartDigestService(
      externalServiceConfig(cacheDir, budgetDir, { apiKey: 'key', dailyLimit: 5 }),
      undefined,
      {
        externalProvider: new ExternalSmartDigestProvider(
          externalProviderConfig(cacheDir, budgetDir) as any,
          fetchFn
        ),
        budgetGuard,
      }
    );
    service.beginBatch();
    const digest = await service.getDigest(sampleInput());

    expect(digest.errorCode).toBe('BUDGET_EXCEEDED');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('6. per-request limit → yalnızca 1 external call', async () => {
    const fetchFn = mockExternalFetch();
    const service = new SmartDigestService(
      externalServiceConfig(cacheDir, budgetDir, { perRequestLimit: 1 }),
      undefined,
      {
        externalProvider: new ExternalSmartDigestProvider(
          externalProviderConfig(cacheDir, budgetDir, { perRequestLimit: 1 }) as any,
          fetchFn
        ),
        budgetGuard: new SmartDigestBudgetGuard(budgetDir, 5),
      }
    );
    service.beginBatch();
    await service.getDigest(sampleInput({ clusterId: 'a' }));
    await service.getDigest(sampleInput({ clusterId: 'b', title: 'Farklı başlık' }));

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(service.getFeedStats().externalCallCount).toBe(1);
  });

  it('7. forbidden full text field → reject', () => {
    const polluted = { ...sampleInput(), fullText: 'tam metin' } as SmartDigestInput & {
      fullText: string;
    };
    expect(() => normalizeSmartDigestInput(polluted)).toThrow(/Forbidden digest field/);
  });

  it('9. provider timeout → FAILED, servis devam eder', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('timeout')) as unknown as typeof fetch;
    const service = new SmartDigestService(
      externalServiceConfig(cacheDir, budgetDir, { apiKey: 'key' }),
      undefined,
      {
        externalProvider: new ExternalSmartDigestProvider(
          externalProviderConfig(cacheDir, budgetDir) as any,
          fetchFn
        ),
        budgetGuard: new SmartDigestBudgetGuard(budgetDir, 5),
      }
    );
    service.beginBatch();
    const digest = await service.getDigest(sampleInput());

    expect(digest.status).toBe('FAILED');
    expect(digest.errorCode).toBe('DIGEST_PROVIDER_FAILED');
  });

  it('10. API key redaction — loglarda secret yok', async () => {
    const secret = 'pilot-secret-key-v063';
    const fetchFn = vi.fn().mockRejectedValue(new Error(`Bearer ${secret} invalid`));
    const service = new SmartDigestService(
      externalServiceConfig(cacheDir, budgetDir, { apiKey: secret }),
      undefined,
      {
        externalProvider: new ExternalSmartDigestProvider(
          externalProviderConfig(cacheDir, budgetDir, { apiKey: secret }) as any,
          fetchFn as unknown as typeof fetch
        ),
        budgetGuard: new SmartDigestBudgetGuard(budgetDir, 5),
      }
    );
    service.beginBatch();
    await service.getDigest(sampleInput());

    const logs = JSON.stringify(getProviderLogs());
    expect(logs).not.toContain(secret);
    expect(logs).not.toContain('Bearer');
  });

  it('11. prompt/response logging kapalı — ham içerik loglanmaz', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    const fetchFn = mockExternalFetch();
    const service = new SmartDigestService(
      externalServiceConfig(cacheDir, budgetDir, { logPrompts: false, logResponses: false }),
      undefined,
      {
        externalProvider: new ExternalSmartDigestProvider(
          externalProviderConfig(cacheDir, budgetDir, {
            logPrompts: false,
            logResponses: false,
          }) as any,
          fetchFn
        ),
        budgetGuard: new SmartDigestBudgetGuard(budgetDir, 5),
      }
    );
    service.beginBatch();
    await service.getDigest(sampleInput());

    expect(debugSpy).not.toHaveBeenCalled();
    const logs = JSON.stringify(getProviderLogs());
    expect(logs).not.toContain('Merkez Bankası');
    debugSpy.mockRestore();
  });

  it('12. smartDigestStats externalCallCount doğru', async () => {
    const fetchFn = mockExternalFetch();
    const service = new SmartDigestService(
      externalServiceConfig(cacheDir, budgetDir),
      undefined,
      {
        externalProvider: new ExternalSmartDigestProvider(
          externalProviderConfig(cacheDir, budgetDir) as any,
          fetchFn
        ),
        budgetGuard: new SmartDigestBudgetGuard(budgetDir, 5),
      }
    );
    service.beginBatch();
    const input = sampleInput();
    await service.getDigest(input);
    await service.getDigest(input);

    expect(service.getFeedStats().externalCallCount).toBe(1);
    expect(service.getFeedStats().cachedCount).toBe(1);
  });

  it('uniqueSourceCount < 2 ve düşük önem → NOT_ELIGIBLE', async () => {
    const fetchFn = mockExternalFetch();
    const service = new SmartDigestService(
      {
        enabled: true,
        provider: 'external',
        externalEnabled: true,
        operatorApproved: true,
        cacheDir,
        budgetDir,
      },
      undefined,
      {
        externalProvider: new ExternalSmartDigestProvider(
          externalProviderConfig(cacheDir, budgetDir) as any,
          fetchFn
        ),
        budgetGuard: new SmartDigestBudgetGuard(budgetDir, 5),
      }
    );
    service.beginBatch();
    const digest = await service.getDigest(
      sampleInput({
        uniqueSourceCount: 1,
        sourceCount: 1,
        importance: 'LOW',
      })
    );

    expect(digest.errorCode).toBe('NOT_ELIGIBLE_FOR_EXTERNAL');
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
