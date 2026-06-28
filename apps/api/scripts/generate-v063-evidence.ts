/**
 * v0.6.3 evidence JSON üretici — fake/injectable provider ile; gerçek LLM çağrısı yok.
 * Usage: npx tsx scripts/generate-v063-evidence.ts
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
import { sanitizeProviderError } from '../src/smart-digest/provider-log.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const evidenceDir = path.resolve(__dirname, '../../../evidence');
const cacheBase = path.resolve(__dirname, '../.cache');
const budgetDir = path.resolve(cacheBase, 'smart-digest-budget');

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
                summary: 'Bu metadata tabanlı özet — evidence pilot',
                keyPoints: ['Nokta 1', 'Nokta 2'],
                whyItMatters: 'Pilot kanıtı',
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

function baseInput() {
  return buildDigestInputFromClusterItem({
    clusterId: 'evidence-cluster-v063',
    title: 'Merkez Bankası faiz kararını açıkladı',
    shortDescription: 'TCMB politika faizini sabit tuttu.',
    category: 'Ekonomi',
    publishDecision: 'PUBLISH_MAIN',
    publishReason: 'Çok kaynaklı doğrulama',
    sourceCount: 2,
    uniqueSourceCount: 2,
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
    requireOperatorApproval: true,
    operatorApproved: true,
    cacheDir,
    budgetDir,
    apiKey: 'evidence-fake-key-not-real',
    apiUrl: 'https://example.com/v1/chat',
    model: 'evidence-model',
    timeoutMs: 8000,
    requireCache: true,
    dailyLimit: 5,
    perRequestLimit: 1,
    promptVersion: 'v0.6.3',
    digestVersion: 'v0.6.3',
    simulateProviderFailure: false,
    cacheTtlMs: 24 * 60 * 60 * 1000,
    logPrompts: false,
    logResponses: false,
    ...overrides,
  };
}

async function writeJson(name: string, payload: unknown) {
  const file = path.join(evidenceDir, name);
  await fs.writeFile(file, JSON.stringify(payload, null, 2), 'utf8');
  console.log('wrote', file);
}

async function main() {
  await fs.mkdir(evidenceDir, { recursive: true });
  await fs.mkdir(budgetDir, { recursive: true });

  const cacheDir = path.resolve(cacheBase, 'smart-digest-evidence-v063');
  await fs.rm(cacheDir, { recursive: true, force: true }).catch(() => undefined);
  await fs.mkdir(cacheDir, { recursive: true });

  const budgetGuard = new SmartDigestBudgetGuard(budgetDir, 5);
  await budgetGuard.resetToday();

  // 1. approval required
  {
    const fetchFn = mockFetch();
    const service = new SmartDigestService(
      {
        enabled: true,
        provider: 'external',
        externalEnabled: true,
        requireOperatorApproval: true,
        operatorApproved: false,
        apiKey: 'evidence-fake-key-not-real',
        cacheDir,
        budgetDir,
      },
      undefined,
      {
        externalProvider: new ExternalSmartDigestProvider(
          externalConfig(cacheDir, { operatorApproved: false }) as any,
          fetchFn
        ),
        budgetGuard,
      }
    );
    service.beginBatch();
    const digest = await service.getDigest(baseInput());
    await writeJson('v0.6.3-approval-required.json', {
      digest,
      feedStats: service.getFeedStats(),
      fetchCallCount: fetchFn.callCount(),
      realExternalCallExecuted: false,
    });
  }

  // 2. config missing
  {
    const fetchFn = mockFetch();
    const service = new SmartDigestService(
      {
        enabled: true,
        provider: 'external',
        externalEnabled: true,
        requireOperatorApproval: true,
        operatorApproved: true,
        apiKey: '',
        cacheDir: path.join(cacheDir, 'config-missing'),
        budgetDir,
      },
      undefined,
      {
        externalProvider: new ExternalSmartDigestProvider(
          externalConfig(path.join(cacheDir, 'config-missing'), { apiKey: '' }) as any,
          fetchFn
        ),
        budgetGuard,
      }
    );
    service.beginBatch();
    const digest = await service.getDigest(baseInput());
    await writeJson('v0.6.3-config-missing.json', {
      digest,
      feedStats: service.getFeedStats(),
      fetchCallCount: fetchFn.callCount(),
      productionApiKeyUsed: false,
    });
  }

  // 3. fake external generated
  const genCacheDir = path.join(cacheDir, 'generated');
  await fs.mkdir(genCacheDir, { recursive: true });
  const genFetch = mockFetch();
  const genService = new SmartDigestService(
    {
      enabled: true,
      provider: 'external',
      externalEnabled: true,
      operatorApproved: true,
      apiKey: 'evidence-fake-key-not-real',
      cacheDir: genCacheDir,
      budgetDir,
    },
    undefined,
    {
      externalProvider: new ExternalSmartDigestProvider(
        externalConfig(genCacheDir) as any,
        genFetch
      ),
      budgetGuard,
    }
  );
  genService.beginBatch();
  const pilotInput = baseInput();
  const generated = await genService.getDigest(pilotInput);
  await writeJson('v0.6.3-fake-external-generated.json', {
    digest: generated,
    feedStats: genService.getFeedStats(),
    fetchCallCount: genFetch.callCount(),
    budget: await budgetGuard.getTodayStats(),
    realExternalCallExecuted: false,
    operatorApprovalUsed: true,
    productionApiKeyUsed: false,
  });

  // 4. cache hit — aynı input referansı
  genService.beginBatch();
  const cached = await genService.getDigest(pilotInput);
  await writeJson('v0.6.3-fake-external-cache-hit.json', {
    digest: cached,
    feedStats: genService.getFeedStats(),
    fetchCallCount: genFetch.callCount(),
    realExternalCallExecuted: false,
  });

  // 5. budget denied
  await budgetGuard.resetToday();
  for (let i = 0; i < 5; i += 1) {
    await budgetGuard.recordExternalCall();
  }
  const budgetCacheDir = path.join(cacheDir, 'budget-denied');
  await fs.mkdir(budgetCacheDir, { recursive: true });
  const budgetFetch = mockFetch();
  const budgetService = new SmartDigestService(
    {
      enabled: true,
      provider: 'external',
      externalEnabled: true,
      operatorApproved: true,
      apiKey: 'evidence-fake-key-not-real',
      dailyLimit: 5,
      cacheDir: budgetCacheDir,
      budgetDir,
    },
    undefined,
    {
      externalProvider: new ExternalSmartDigestProvider(
        externalConfig(budgetCacheDir) as any,
        budgetFetch
      ),
      budgetGuard,
    }
  );
  budgetService.beginBatch();
  const budgetDenied = await budgetService.getDigest({
    ...baseInput(),
    clusterId: 'budget-denied-cluster',
  });
  await writeJson('v0.6.3-budget-denied.json', {
    digest: budgetDenied,
    feedStats: budgetService.getFeedStats(),
    budget: await budgetGuard.getTodayStats(),
    fetchCallCount: budgetFetch.callCount(),
  });

  // secret redaction
  const secret = 'evidence-redaction-secret-placeholder';
  const redacted = sanitizeProviderError(`Bearer ${secret} failed`, secret);
  const redactionPath = path.join(evidenceDir, 'v0.6.3-secret-redaction.txt');
  await fs.writeFile(
    redactionPath,
    [
      'v0.6.3 secret redaction evidence',
      `input_contains_secret: ${redacted.includes(secret)}`,
      `redacted_sample: ${redacted}`,
      'productionApiKeyUsed: false',
    ].join('\n'),
    'utf8'
  );
  console.log('wrote', redactionPath);

  console.log('v0.6.3 evidence complete — no real external LLM calls');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
