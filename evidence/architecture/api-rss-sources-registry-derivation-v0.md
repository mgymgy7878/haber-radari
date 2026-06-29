# Evidence — API RSS sources registry derivation v0

**Tarih:** 2026-06-29  
**Branch:** `feat/api-rss-sources-registry-derivation-v0`  
**Plan:** [source-registry-ssot-v0-plan.md](../../docs/architecture/source-registry-ssot-v0-plan.md)

## Amaç

`rss-sources.ts` çıktısı Source Registry SSOT’tan türetilir; **mevcut API parity korunur**. Registry’deki 21 kaynağın tamamı ingest’e açılmaz.

## Parity özeti

| Metrik | Değer |
|--------|-------|
| Registry toplam kaynak | 21 |
| API `RSS_SOURCES` kaynak sayısı | **4** (değişmedi) |
| Aktif ingest kaynakları | `ntv_son_dakika`, `haberturk_ekonomi` |
| Pasif kaynaklar | `aa_guncel` (DISABLED), `trt_haber` (NEEDS_REVIEW) |

## Kritik sınır

- `publishEligible` tek başına ingest açma kriteri **değil**
- `API_RSS_RUNTIME_ENABLE_V0` dondurulmuş parity matrisi kullanılır
- `RSS_METADATA_ONLY` resmi kaynaklar (AFAD, TCMB, KAP vb.) runtime listesine **girmez**

## legalMode kanıtı

| sourceId | legalMode | enabled |
|----------|-----------|---------|
| `aa_guncel` | DISABLED | false |
| `trt_haber` | NEEDS_REVIEW | false |
| `ntv_son_dakika` | TITLE_LINK_ONLY | true |
| `haberturk_ekonomi` | TITLE_LINK_ONLY | true |

PR #41 `title-link-only-payload-policy` smart-feed response sanitize — değişmedi.

## Test sonuçları

```
pnpm vitest run src/source-registry/source-registry-rss-sources.test.ts → 9/9 PASS
pnpm vitest run src → 211/211 PASS
pnpm exec tsc --noEmit → PASS
```

## API smoke

- `/health` 200
- `/api/v1/smart-feed?bypassCache=1&includeLatest=1` 200
- NTV `shortDescription` dolu: 0 (PR #41 sanitize korunuyor)

## Davranış değişmedi teyidi

| Alan | Değişti? |
|------|----------|
| `RSS_SOURCES` public shape | Hayır (parity snapshot) |
| Aktif kaynak seti | Hayır |
| smart-feed mapper | Hayır |
| Android/UI | Hayır |
| Publish gate | Açılmadı |

## B5

HTTPS cleartext hardening **OPEN** — bu PR kapsamı dışı.
