import { ProviderLogEvent } from './types.js';

const providerLogs: ProviderLogEvent[] = [];

/** Test helper — log buffer temizle. */
export function resetProviderLogs(): void {
  providerLogs.length = 0;
}

export function getProviderLogs(): ProviderLogEvent[] {
  return [...providerLogs];
}

/** Yalnızca güvenli alanlar loglanır — API key / full payload asla yok. */
export function logProviderEvent(event: ProviderLogEvent): void {
  providerLogs.push({
    cacheKey: event.cacheKey,
    provider: event.provider,
    status: event.status,
    elapsedMs: event.elapsedMs,
    errorCode: event.errorCode,
  });
}

export function sanitizeProviderError(message: string, apiKey?: string): string {
  let sanitized = message;
  if (apiKey && apiKey.length > 0) {
    sanitized = sanitized.split(apiKey).join('[REDACTED]');
  }
  return sanitized.replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]');
}
