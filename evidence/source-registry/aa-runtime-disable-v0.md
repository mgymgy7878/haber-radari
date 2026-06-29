# AA Runtime Legal Disable v0

## Amaç

Registry'de `legalMode=DISABLED` olan `aa_guncel` (Anadolu Ajansı) kaynağını runtime ingest/publish hattından çıkarmak. PR #30 RCA sonucu: aktif guard binding değil, kaynak disable.

## Önceki RCA Referansı

- PR #30: `aa_guncel` DISABLED iken runtime yayınlıyordu
- `wouldStripFieldCount=7` (item başına), 6/7 alan user-visible
- `overallRecommendedFix=source_registry_mode_review`

## Yapılan Değişiklik

`apps/api/src/config/rss-sources.ts`:

- `aa_guncel.enabled = false`
- `disabledReason = registry_legal_mode_disabled_no_license`

`rss-ingest.ts` mevcut `enabled` filtresini kullanır; AA feed fetch edilmez.

## Bilinçli Publish Davranışı Değişikliği

| Metrik | PR #30 RCA (önce) | Bu smoke (sonra) |
|--------|-------------------|------------------|
| `publishedCount` | 2 | 0 |
| `items.length` | 2 | 0 |
| `aaItemsInFeed` | 2 (AA) | 0 |
| `sourceCount` (ingest) | 4 | 3 |
| `legalBlockApplied` | — | true |

Feed'in o an yalnızca AA item'ları publish etmesi nedeniyle `publishedCount` 2→0 düştü. Diğer 3 kaynak ingest ediliyor (`successfulSourceCount=3`) fakat publish gate o snapshot'ta main item üretmedi.

## AA Kaynak Durumu

| Alan | Değer |
|------|-------|
| `sourceId` | `aa_guncel` |
| Registry `legalMode` | DISABLED |
| Runtime `enabled` | false |
| `disabledReason` | registry_legal_mode_disabled_no_license |

## Test Sonuçları

| Suite | Sonuç |
|-------|-------|
| `pnpm vitest run src/source-registry` | PASS |
| `pnpm vitest run src` | 165/165 PASS |

Yeni: `apps/api/src/config/aa-runtime-legal-disable.test.ts`

## Smoke Sonuçları

- `legalBlockApplied=true`
- `publishBehaviorIntentionallyChanged=true`
- `aaItemsInFeed=0`
- `legalContentGuardrailDryRun.wouldStripItemCount=0` (AA item yok)
- `overallRecommendedFix=no_action_debug_only`

## Dokunulmayanlar

- Android/APK/UI
- `publish-gate.ts` algoritması
- Aktif legal field guard binding
- Diğer kaynakların `enabled` durumu

## Sonraki Adım

TRT/NTV/Habertürk için registry legalMode review ve normalize cleanup (TITLE_LINK_ONLY `aiSummary` politikası) ayrı PR'larda değerlendirilir.
