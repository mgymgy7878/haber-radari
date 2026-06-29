# Legal Content Guardrail Dry-Run Audit v0

## Amaç

Smart-feed/runtime payload üzerinde hangi alanların **strip edileceğini** ölçmek; aktif strip veya binding yapmadan audit verisi üretmek. Publish/output davranışı değişmez.

## Kapsam

- Yeni modül: `apps/api/src/source-registry/legal-content-guardrail-dry-run.ts`
- Smart-feed entegrasyonu: yalnızca `debugStats.legalContentGuardrailDryRun` altına read-only audit
- `items[]`, `publishedCount`, PublishGate, rss-ingest aktif davranışı **değişmedi**
- Android/APK/UI **değişmedi**

## Test Sonuçları

| Suite | Sonuç |
|-------|-------|
| `pnpm vitest run src/source-registry` | PASS |
| `pnpm vitest run src` (full API) | PASS |

Unit test kapsamı:
- TITLE_LINK_ONLY: forbidden alanlar için `wouldStrip=true`, allowed alanlar için `wouldStrip=false`
- RSS_METADATA_ONLY: fullText/rawHtml/media/caption için `wouldStrip=true`
- DISABLED / NEEDS_REVIEW: production eligible değil (`reasonCode`)
- Unmatched source: hata fırlatmaz, `sourceUnmatchedCount` artar
- Tüm `decisions[].dryRunOnly === true`, `readOnly === true`

## Smoke Sonuçları

- API: `PORT=3001`
- Endpoint: `GET /api/v1/smart-feed?bypassCache=1`
- Evidence JSON: `legal-content-guardrail-dry-run-smoke-v0.json`

| Alan | Değer |
|------|-------|
| `sourceRegistryVersion` | v0 |
| `legalContentGuardrailDryRun.readOnly` | true |
| `evaluatedItemCount` | 1 |
| `wouldStripItemCount` | 1 |
| `wouldStripFieldCount` | 7 |
| `sourceMatchedCount` | 1 |
| `sourceUnmatchedCount` | 0 |
| `publishedCount` | 1 |
| `items.length` | 1 |
| `publishBehaviorChanged` | false |
| `sourceSignalPublishDryRun.readOnly` | true |
| `sourceScoreShadow.readOnly` | true |

## Aktif Strip Yapılmadı Teyidi

- `stripDisallowedFieldsForSource()` runtime response'a uygulanmıyor
- `items[]` payload'ı dry-run nedeniyle değişmedi
- `publishedCount` ve `items.length` smoke öncesi/sonrası aynı
- Korunan dosyalarda diff yok: `publish-gate.ts`, `rss-ingest.ts`, `rss-sources.ts`, `apps/android`

## Android/APK/UI Değişmedi Teyidi

- `apps/android` dizinine dokunulmadı
- Manifest, build.gradle, package.json değişmedi

## Sonraki Adım

Dry-run audit merge sonrası: strip edilecek alan çıkarsa kaynak bazlı düzeltme; payload temizse aktif guard binding ayrı PR ile değerlendirilir.
