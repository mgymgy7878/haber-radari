import { generateMockDigest } from '../mock-provider.js';
import { SmartDigestInput } from '../types.js';
import { SmartDigestProvider } from './smart-digest-provider.js';

export class MockSmartDigestProvider implements SmartDigestProvider {
  readonly name = 'mock' as const;

  async generate(input: SmartDigestInput): Promise<import('../types.js').SmartDigestProviderResult> {
    return generateMockDigest(input);
  }
}
