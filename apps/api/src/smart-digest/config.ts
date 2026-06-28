import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface SmartDigestConfig {
  enabled: boolean;
  provider: 'mock' | 'external';
  externalEnabled: boolean;
  cacheDir: string;
  budgetDir: string;
  cacheTtlMs: number;
  promptVersion: string;
  digestVersion: string;
  simulateProviderFailure: boolean;
  dailyLimit: number;
  perRequestLimit: number;
  requireCache: boolean;
  timeoutMs: number;
  model: string;
  apiKey: string;
  apiUrl: string;
}

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;
  return raw === '1' || raw.toLowerCase() === 'true';
}

export function loadSmartDigestConfig(overrides?: Partial<SmartDigestConfig>): SmartDigestConfig {
  const defaultCacheDir = path.resolve(__dirname, '../../.cache/smart-digest');
  const defaultBudgetDir = path.resolve(__dirname, '../../.cache/smart-digest-budget');

  return {
    enabled: envFlag('LLM_DIGEST_ENABLED', false),
    provider: process.env.LLM_DIGEST_PROVIDER === 'external' ? 'external' : 'mock',
    externalEnabled: envFlag('LLM_DIGEST_EXTERNAL_ENABLED', false),
    cacheDir: process.env.LLM_DIGEST_CACHE_DIR ?? defaultCacheDir,
    budgetDir: process.env.LLM_DIGEST_BUDGET_DIR ?? defaultBudgetDir,
    cacheTtlMs: Number(process.env.LLM_DIGEST_CACHE_TTL_MS ?? 24 * 60 * 60 * 1000),
    promptVersion: process.env.LLM_DIGEST_PROMPT_VERSION ?? 'v0.6.1',
    digestVersion: process.env.LLM_DIGEST_VERSION ?? 'v0.6.1',
    simulateProviderFailure: envFlag('LLM_DIGEST_SIMULATE_FAILURE', false),
    dailyLimit: Number(process.env.LLM_DIGEST_DAILY_LIMIT ?? 20),
    perRequestLimit: Number(process.env.LLM_DIGEST_PER_REQUEST_LIMIT ?? 3),
    requireCache: envFlag('LLM_DIGEST_REQUIRE_CACHE', true),
    timeoutMs: Number(process.env.LLM_DIGEST_TIMEOUT_MS ?? 8000),
    model: process.env.LLM_DIGEST_MODEL ?? 'gpt-4o-mini',
    apiKey: process.env.LLM_DIGEST_API_KEY ?? '',
    apiUrl: process.env.LLM_DIGEST_API_URL ?? 'https://api.openai.com/v1/chat/completions',
    ...overrides,
  };
}

export function resolveFeedProvider(config: SmartDigestConfig): 'disabled' | 'mock' | 'external' {
  if (!config.enabled) return 'disabled';
  if (config.provider === 'external' && config.externalEnabled) return 'external';
  if (config.provider === 'external') return 'external';
  return 'mock';
}
