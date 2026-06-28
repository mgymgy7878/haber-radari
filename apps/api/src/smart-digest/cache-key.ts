import crypto from 'crypto';
import { SmartDigestInput } from './types.js';
import { normalizeSmartDigestInput } from './normalize-input.js';

export function buildDigestCacheKey(
  input: SmartDigestInput,
  promptVersion: string,
  digestVersion: string
): string {
  const normalized = normalizeSmartDigestInput(input);
  const payload = JSON.stringify({
    promptVersion,
    digestVersion,
    input: normalized,
  });
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}
