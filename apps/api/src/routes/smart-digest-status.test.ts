import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { smartDigestStatusRoute } from './smart-digest-status.js';
import { buildSmartDigestStatus } from '../smart-digest/status.js';
import { SmartDigestBudgetGuard } from '../smart-digest/budget-guard.js';

describe('GET /api/v1/smart-digest/status', () => {
  let budgetDir: string;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    budgetDir = path.join(os.tmpdir(), `sd-status-${Date.now()}-${Math.random()}`);
    await fs.mkdir(budgetDir, { recursive: true });
    process.env = { ...originalEnv };
    process.env.LLM_DIGEST_BUDGET_DIR = budgetDir;
    process.env.LLM_DIGEST_ENABLED = '1';
    process.env.LLM_DIGEST_PROVIDER = 'external';
    process.env.LLM_DIGEST_EXTERNAL_ENABLED = '0';
    process.env.LLM_DIGEST_REQUIRE_OPERATOR_APPROVAL = '1';
    delete process.env.OPERATOR_APPROVED_REAL_LLM_DIGEST;
    delete process.env.LLM_DIGEST_API_KEY;
    process.env.LLM_DIGEST_LOG_PROMPTS = '0';
    process.env.LLM_DIGEST_LOG_RESPONSES = '0';
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    await fs.rm(budgetDir, { recursive: true, force: true }).catch(() => undefined);
  });

  async function callRoute() {
    const mockReply = {
      send: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      log: { error: vi.fn() },
    };
    await smartDigestStatusRoute({} as any, mockReply as any);
    return mockReply.send.mock.calls[0][0];
  }

  it('1. status endpoint API key değerini döndürmez', async () => {
    process.env.LLM_DIGEST_API_KEY = 'super-secret-production-key';
    const body = await callRoute();
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('super-secret-production-key');
    expect(body.safety.apiKeyExposed).toBe(false);
  });

  it('2. status endpoint apiKeyConfigured true/false döndürür', async () => {
    process.env.LLM_DIGEST_API_KEY = '';
    const withoutKey = await callRoute();
    expect(withoutKey.safety.apiKeyConfigured).toBe(false);

    process.env.LLM_DIGEST_API_KEY = 'local-only-key';
    const withKey = await callRoute();
    expect(withKey.safety.apiKeyConfigured).toBe(true);
    expect(JSON.stringify(withKey)).not.toContain('local-only-key');
  });

  it('3. approval yoksa realExternalCallAllowedNow=false', async () => {
    process.env.LLM_DIGEST_EXTERNAL_ENABLED = '1';
    process.env.LLM_DIGEST_API_KEY = 'key';
    const body = await callRoute();
    expect(body.safety.realExternalCallAllowedNow).toBe(false);
    expect(body.safety.reasonIfBlocked).toBe('OPERATOR_APPROVAL_REQUIRED');
  });

  it('4. external disabled ise realExternalCallAllowedNow=false', async () => {
    process.env.LLM_DIGEST_EXTERNAL_ENABLED = '0';
    process.env.OPERATOR_APPROVED_REAL_LLM_DIGEST = '1';
    process.env.LLM_DIGEST_API_KEY = 'key';
    const body = await callRoute();
    expect(body.safety.realExternalCallAllowedNow).toBe(false);
    expect(body.safety.reasonIfBlocked).toBe('EXTERNAL_DISABLED');
  });

  it('5. budget exceeded ise realExternalCallAllowedNow=false', async () => {
    process.env.LLM_DIGEST_EXTERNAL_ENABLED = '1';
    process.env.OPERATOR_APPROVED_REAL_LLM_DIGEST = '1';
    process.env.LLM_DIGEST_API_KEY = 'key';
    process.env.LLM_DIGEST_DAILY_LIMIT = '2';
    const guard = new SmartDigestBudgetGuard(budgetDir, 2);
    await guard.recordExternalCall();
    await guard.recordExternalCall();

    const body = await buildSmartDigestStatus(
      {
        enabled: true,
        provider: 'external',
        externalEnabled: true,
        operatorApproved: true,
        apiKey: 'key',
        budgetDir,
        dailyLimit: 2,
      },
      guard
    );
    expect(body.safety.realExternalCallAllowedNow).toBe(false);
    expect(body.safety.reasonIfBlocked).toBe('BUDGET_EXCEEDED');
  });

  it('6. all gates open fake config ile realExternalCallAllowedNow=true, gerçek çağrı yok', async () => {
    const body = await buildSmartDigestStatus({
      enabled: true,
      provider: 'external',
      externalEnabled: true,
      requireOperatorApproval: true,
      operatorApproved: true,
      apiKey: 'fake-test-key-not-production',
      budgetDir,
      dailyLimit: 5,
    });
    expect(body.safety.realExternalCallAllowedNow).toBe(true);
    expect(body.safety.reasonIfBlocked).toBeNull();
  });

  it('7. budget file yoksa default zero counters döner', async () => {
    const emptyDir = path.join(os.tmpdir(), `sd-empty-budget-${Date.now()}`);
    const body = await buildSmartDigestStatus({
      budgetDir: emptyDir,
      dailyLimit: 5,
    });
    expect(body.budget.externalCalls).toBe(0);
    expect(body.budget.cacheHits).toBe(0);
    expect(body.budget.failures).toBe(0);
    await fs.rm(emptyDir, { recursive: true, force: true }).catch(() => undefined);
  });

  it('8. malformed budget file endpoint düşürmez', async () => {
    const date = new Date().toISOString().slice(0, 10);
    await fs.writeFile(path.join(budgetDir, `${date}.json`), '{not valid json!!!', 'utf8');
    const body = await callRoute();
    expect(body.budget.externalCalls).toBe(0);
    expect(body.enabled).toBeDefined();
  });

  it('9. prompt/response log flags boolean döner, içerik dönmez', async () => {
    process.env.LLM_DIGEST_LOG_PROMPTS = '1';
    process.env.LLM_DIGEST_LOG_RESPONSES = '0';
    const body = await callRoute();
    expect(body.safety.promptLoggingEnabled).toBe(true);
    expect(body.safety.responseLoggingEnabled).toBe(false);
    expect(body.prompt).toBeUndefined();
    expect(body.response).toBeUndefined();
  });

  it('10. response valid JSON', async () => {
    const body = await callRoute();
    expect(() => JSON.parse(JSON.stringify(body))).not.toThrow();
    expect(body.provider).toMatch(/^(disabled|mock|external)$/);
    expect(body.budget).toBeDefined();
    expect(body.safety).toBeDefined();
  });
});
