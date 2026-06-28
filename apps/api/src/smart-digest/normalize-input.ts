import { FORBIDDEN_DIGEST_FIELDS, SmartDigestInput, SmartDigestSourceInput } from './types.js';

function assertNoForbiddenFields(value: unknown, pathPrefix = 'input'): void {
  if (value === null || value === typeof undefined) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenFields(item, `${pathPrefix}[${index}]`));
    return;
  }
  if (typeof value !== 'object') return;

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if ((FORBIDDEN_DIGEST_FIELDS as readonly string[]).includes(key)) {
      throw new Error(`Forbidden digest field: ${pathPrefix}.${key}`);
    }
    assertNoForbiddenFields(nested, `${pathPrefix}.${key}`);
  }
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}

function normalizeSource(source: SmartDigestSourceInput): SmartDigestSourceInput {
  return {
    sourceName: normalizeText(source.sourceName),
    title: normalizeText(source.title),
    shortDescription: normalizeText(source.shortDescription),
    originalUrl: normalizeText(source.originalUrl),
    publishedAt: source.publishedAt ?? 0,
  };
}

/** Deterministik cache key girdisi — kaynak sırası sabit. */
export function normalizeSmartDigestInput(input: SmartDigestInput): SmartDigestInput {
  assertNoForbiddenFields(input);

  const sources = [...input.sources]
    .map(normalizeSource)
    .sort((a, b) => {
      const byName = a.sourceName.localeCompare(b.sourceName, 'tr');
      if (byName !== 0) return byName;
      return a.publishedAt - b.publishedAt;
    });

  const sourceNames = [...new Set(sources.map((s) => s.sourceName))].sort((a, b) =>
    a.localeCompare(b, 'tr')
  );

  return {
    clusterId: normalizeText(input.clusterId),
    title: normalizeText(input.title),
    shortDescription: normalizeText(input.shortDescription),
    category: normalizeText(input.category),
    publishDecision: normalizeText(input.publishDecision),
    publishReason: input.publishReason ? normalizeText(input.publishReason) : null,
    sourceCount: input.sourceCount,
    sourceNames,
    publishedAt: input.publishedAt ?? 0,
    sources,
    importance: input.importance ? normalizeText(input.importance) : undefined,
    evidenceStatus: input.evidenceStatus ? normalizeText(input.evidenceStatus) : undefined,
    contentType: input.contentType ? normalizeText(input.contentType) : undefined,
    topicQuality: input.topicQuality ? normalizeText(input.topicQuality) : undefined,
  };
}
