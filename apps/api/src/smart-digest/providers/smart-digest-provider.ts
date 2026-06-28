import { SmartDigestInput, SmartDigestProviderResult } from '../types.js';

export interface SmartDigestProvider {
  readonly name: 'mock' | 'external';
  generate(input: SmartDigestInput, signal?: AbortSignal): Promise<SmartDigestProviderResult>;
}

export type FetchFn = typeof fetch;
