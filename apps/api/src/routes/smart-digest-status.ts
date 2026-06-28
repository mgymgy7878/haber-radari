import { FastifyReply, FastifyRequest } from 'fastify';
import { buildSmartDigestStatus } from '../smart-digest/status.js';

/** GET /api/v1/smart-digest/status — read-only budget/operator dashboard. */
export async function smartDigestStatusRoute(
  _req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const status = await buildSmartDigestStatus();
    reply.send(status);
  } catch (err) {
    reply.log.error({ err }, 'smart-digest status failed');
    reply.status(200).send({
      enabled: false,
      provider: 'disabled',
      externalEnabled: false,
      requireOperatorApproval: true,
      operatorApproved: false,
      requireCache: true,
      dailyLimit: 5,
      perRequestLimit: 1,
      timeoutMs: 8000,
      budget: {
        date: new Date().toISOString().slice(0, 10),
        externalCalls: 0,
        cacheHits: 0,
        failures: 0,
        budgetDenied: 0,
        approvalDenied: 0,
        lastUpdatedAt: null,
      },
      safety: {
        realExternalCallAllowedNow: false,
        reasonIfBlocked: 'STATUS_READ_FAILED',
        apiKeyConfigured: false,
        apiKeyExposed: false,
        promptLoggingEnabled: false,
        responseLoggingEnabled: false,
      },
    });
  }
}
