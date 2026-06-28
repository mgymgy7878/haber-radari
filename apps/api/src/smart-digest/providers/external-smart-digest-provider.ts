import { SmartDigestConfig } from '../config.js';
import { normalizeSmartDigestInput } from '../normalize-input.js';
import { sanitizeProviderError } from '../provider-log.js';
import { SmartDigestInput, SmartDigestProviderResult } from '../types.js';
import { FetchFn, SmartDigestProvider } from './smart-digest-provider.js';

function buildMetadataPrompt(input: SmartDigestInput): string {
  const sources = input.sources
    .map(
      (s, i) =>
        `${i + 1}. [${s.sourceName}] ${s.title}\n   Kısa açıklama: ${s.shortDescription}\n   URL: ${s.originalUrl}`
    )
    .join('\n');

  return [
    'Sen bir haber metadata özetleyicisisin. Yalnızca verilen başlık ve kısa açıklamalardan özet üret.',
    'Tam makale metni verilmedi — uydurma yapma.',
    'Özet metadata tabanlıdır; orijinal haberin yerine geçmez.',
    '',
    `Başlık: ${input.title}`,
    `Kısa açıklama: ${input.shortDescription}`,
    `Kategori: ${input.category}`,
    `Kaynak sayısı: ${input.sourceCount}`,
    `Yayın nedeni: ${input.publishReason ?? 'belirtilmedi'}`,
    '',
    'Kaynaklar:',
    sources,
    '',
    'JSON formatında yanıt ver: {"summary":"...","keyPoints":["..."],"whyItMatters":"...","confidence":"LOW|MEDIUM|HIGH"}',
  ].join('\n');
}

function parseProviderJson(content: string): SmartDigestProviderResult {
  const parsed = JSON.parse(content) as SmartDigestProviderResult;
  if (!parsed.summary || !Array.isArray(parsed.keyPoints)) {
    throw new Error('INVALID_PROVIDER_RESPONSE');
  }
  const confidence = parsed.confidence ?? 'MEDIUM';
  if (!['LOW', 'MEDIUM', 'HIGH'].includes(confidence)) {
    throw new Error('INVALID_CONFIDENCE');
  }
  return {
    summary: parsed.summary,
    keyPoints: parsed.keyPoints,
    whyItMatters: parsed.whyItMatters ?? '',
    confidence,
  };
}

export class ExternalSmartDigestProvider implements SmartDigestProvider {
  readonly name = 'external' as const;

  constructor(
    private readonly config: SmartDigestConfig,
    private readonly fetchFn: FetchFn = fetch
  ) {}

  async generate(input: SmartDigestInput, signal?: AbortSignal): Promise<SmartDigestProviderResult> {
    if (!this.config.apiKey) {
      throw new Error('EXTERNAL_NOT_CONFIGURED');
    }

    const normalized = normalizeSmartDigestInput(input);
    const prompt = buildMetadataPrompt(normalized);

    const response = await this.fetchFn(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: 'Metadata-only news digest assistant. Respond in Turkish JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'unknown error');
      throw new Error(
        sanitizeProviderError(`EXTERNAL_HTTP_${response.status}: ${errText.slice(0, 200)}`, this.config.apiKey)
      );
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('EXTERNAL_EMPTY_RESPONSE');
    }

    return parseProviderJson(content);
  }
}
