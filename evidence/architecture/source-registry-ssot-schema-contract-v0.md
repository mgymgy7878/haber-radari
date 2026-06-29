# Evidence — Source Registry SSOT schema + contract v0

**Tarih:** 2026-06-29  
**Branch:** `feat/source-registry-ssot-schema-contract-v0`  
**Plan:** [docs/architecture/source-registry-ssot-v0-plan.md](../../docs/architecture/source-registry-ssot-v0-plan.md)

## Amaç

SSOT implementation Aşama 1: merkezi schema, fixture loader ve contract testleri. **Runtime davranışı değişmedi.**

## Yeni / güncellenen modüller

| Dosya | Rol |
|-------|-----|
| `source-registry-schema.ts` | LEGAL_MODES, PRODUCTION_FORBIDDEN_FIELDS, zorunlu alan listesi |
| `source-registry-fixtures.ts` | Contract + production fixture loader, legalMode özeti |
| `source-registry-ssot-contract.test.ts` | Kapsamlı SSOT v0 contract testleri |
| `source-registry-contract.ts` | RSS_METADATA_ONLY, licensed, forbidden overlap kuralları |
| `source-registry-v0.json` | SSOT fixture — zorunlu alanlar + genişletilmiş forbidden listesi |

## Schema zorunlu alanlar

`sourceId`, `sourceName`, `sourceType`, `baseDomain`, `legalMode`, `authorityTier`, `allowedFields`, `forbiddenFields`, `reviewStatus`, `publishEligible`, `licenseStatus`, `notes`, `lastReviewedAt`

## Production fixture özeti

| Metrik | Değer |
|--------|-------|
| Kaynak sayısı | **21** |
| DISABLED | 2 |
| NEEDS_REVIEW | 4 |
| TITLE_LINK_ONLY | 4 |
| RSS_METADATA_ONLY | 11 |
| LICENSED | 0 |

NTV/Habertürk (`ntv_son_dakika`, `haberturk_ekonomi`, `ntv_turkiye`, `haberturk`): `TITLE_LINK_ONLY`, `aiSummary`/`summary` forbidden.

## Test sonuçları

```
pnpm vitest run src/source-registry  → 82/82 PASS
pnpm vitest run src                  → 202/202 PASS
pnpm exec tsc --noEmit               → PASS
```

## Davranış değişmedi teyidi

| Alan | Değişti? |
|------|----------|
| `rss-sources.ts` / ingest | Hayır |
| `smart-feed.ts` mapper | Hayır |
| Publish gate | Hayır (açılmadı) |
| Android seed/UI | Hayır |
| Manifest/Gradle/XML | Hayır |

## PR #41 notu

`title-link-only-payload-policy` hâlâ **geçici response sanitize**; aktif legal guard değil. Resolver entegrasyonu sonraki PR.

## B5

HTTPS cleartext hardening **OPEN** — bu PR kapsamı dışı.
