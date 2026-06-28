/**
 * v0.6.1 evidence JSON üretici — vitest dışında tek seferlik çalıştırılır.
 * Usage: npx tsx scripts/generate-smart-digest-evidence.ts
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SmartDigestService,
  buildDigestInputFromClusterItem,
} from '../src/smart-digest/smart-digest-service.js';
import { ExternalSmartDigestProvider } from '../src/smart-digest/providers/external-smart-digest-provider.js';
import { SmartDigestBudgetGuard } from '../src/smart-digest/budget-guard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const evidenceDir = path.resolve(__dirname, '../../../evidence');
const cacheBase = path.resolve(__dirname, '../.cache');
const budgetDir = path.resolve(cacheBase, 'smart-digest-budget-evidence-v061');

function mockFetch() {
  let calls = 0;
  const fn = (async () => {
    calls += 1;
    return {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: '[external evidence] Metadata özeti',
                keyPoints: ['Nokta 1', 'Nokta 2'],
                whyItMatters: 'Ekonomi gündeminde önemli',
                confidence: 'HIGH',
              }),
            },
          },
        ],
      }),
    };
  }) as unknown as typeof fetch & { callCount: () => number };
  fn.callCount = () => calls;
  return fn;
}

function failingFetch() {
  return (async () => {
    throw new Error('SIMULATED_PROVIDER_FAILURE');
  }) as unknown as typeof fetch;
}

function baseInput() {
  return buildDigestInputFromClusterItem({
    clusterId: 'evidence-cluster-v061',
    title: 'Merkez Bankası faiz kararını açıkladı',
    shortDescription: 'TCMB politika faizini sabit tuttu.',
    category: 'Ekonomi',
    publishDecision: 'PUBLISH_MAIN',
    publishReason: 'Çok kaynaklı doğrulama',
    sourceCount: 2,
    importance: 'HIGH',
    sources: [
      {
        sourceName: 'AA',
        originalTitle: 'Merkez Bankası faiz kararını açıkladı',
        shortDescription: 'AA kısa açıklama',
        url: 'https://example.com/aa',
        publishedAt: Date.now(),
      },
      {
        sourceName: 'TRT',
        originalTitle: 'Merkez Bankası faiz kararını açıkladı',
        shortDescription: 'TRT kısa açıklama',
        url: 'https://example.com/trt',
        publishedAt: Date.now() - 1000,
      },
    ],
  });
}

function externalConfig(cacheDir: string, overrides: Record<string, unknown> = {}) {
  return {
    enabled: true,
    provider: 'external' as const,
    externalEnabled: true,
    cacheDir,
    budgetDir,
    apiKey: 'evidence-test-key-not-real',
    apiUrl: 'https://example.com/v1/chat',
    model: 'test-model',
    timeoutMs: 8000,
    requireCache: true,
    dailyLimit: 20,
    perRequestLimit: 3,
    promptVersion: 'v0.6.1',
    digestVersion: 'v0.6.1',
    simulateProviderFailure: false,
    cacheTtlMs: 86_400_000,
    ...overrides,
  };
}

async function main() {
  await fs.mkdir(evidenceDir, { recursive: true });
  await fs.rm(cacheBase, { recursive: true, force: true }).catch(() => undefined);
  await fs.mkdir(budgetDir, { recursive: true });

  const cacheDisabled = path.join(cacheBase, 'disabled');
  const cacheMock = path.join(cacheBase, 'mock');
  const cacheExternal = path.join(cacheBase, 'external-fresh');
  const cacheBudget = path.join(cacheBase, 'budget');
  const cacheFail = path.join(cacheBase, 'failure');
  for (const dir of [cacheDisabled, cacheMock, cacheExternal, cacheBudget, cacheFail]) {
    await fs.mkdir(dir, { recursive: true });
  }

  const input = baseInput();

  const disabledService = new SmartDigestService({ enabled: false, cacheDir: cacheDisabled, budgetDir });
  disabledService.beginBatch();
  const disabledDigest = await disabledService.getDigest(input);

  await fs.writeFile(
    path.join(evidenceDir, 'v0.6.1-external-disabled.json'),
    JSON.stringify(
      {
        contractVersion: 'v0.6.1',
        llmDigestEnabled: false,
        llmDigestExternalEnabled: false,
        realExternalCallMade: false,
        smartDigest: disabledDigest,
        feedStats: disabledService.getFeedStats(),
      },
      null,
      2
    )
  );

  const mockService = new SmartDigestService({ enabled: true, provider: 'mock', cacheDir: cacheMock, budgetDir });
  mockService.beginBatch();
  const mockDigest = await mockService.getDigest(input);

  await fs.writeFile(
    path.join(evidenceDir, 'v0.6.1-external-mock.json'),
    JSON.stringify(
      {
        contractVersion: 'v0.6.1',
        llmDigestEnabled: true,
        provider: 'mock',
        realExternalCallMade: false,
        inputPolicy: 'METADATA_ONLY',
        smartDigest: mockDigest,
        feedStats: mockService.getFeedStats(),
      },
      null,
      2
    )
  );

  const fetchFn = mockFetch();
  const external = new ExternalSmartDigestProvider(externalConfig(cacheExternal), fetchFn);
  const budgetGuard = new SmartDigestBudgetGuard(budgetDir, 20);
  await budgetGuard.resetToday();

  const externalService = new SmartDigestService(
    externalConfig(cacheExternal),
    undefined,
    { externalProvider: external, budgetGuard }
  );
  externalService.beginBatch();
  const externalInput = baseInput();
  const firstExternal = await externalService.getDigest(externalInput);
  const secondExternal = await externalService.getDigest(externalInput);
  const fetchCallCount = (fetchFn as ReturnType<typeof mockFetch>).callCount();

  await fs.writeFile(
    path.join(evidenceDir, 'v0.6.1-external-cache-hit.json'),
    JSON.stringify(
      {
        contractVersion: 'v0.6.1',
        firstRunStatus: firstExternal.status,
        secondRunStatus: secondExternal.status,
        cacheKey: firstExternal.cacheKey,
        cacheKeyMatch: firstExternal.cacheKey === secondExternal.cacheKey,
        fetchCallCount,
        realExternalCallMade: fetchCallCount > 0,
        note: 'fetch simulated via injectable adapter — no production API key used',
        feedStats: externalService.getFeedStats(),
      },
      null,
      2
    )
  );

  const budgetGuardDenied = new SmartDigestBudgetGuard(budgetDir, 0);
  await budgetGuardDenied.resetToday();
  await budgetGuardDenied.recordExternalCall();
  const deniedFetch = mockFetch();
  const deniedExternal = new ExternalSmartDigestProvider(externalConfig(cacheBudget, { dailyLimit: 0 }), deniedFetch);
  const deniedService = new SmartDigestService(
    externalConfig(cacheBudget, { dailyLimit: 0 }),
    undefined,
    { externalProvider: deniedExternal, budgetGuard: budgetGuardDenied }
  );
  deniedService.beginBatch();
  const deniedDigest = await deniedService.getDigest({
    ...input,
    clusterId: 'budget-denied-cluster',
  });

  await fs.writeFile(
    path.join(evidenceDir, 'v0.6.1-budget-denied.json'),
    JSON.stringify(
      {
        contractVersion: 'v0.6.1',
        smartDigest: deniedDigest,
        feedStats: deniedService.getFeedStats(),
        fetchCallCount: deniedFetch.callCount(),
      },
      null,
      2
    )
  );

  const failFetch = failingFetch();
  const failExternal = new ExternalSmartDigestProvider(externalConfig(cacheFail), failFetch);
  const failService = new SmartDigestService(
    externalConfig(cacheFail),
    undefined,
    { externalProvider: failExternal, budgetGuard: new SmartDigestBudgetGuard(budgetDir, 20) }
  );
  failService.beginBatch();
  const failedDigest = await failService.getDigest({
    ...input,
    clusterId: 'provider-failure-cluster',
  });

  await fs.writeFile(
    path.join(evidenceDir, 'v0.6.1-provider-failure.json'),
    JSON.stringify(
      {
        contractVersion: 'v0.6.1',
        smartDigest: failedDigest,
        feedStats: failService.getFeedStats(),
        endpointWouldReturnHttp200: true,
      },
      null,
      2
    )
  );

  console.log('v0.6.1 evidence written to', evidenceDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
