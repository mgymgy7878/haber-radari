import { SmartDigestProviderResult } from './types.js';

const MAX_SUMMARY_CHARS = 500;
const MAX_WHY_CHARS = 280;
const MAX_KEY_POINTS = 3;

/** External provider çıktısını contract ve güvenlik sınırlarına normalize eder. */
export function normalizeProviderOutput(result: SmartDigestProviderResult): SmartDigestProviderResult {
  let summary = (result.summary ?? '').trim();
  if (summary && !summary.toLowerCase().includes('metadata')) {
    summary = `Bu metadata tabanlı özet — ${summary}`;
  }
  if (summary.length > MAX_SUMMARY_CHARS) {
    summary = `${summary.slice(0, MAX_SUMMARY_CHARS)}…`;
  }

  let whyItMatters = (result.whyItMatters ?? '').trim();
  if (whyItMatters.length > MAX_WHY_CHARS) {
    whyItMatters = `${whyItMatters.slice(0, MAX_WHY_CHARS)}…`;
  }

  const keyPoints = (result.keyPoints ?? [])
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, MAX_KEY_POINTS);

  const confidence = ['LOW', 'MEDIUM', 'HIGH'].includes(result.confidence)
    ? result.confidence
    : 'MEDIUM';

  return { summary, keyPoints, whyItMatters, confidence };
}
