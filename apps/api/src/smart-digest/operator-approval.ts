import { SmartDigestConfig } from './config.js';

/** v0.6.3 — gerçek external çağrı için operatör onayı zorunlu. */
export function isOperatorApprovalGranted(config: SmartDigestConfig): boolean {
  if (!config.requireOperatorApproval) return true;
  return config.operatorApproved;
}

export function readOperatorApprovalFromEnv(): boolean {
  const raw = process.env.OPERATOR_APPROVED_REAL_LLM_DIGEST;
  return raw === '1' || raw?.toLowerCase() === 'true';
}
