# TRT Runtime Legal Disable v0

## Amaç

PR #33 TRT eligibility review sonrası: registry `NEEDS_REVIEW` / `publishEligible=false` iken runtime `enabled=true` drift'ini gidermek. Review tamamlanana kadar TRT ingest/publish hattına girmesin.

## Referans

- PR #33: `evidence/source-registry/trt-eligibility-review-v0.md`
- AA model: PR #31 (`registry_legal_mode_disabled_no_license`)

## Yapılan Değişiklik

`apps/api/src/config/rss-sources.ts`:

- `trt_haber.enabled = false`
- `disabledReason = registry_needs_review_pending`

`rss-ingest.ts` mevcut `enabled` filtresini kullanır.

## Bilinçli Publish Davranışı

| Metrik | PR #33 önce | Bu PR sonra |
|--------|-------------|-------------|
| `publishedCount` | 0 | 0 |
| `items.length` | 0 | 0 |
| `trtItemsInFeed` | 0 | 0 |
| Ingest `sourceCount` | 3 | 2 |
| `legalBlockApplied` | — | true |

Görünür feed farkı yok (zaten `publishedCount=0`); ileride TRT item geldiğinde review tamamlanmadan feed'e düşmesi engellenir.

## TRT Kaynak Durumu

| Alan | Registry | Runtime (sonra) |
|------|----------|-----------------|
| `legalMode` | NEEDS_REVIEW | — |
| `publishEligible` | false | — |
| `reviewStatus` | pending | — |
| `enabled` | — | false |
| `disabledReason` | — | registry_needs_review_pending |

## Aktif Kaynaklar

- `ntv_son_dakika` — enabled
- `haberturk_ekonomi` — enabled
- `aa_guncel` — disabled (PR #31)
- `trt_haber` — disabled (bu PR)

## Test Sonuçları

| Suite | Sonuç |
|-------|-------|
| `pnpm vitest run src/source-registry` | PASS |
| `pnpm vitest run src` | 176/176 PASS |

## Dokunulmayanlar

- Android/APK/UI
- `publish-gate.ts` algoritması
- Aktif legal field guard binding
- NTV/Habertürk enabled durumu

## Sonraki Adım

Hukuk/ToS teyidi sonrası TRT için ayrı **`TITLE_LINK_ONLY` enable** PR (registry + dar runtime policy). NTV/Habertürk TITLE_LINK_ONLY backend cleanup planı devam eder.
