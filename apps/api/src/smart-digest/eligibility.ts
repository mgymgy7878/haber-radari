import { SmartDigestInput } from './types.js';

const RECENT_MAX_AGE_MS = 48 * 60 * 60 * 1000;
const HIGH_IMPORTANCE = new Set(['HIGH', 'CRITICAL']);

/** External digest yalnızca seçilmiş PUBLISH_MAIN adayları için. */
export function isEligibleForExternalDigest(
  input: SmartDigestInput,
  nowMs: number = Date.now()
): boolean {
  if (input.publishDecision !== 'PUBLISH_MAIN') return false;

  const ageMs = nowMs - (input.publishedAt || 0);
  if (input.publishedAt > 0 && ageMs > RECENT_MAX_AGE_MS) return false;

  const importance = (input.importance ?? '').toUpperCase();
  if (input.sourceCount >= 2) return true;
  if (HIGH_IMPORTANCE.has(importance)) return true;

  return false;
}
