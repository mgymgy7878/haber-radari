import { SmartDigestConfig, loadSmartDigestConfig, resolveFeedProvider } from './config.js';
import { buildDigestCacheKey } from './cache-key.js';
import { SmartDigestFileCache } from './file-cache.js';
import { normalizeSmartDigestInput } from './normalize-input.js';
import { isEligibleForExternalDigest } from './eligibility.js';
import { SmartDigestBudgetGuard } from './budget-guard.js';
import { logProviderEvent } from './provider-log.js';
import { MockSmartDigestProvider } from './providers/mock-smart-digest-provider.js';
import { ExternalSmartDigestProvider } from './providers/external-smart-digest-provider.js';
import { SmartDigestProvider } from './providers/smart-digest-provider.js';
import {
  SmartDigest,
  SmartDigestFeedStats,
  SmartDigestInput,
  SmartDigestStats,
} from './types.js';

export interface SmartDigestServiceDeps {
  mockProvider?: SmartDigestProvider;
  externalProvider?: SmartDigestProvider;
  budgetGuard?: SmartDigestBudgetGuard;
}

export class SmartDigestService {
  private readonly config: SmartDigestConfig;
  private readonly cache: SmartDigestFileCache;
  private readonly mockProvider: SmartDigestProvider;
  private readonly externalProvider: SmartDigestProvider;
  private readonly budgetGuard: SmartDigestBudgetGuard;

  private stats: SmartDigestStats = emptyStats();
  private feedStats: SmartDigestFeedStats = emptyFeedStats(false, 'disabled');
  private batchExternalCalls = 0;

  constructor(
    config?: Partial<SmartDigestConfig>,
    cache?: SmartDigestFileCache,
    deps?: SmartDigestServiceDeps
  ) {
    this.config = loadSmartDigestConfig(config);
    this.cache = cache ?? new SmartDigestFileCache(this.config.cacheDir, this.config.cacheTtlMs);
    this.mockProvider = deps?.mockProvider ?? new MockSmartDigestProvider();
    this.externalProvider =
      deps?.externalProvider ?? new ExternalSmartDigestProvider(this.config);
    this.budgetGuard =
      deps?.budgetGuard ??
      new SmartDigestBudgetGuard(this.config.budgetDir, this.config.dailyLimit);
  }

  beginBatch(): void {
    this.batchExternalCalls = 0;
    const provider = resolveFeedProvider(this.config);
    this.feedStats = emptyFeedStats(this.config.enabled, provider);
    this.stats = emptyStats();
  }

  getStats(): SmartDigestStats {
    return { ...this.stats };
  }

  getFeedStats(): SmartDigestFeedStats {
    return { ...this.feedStats };
  }

  resetStats(): void {
    this.stats = emptyStats();
    this.feedStats = emptyFeedStats(this.config.enabled, resolveFeedProvider(this.config));
    this.batchExternalCalls = 0;
  }

  computeCacheKey(input: SmartDigestInput): string {
    const normalized = normalizeSmartDigestInput(input);
    return buildDigestCacheKey(normalized, this.config.promptVersion, this.config.digestVersion);
  }

