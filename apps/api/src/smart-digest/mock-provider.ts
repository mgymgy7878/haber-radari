import crypto from 'crypto';
import { MockDigestPayload, SmartDigestConfidence, SmartDigestInput } from './types.js';

function hashSeed(input: SmartDigestInput): string {
  return crypto
    .createHash('sha256')
    .update(`${input.clusterId}|${input.title}|${input.sourceNames.join(',')}`, 'utf8')
    .digest('hex')
    .slice(0, 8);
}

function confidenceFromInput(input: SmartDigestInput): SmartDigestConfidence {
  if (input.sourceCount >= 3) return 'HIGH';
  if (input.sourceCount >= 2) return 'MEDIUM';
  return 'LOW';
}

/** Deterministik mock digest — gerçek LLM çağrısı yok. */
export function generateMockDigest(input: SmartDigestInput): MockDigestPayload {
  const seed = hashSeed(input);
  const sourceList = input.sourceNames.join(', ') || 'tek kaynak';
  const summary = `[AI metadata özeti • mock ${seed}] ${input.title}. ${input.shortDescription || 'Kısa açıklama yok.'} Kaynaklar: ${sourceList}. Orijinal haber linkleri korunur; tam metin kullanılmaz.`;

  const keyPoints = [
    `${input.sourceCount} kaynak doğrulaması (${sourceList})`,
    input.publishReason ? `Yayın nedeni: ${input.publishReason}` : 'Yayın nedeni belirtilmedi',
    `Kategori: ${input.category || 'Genel'}`,
  ].filter(Boolean);

  const whyItMatters = `Bu olay ${input.category || 'gündem'} başlığında ${input.sourceCount} kaynakla izleniyor; metadata tabanlı AI özeti yalnızca başlık ve kısa açıklamalardan üretildi.`;

  return {
    summary,
    keyPoints,
    whyItMatters,
    confidence: confidenceFromInput(input),
  };
}
