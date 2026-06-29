# Current Architecture — v0.6.x

**SSOT:** Aktif ürün hattı = Native Android + Fastify Smart Feed backend.

**main referans:** `72f1529826f88a92bab8a23ae817d497a47863f0` (v0.6.4 merge sonrası)

## Monorepo bileşenleri

| Paket / app | Rol | Aktif? |
|-------------|-----|--------|
| `apps/android` | Kotlin / Compose native client | **Evet — birincil UI** |
| `apps/api` | Fastify backend, Smart Feed + Smart Digest | **Evet — birincil API** |
| `apps/mobile` | Expo React Native MVP | Legacy / ikincil |
| `packages/news-core` | Policy, skorlama, AI reader contract | Paylaşılan |
| `packages/connectors` | TRT RSS, GDELT, sosyal adapter sınırları | Paylaşılan (Radar hattı) |

## Smart Feed pipeline (aktif)

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────────┐
│ RSS Ingest  │───▶│ Cluster      │───▶│ Publish     │───▶│ Smart Digest   │
│ (metadata)  │    │ Engine       │    │ Gate        │    │ (backend-only) │
└─────────────┘    └──────────────┘    └─────────────┘    └───────┬────────┘
                                                                   │
                    GET /api/v1/smart-feed ◀───────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Android Feed UI │
                    │ (Compose)       │
                    └─────────────────┘
```

### Publish gate kararları

| Karar | Digest? | Android ana akış? |
|-------|---------|-------------------|
| `PUBLISH_MAIN` | Evet (mock/external/mock-disabled) | Evet |
| `WATCHLIST_ONLY` | Hayır | Watchlist preview |
| `RAW_ONLY` | Hayır | Raw preview |
| `FILTERED_OUT` | Hayır | Gizli |

External digest yalnızca `PUBLISH_MAIN` + eligibility + onay + budget koşullarında.

## Smart Digest contract

Response alanı (`smartDigest`):

```ts
{
  status: "DISABLED" | "MOCKED" | "CACHED" | "GENERATED" | "FAILED";
  summary: string | null;
  keyPoints: string[];
  whyItMatters: string | null;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  sourcePolicy: "METADATA_ONLY";
  modelProvider: "mock" | "disabled" | "external";
  cacheKey: string;
  generatedAt: string | null;
  errorCode?: string;
}
```

**Input sınırı:** title, shortDescription, sourceName, originalUrl, publishedAt, cluster metadata — **fullText/body/scrapedText yasak**.

## Guardrail katmanları (v0.6.3+)

| Katman | Açıklama |
|--------|----------|
| Operator approval | `OPERATOR_APPROVED_REAL_LLM_DIGEST=1` yoksa → `OPERATOR_APPROVAL_REQUIRED` |
| External enabled | `LLM_DIGEST_EXTERNAL_ENABLED=0` default |
| Budget guard | Günlük 5 / request 1; dosya: `.cache/smart-digest-budget/YYYY-MM-DD.json` |
| Cache zorunlu | `LLM_DIGEST_REQUIRE_CACHE=1` |
| Output guard | Summary truncate, max 3 keyPoints |
| Secret guard | API key loglanmaz; status endpoint key değeri döndürmez |

## Operatör görünürlüğü (v0.6.4)

```
GET /api/v1/smart-digest/status   — read-only dashboard
pnpm smart-digest:status          — CLI evidence (secret basmaz)
```

Runbook: [docs/ops/v0.6.4-real-provider-pilot-runbook.md](../ops/v0.6.4-real-provider-pilot-runbook.md)

## Legal / source policy

1. Tam makale metni depolanmaz ve iletilmez
2. Yalnızca RSS/metadata alanları kullanılır
3. LLM API key yalnızca backend `.env` — Android'e gömülmez
4. Scraping yok
5. Attribution: `sourceName` + `originalUrl` korunur

Detay: [smart-feed-api-contract-v0.md](./smart-feed-api-contract-v0.md)

**SSOT hazırlık (implementation öncesi):** [source-registry-ssot-v0-plan.md](./source-registry-ssot-v0-plan.md) — API/Android kaynak drift, migration fazları, acceptance criteria. PR #41 `title-link-only-payload-policy` geçici response sanitize; aktif legal guard değil.

## Legacy Expo / Radar hattı

**Expo (`apps/mobile`):** Erken MVP — `/api/events`, flash/finance/nearby sekmeleri, sosyal sinyal kartları. Aktif Smart Feed geliştirmesi burada yapılmaz.

**Radar API (`/api/events`, `/api/signals`, …):** Connector tabanlı eski akış; Smart Feed ile aynı `apps/api` sürecinde yaşar ama birincil ürün yolu değildir.

## Real provider pilot

**Henüz yapılmadı.** Başlatmak için:

1. Runbook oku
2. Status endpoint ile gate kontrolü
3. Açık operatör onay cümlesi
4. Local `.env` API key (commit edilmez)
5. Tek çağrı, cache kanıtı, budget evidence

Onay cümlesi:

```text
v0.6.3 gerçek provider pilotu için 1 çağrıya onay veriyorum
```

## İlgili dokümanlar

- [Project current state](../project/current-state.md)
- [Smart Feed API contract v0](./smart-feed-api-contract-v0.md)
- [Evidence index](../../evidence/README.md)
