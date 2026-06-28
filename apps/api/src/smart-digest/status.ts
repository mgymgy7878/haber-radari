import {
  loadSmartDigestConfig,
  resolveFeedProvider,
  SmartDigestConfig,
} from './config.js';
import { isOperatorApprovalGranted } from './operator-approval.js';
import { SmartDigestBudgetGuard } from './budget-guard.js';
import { BudgetDayStats } from './types.js';

export interface SmartDigestStatusSafety {
  realExternalCallAllowedNow: boolean;
  reasonIfBlocked: string | null;
  apiKeyConfigured: boolean;
  apiKeyExposed: false;
  promptLoggingEnabled: boolean;
  responseLoggingEnabled: boolean;
}

export interface SmartDigestStatusResponse {
  enabled: boolean;
  provider: 'disabled' | 'mock' | 'external';
  externalEnabled: boolean;
  requireOperatorApproval: boolean;
  operatorApproved: boolean;
  requireCache: boolean;
  dailyLimit: number;
  perRequestLimit: number;
  timeoutMs: number;
  budget: {
    date: string;
    externalCalls: number;
    cacheHits: number;
    failures: number;
    budgetDenied: number;
    approvalDenied: number;
    lastUpdatedAt: string | null;
  };
  safety: SmartDigestStatusSafety;
}

export function evaluateRealExternalCallAllowed(
  config: SmartDigestConfig,
  budgetAllowed: boolean,
  budgetReason?: string
): { allowed: boolean; reason: string | null } {
  if (!config.enabled) {
    return { allowed: false, reason: 'DIGEST_DISABLED' };
  }
  if (config.provider !== 'external') {
    return { allowed: false, reason: 'PROVIDER_NOT_EXTERNAL' };
  }
  if (!config.externalEnabled) {
    return { allowed: false, reason: 'EXTERNAL_DISABLED' };
  }
  if (!isOperatorApprovalGranted(config)) {
    return { allowed: false, reason: 'OPERATOR_APPROVAL_REQUIRED' };
  }
  if (!config.apiKey.trim()) {
    return { allowed: false, reason: 'PROVIDER_CONFIG_MISSING' };
  }
  if (config.simulateProviderFailure) {
    return { allowed: false, reason: 'SIMULATED_FAILURE_MODE' };
  }
  if (!budgetAllowed) {
    return { allowed: false, reason: budgetReason ?? 'BUDGET_EXCEEDED' };
  }
  return { allowed: true, reason: null };
}

function toBudgetPayload(stats: BudgetDayStats) {
  return {
    date: stats.date,
    externalCalls: stats.externalCalls,
    cacheHits: stats.cacheHits,
    failures: stats.failures,
    budgetDenied: stats.budgetDenied,
    approvalDenied: stats.approvalDenied,
    lastUpdatedAt: stats.lastUpdatedAt ?? null,
  };
}

/** Read-only operatör durumu — API key değeri asla dönmez. */
export async function buildSmartDigestStatus(
  configOverrides?: Partial<SmartDigestConfig>,
  budgetGuard?: SmartDigestBudgetGuard
): Promise<SmartDigestStatusResponse> {
  const config = loadSmartDigestConfig(configOverrides);
  const guard =
    budgetGuard ?? new SmartDigestBudgetGuard(config.budgetDir, config.dailyLimit);

  let budgetStats: BudgetDayStats;
  try {
    budgetStats = await guard.getTodayStats();
  } catch {
    const date = new Date().toISOString().slice(0, 10);
    budgetStats = {
      date,
      externalCalls: 0,
      cacheHits: 0,
      failures: 0,
      budgetDenied: 0,
      approvalDenied: 0,
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  const budgetCheck = await guard.canMakeExternalCall();
  const gate = evaluateRealExternalCallAllowed(
    config,
    budgetCheck.allowed,
    budgetCheck.reason
  );

  return {
    enabled: config.enabled,
    provider: resolveFeedProvider(config),
    externalEnabled: config.externalEnabled,
    requireOperatorApproval: config.requireOperatorApproval,
    operatorApproved: config.operatorApproved,
    requireCache: config.requireCache,
    dailyLimit: config.dailyLimit,
    perRequestLimit: config.perRequestLimit,
    timeoutMs: config.timeoutMs,
    budget: toBudgetPayload(budgetStats),
    safety: {
      realExternalCallAllowedNow: gate.allowed,
      reasonIfBlocked: gate.reason,
      apiKeyConfigured: config.apiKey.trim().length > 0,
      apiKeyExposed: false,
      promptLoggingEnabled: config.logPrompts,
      responseLoggingEnabled: config.logResponses,
    },
  };
}
