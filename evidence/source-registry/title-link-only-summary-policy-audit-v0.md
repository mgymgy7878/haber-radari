# TITLE_LINK_ONLY Summary Policy Audit v0

## Amaç

TRT/NTV/Habertürk kaynaklarında `aiSummary`, `summary`, `description`, `shortDescription` alanlarının kaynağını ve kullanıcıya görünürlüğünü audit etmek. Aktif cleanup yok.

## Kapsam

- Audit modül: `title-link-only-summary-policy-audit.ts`
- Smart-feed: yalnızca `debugStats.titleLinkOnlySummaryPolicyAudit` (readOnly)
- `items[]`, `publishedCount`, ingest, Android **değişmedi**

## Summary Field Lineage

| Alan | Kaynak | LLM mi? | User-visible? |
|------|--------|---------|---------------|
| `aiSummary` | `rss-ingest` → `shortDescription` (RSS `contentSnippet/content/summary`) → `smart-feed` `aiSummary=leadArticle.shortDescription` | Hayır | Evet — Android `FeedScreen`, `AiCuratedDetailScreen` |
| `summary` | Audit alias of `aiSummary` | Hayır | Evet (aynı metin) |
| `shortDescription` | RSS metadata | Hayır | Evet (`aiSummary` üzerinden) |
| `description` | Audit-derived duplicate | Hayır | Internal audit only |
| `smartDigest.summary` | LLM/metadata digest (ayrı blok) | Evet (digest) | Ayrı UI bileşeni |

## Registry / Runtime Kaynak Durumu

| Kaynak | sourceId | Registry legalMode | Runtime enabled | publishEligible |
|--------|----------|-------------------|-----------------|-----------------|
| TRT Haber | `trt_haber` | NEEDS_REVIEW | true | false |
| NTV | `ntv_son_dakika` | TITLE_LINK_ONLY | true | true |
| Habertürk | `haberturk_ekonomi` | TITLE_LINK_ONLY | true | true |

Registry `summaryPolicy`: **forbidden** (TITLE_LINK_ONLY ve NEEDS_REVIEW).

## Unit Test Kararları (synthetic items)

| sourceName | sourceId | legalMode | aiSummaryPresent | userVisible | recommendedFix |
|------------|----------|-----------|------------------|-------------|----------------|
| NTV | `ntv_son_dakika` | TITLE_LINK_ONLY | true | `aiSummary` | `android_fallback_then_cleanup` |
| Habertürk | `haberturk_ekonomi` | TITLE_LINK_ONLY | true | `aiSummary` | `android_fallback_then_cleanup` |
| TRT Haber | `trt_haber` | NEEDS_REVIEW | true | `aiSummary` | `source_registry_mode_review` |

## Android APK Beklentisi (read-only grep)

- `AiCuratedFeedDto.aiSummary`: **required** `String`
- `FeedScreen`: `item.aiSummary` doğrudan render (boş fallback yok)
- `AiCuratedDetailScreen`: `item.aiSummary` doğrudan render
- **Risk:** `aiSummary` kaldırılırsa eski APK boş/kırık kart gösterebilir

## Smoke Sonuçları

| Alan | Değer |
|------|-------|
| `publishBehaviorChanged` | false |
| `publishedCount` | 0 |
| `items.length` | 0 |
| `titleLinkOnlySummaryPolicyAudit.readOnly` | true |
| `titleLinkOnlyItemCount` | 0 |
| `userVisibleSummaryItemCount` | 0 |
| `overallRecommendedFix` | no_action |

**Not:** Post-PR #31 snapshot'ta publish edilen item yok; audit kararları unit testlerle doğrulandı. Item publish olduğunda audit `debugStats` altında dolar.

## Sonraki PR Kararı

| Seçenek | Değerlendirme |
|---------|---------------|
| A) backend DTO cleanup | Tek başına riskli — Android `aiSummary` zorunlu |
| B) **android_fallback_then_cleanup** | **Öncelikli** — önce kart fallback, sonra backend |
| C) source_registry_mode_review | TRT `NEEDS_REVIEW` için ayrıca gerekli |
| D) active guard binding | **Güvenli değil** — user-visible alan strip eder |

**overallRecommendedFix (policy):** `android_fallback_then_cleanup` + TRT için `source_registry_mode_review`

## Test Sonuçları

| Suite | Sonuç |
|-------|-------|
| `pnpm vitest run src/source-registry` | 56/56 PASS |
| `pnpm vitest run src` | 172/172 PASS |

## Aktif Cleanup Yapılmadı

- Response payload değişmedi
- Aktif guard binding yok
