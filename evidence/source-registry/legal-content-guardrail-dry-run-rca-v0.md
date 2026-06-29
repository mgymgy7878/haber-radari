# Legal Content Guardrail Dry-Run RCA v0

## Amaç

PR #29 smoke sonucundaki `wouldStripFieldCount=7` (item başına) alanların hangi item/source/field kaynaklı olduğunu netleştirmek. Aktif strip/binding yok; publish davranışı değişmedi.

## Kapsam

- RCA helper: `apps/api/src/source-registry/legal-content-guardrail-rca.ts`
- Dry-run decisions zenginleştirildi: `visibleInItemPayload`, `forbiddenFieldDetails`, `fieldLocation`, `recommendedFix`
- `debugStats.legalContentGuardrailDryRun` altında `rcaVersion=v0`, `overallRecommendedFix`
- `items[]`, `publishedCount`, PublishGate, rss-ingest **değişmedi**
- Android/APK/UI **değişmedi**

## PR #29 Baseline

| Metrik | PR #29 smoke | Bu RCA smoke |
|--------|--------------|--------------|
| `evaluatedItemCount` | 1 | 2 (feed büyüdü) |
| `wouldStripFieldCount` | 7 | 14 (= 2 item × 7) |
| `publishBehaviorChanged` | false | false |

Item başına strip sayısı **7** olarak sabit kaldı.

## RCA Tablosu (smoke decisions)

| itemId | sourceName | sourceId | legalMode | wouldStrip | forbiddenFieldsPresent | fieldLocation | userVisible | recommendedFix |
|--------|------------|----------|-----------|------------|------------------------|---------------|-------------|----------------|
| *(smoke)* | Anadolu Ajansı | aa_guncel | DISABLED | true | summary, description | item_payload | title, summary, shortDescription, sourceName, canonicalUrl, publishedAt | source_registry_mode_review |

## wouldStripFieldCount=7 — Alan Listesi (item başına)

| # | Alan | forbidden? | item payload yolu | kullanıcıya görünür? | konum |
|---|------|------------|-------------------|----------------------|-------|
| 1 | `title` | hayır | `aiTitle` | evet | item_payload |
| 2 | `summary` | evet | `aiSummary` | evet | item_payload |
| 3 | `shortDescription` | hayır | `aiSummary` | evet | item_payload |
| 4 | `description` | evet | audit-derived (`aiSummary` kopyası) | hayır (duplicate) | internal_only |
| 5 | `sourceName` | hayır | `sources[0].sourceName` | evet | source_payload |
| 6 | `canonicalUrl` | hayır | `sources[0].url` | evet | source_payload |
| 7 | `publishedAt` | hayır | `sources[0].publishedAt` | evet | source_payload |

## Kök Neden

1. **Hangi item?** Published smart-feed item(ları) — smoke'ta Anadolu Ajansı kaynaklı cluster.
2. **Hangi source?** `aa_guncel` / Anadolu Ajansı.
3. **Hangi legalMode?** `DISABLED` (`publishEligible=false`, lisans yok).
4. **Neden strip?** DISABLED modda `stripDisallowedFieldsForSource()` boş döner → tüm audit alanları strip edilir.
5. **Registry vs runtime drift:** Registry DISABLED iken `rss-sources.ts` hâlâ AA'yı ingest ediyor ve publish gate registry legalMode'u kontrol etmiyor.

## Kullanıcıya Görünürlük

- **6/7 alan kullanıcıya görünür** (`description` yalnızca audit duplicate).
- Android `FeedScreen` / `AiCuratedDetailScreen`: `aiTitle`, `aiSummary` doğrudan render ediliyor.
- Aktif guard binding yapılırsa `aiSummary` ve muhtemelen `aiTitle` kaybolur → **UI etkilenir, APK güncellemesi gerekebilir**.

## Aktif Guard Binding Yapılırsa Ne Değişir?

- `items[].aiTitle`, `items[].aiSummary` strip edilebilir (DISABLED → tüm alanlar).
- `sources[]` metadata da strip listesinde.
- API response shape değişir; Android boş başlık/özet gösterebilir.

## Sonraki PR Kararı

**Öneri: B) önce source normalization cleanup + D) kaynak legalMode kararı**

| Seçenek | Değerlendirme |
|---------|---------------|
| A) active guard binding | **Güvenli değil** — 6 user-visible alan strip edilir |
| B) normalize cleanup | **Öncelikli** — DISABLED/NEEDS_REVIEW kaynaklardan `aiSummary` taşınmamalı |
| C) DTO/debug ayrımı | Kısmen — `description` zaten audit duplicate; asıl sorun `aiSummary` |
| D) source_registry_mode_review | **Öncelikli** — AA DISABLED ama publish ediliyor; publish gate/registry bağlantısı gerekli |

`overallRecommendedFix`: **source_registry_mode_review**

Aktif guard binding, normalize + publish eligibility düzeltmesinden **sonra** değerlendirilmeli.

## Test Sonuçları

| Suite | Sonuç |
|-------|-------|
| `pnpm vitest run src/source-registry` | PASS |
| `pnpm vitest run src` | 162/162 PASS |

## Aktif Strip Yapılmadı

- `stripDisallowedFieldsForSource()` yalnızca dry-run hesabında
- `items[]` payload değişmedi
- `publishBehaviorChanged=false`

## Evidence

- `legal-content-guardrail-dry-run-rca-smoke-v0.json`
- PR #29 baseline: `legal-content-guardrail-dry-run-smoke-v0.json`