  async getDigest(input: SmartDigestInput): Promise<SmartDigest> {
    this.stats.requested += 1;

    let cacheKey: string;
    try {
      cacheKey = this.computeCacheKey(input);
    } catch {
      this.stats.failed += 1;
      this.feedStats.failedCount += 1;
      return this.failedDigest('', 'INPUT_NORMALIZATION_FAILED', 'disabled');
    }

    if (!this.config.enabled) {
      this.stats.disabled += 1;
      return this.disabledDigest(cacheKey);
    }

    try {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.stats.cacheHits += 1;
        this.stats.cached += 1;
        this.feedStats.cachedCount += 1;
        await this.budgetGuard.recordCacheHit();
        logProviderEvent({ cacheKey, provider: resolveFeedProvider(this.config), status: 'CACHED' });
        return {
          status: 'CACHED',
          ...cached.digest,
          cacheKey,
        };
      }

      this.stats.cacheMisses += 1;

      if (this.config.simulateProviderFailure) {
        throw new Error('SIMULATED_PROVIDER_FAILURE');
      }

      if (this.config.provider === 'external') {
        return await this.generateExternalDigest(input, cacheKey);
      }

      return await this.generateMockDigest(input, cacheKey);
    } catch {
      this.stats.failed += 1;
      this.feedStats.failedCount += 1;
      await this.budgetGuard.recordFailure();
      logProviderEvent({
        cacheKey,
        provider: 'external',
        status: 'FAILED',
        errorCode: 'DIGEST_PROVIDER_FAILED',
      });
      return this.failedDigest(cacheKey, 'DIGEST_PROVIDER_FAILED', this.config.provider);
    }
  }

  private async generateMockDigest(input: SmartDigestInput, cacheKey: string): Promise<SmartDigest> {
    const mock = await this.mockProvider.generate(normalizeSmartDigestInput(input));
    const generatedAt = new Date().toISOString();
    const digestBody = {
      summary: mock.summary,
      keyPoints: mock.keyPoints,
      whyItMatters: mock.whyItMatters,
      confidence: mock.confidence,
      sourcePolicy: 'METADATA_ONLY' as const,
      modelProvider: 'mock' as const,
      generatedAt,
    };

    await this.persistCache(cacheKey, digestBody);
    this.stats.mocked += 1;
    this.feedStats.generatedCount += 1;
    logProviderEvent({ cacheKey, provider: 'mock', status: 'MOCKED' });

    return { status: 'MOCKED', ...digestBody, cacheKey };
  }

  private async generateExternalDigest(input: SmartDigestInput, cacheKey: string): Promise<SmartDigest> {
    if (!this.config.externalEnabled) {
      this.stats.disabled += 1;
      return this.failedDigest(cacheKey, 'EXTERNAL_DISABLED', 'external');
    }

    if (!isEligibleForExternalDigest(input)) {
      this.stats.disabled += 1;
      return this.failedDigest(cacheKey, 'NOT_ELIGIBLE_FOR_EXTERNAL', 'external');
    }

    this.feedStats.eligibleCount += 1;

    const budget = await this.budgetGuard.canMakeExternalCall();
    if (!budget.allowed) {
      this.stats.budgetDenied += 1;
      this.feedStats.budgetDeniedCount += 1;
      await this.budgetGuard.recordBudgetDenied();
      logProviderEvent({ cacheKey, provider: 'external', status: 'FAILED', errorCode: 'BUDGET_EXCEEDED' });
      return this.failedDigest(cacheKey, 'BUDGET_EXCEEDED', 'external');
    }

    if (this.batchExternalCalls >= this.config.perRequestLimit) {
      this.stats.budgetDenied += 1;
      this.feedStats.budgetDeniedCount += 1;
      await this.budgetGuard.recordBudgetDenied();
      logProviderEvent({ cacheKey, provider: 'external', status: 'FAILED', errorCode: 'PER_REQUEST_LIMIT' });
      return this.failedDigest(cacheKey, 'PER_REQUEST_LIMIT', 'external');
    }

    const started = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const result = await this.externalProvider.generate(
        normalizeSmartDigestInput(input),
        controller.signal
      );
      const generatedAt = new Date().toISOString();
      const digestBody = {
        summary: result.summary,
        keyPoints: result.keyPoints,
        whyItMatters: result.whyItMatters,
        confidence: result.confidence,
        sourcePolicy: 'METADATA_ONLY' as const,
        modelProvider: 'external' as const,
        generatedAt,
      };

      await this.persistCache(cacheKey, digestBody);
      await this.budgetGuard.recordExternalCall();

      this.batchExternalCalls += 1;
      this.feedStats.externalCallCount += 1;
      this.feedStats.generatedCount += 1;
      this.stats.generated += 1;

      logProviderEvent({
        cacheKey,
        provider: 'external',
        status: 'GENERATED',
        elapsedMs: Date.now() - started,
      });

      return { status: 'GENERATED', ...digestBody, cacheKey };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async persistCache(
    cacheKey: string,
    digestBody: Omit<SmartDigest, 'status' | 'cacheKey'>
  ): Promise<void> {
    await this.cache.set(cacheKey, digestBody);
    if (this.config.requireCache) {
      const verify = await this.cache.get(cacheKey);
      if (!verify) {
        throw new Error('CACHE_WRITE_FAILED');
      }
    }
  }

  private disabledDigest(cacheKey: string): SmartDigest {
    return {
      status: 'DISABLED',
      summary: null,
      keyPoints: [],
      whyItMatters: null,
      confidence: 'LOW',
      sourcePolicy: 'METADATA_ONLY',
      modelProvider: 'disabled',
      cacheKey,
      generatedAt: null,
    };
  }

  private failedDigest(
    cacheKey: string,
    errorCode: string,
    modelProvider: SmartDigest['modelProvider']
  ): SmartDigest {
    return {
      status: 'FAILED',
      summary: null,
      keyPoints: [],
      whyItMatters: null,
      confidence: 'LOW',
      sourcePolicy: 'METADATA_ONLY',
      modelProvider,
      cacheKey,
      generatedAt: null,
      errorCode,
    };
  }
}

function emptyStats(): SmartDigestStats {
  return {
    requested: 0,
    cacheHits: 0,
    cacheMisses: 0,
    disabled: 0,
    mocked: 0,
    cached: 0,
    generated: 0,
    failed: 0,
    budgetDenied: 0,
  };
}

function emptyFeedStats(
  enabled: boolean,
  provider: SmartDigestFeedStats['provider']
): SmartDigestFeedStats {
  return {
    enabled,
    provider,
    eligibleCount: 0,
    generatedCount: 0,
    cachedCount: 0,
    failedCount: 0,
    budgetDeniedCount: 0,
    externalCallCount: 0,
  };
}

export function buildDigestInputFromClusterItem(params: {
  clusterId: string;
  title: string;
  shortDescription: string;
  category: string;
  publishDecision: string;
  publishReason: string | null;
  sourceCount: number;
  importance?: string;
  evidenceStatus?: string;
  contentType?: string;
  topicQuality?: string;
  sources: Array<{
    sourceName: string;
    originalTitle: string;
    shortDescription?: string;
    url: string;
    publishedAt: number;
  }>;
}): SmartDigestInput {
  const sources = params.sources.map((s) => ({
    sourceName: s.sourceName,
    title: s.originalTitle,
    shortDescription: s.shortDescription ?? params.shortDescription ?? '',
    originalUrl: s.url,
    publishedAt: s.publishedAt,
  }));

  const sourceNames = [...new Set(sources.map((s) => s.sourceName))];
  const publishedAt = sources.reduce((min, s) => Math.min(min, s.publishedAt), Number.MAX_SAFE_INTEGER);

  return {
    clusterId: params.clusterId,
    title: params.title,
    shortDescription: params.shortDescription,
    category: params.category,
    publishDecision: params.publishDecision,
    publishReason: params.publishReason,
    sourceCount: params.sourceCount,
    sourceNames,
    publishedAt: publishedAt === Number.MAX_SAFE_INTEGER ? 0 : publishedAt,
    sources,
    importance: params.importance,
    evidenceStatus: params.evidenceStatus,
    contentType: params.contentType,
    topicQuality: params.topicQuality,
  };
}
