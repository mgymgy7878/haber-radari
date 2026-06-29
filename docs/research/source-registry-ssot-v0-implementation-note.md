# Source Registry SSOT v0 — Implementation Note

**Durum:** Read-only adapter (main’de)  
**Üst plan:** [source-registry-ssot-v0-preimplementation.md](./source-registry-ssot-v0-preimplementation.md)  
**Tarih:** 2026-06-28

## Ne eklendi?

| Artefakt | Yol | Rol |
|----------|-----|-----|
| SSOT JSON | `apps/api/src/source-registry/source-registry-v0.json` | Tek kaynak registry dosyası |
| Loader | `source-registry-loader.ts` | `loadSourceRegistryV0()` — read-only |
| Validator | `source-registry-validator.ts` | Unique `sourceId`, legalMode contract |
| Field guard | `legal-field-guard.ts` | `stripDisallowedFieldsForSource`, `assertNoForbiddenFields` |

## Ne bağlanmadı?

- `apps/api/src/config/rss-sources.ts`
- `apps/api/src/services/rss-ingest.ts`
- `apps/api/src/engine/publish-gate.ts`
- `apps/api/src/routes/smart-feed.ts`
- Android / APK / UI

## Sonraki adımlar

1. **Legal Content Guardrail runtime binding** — ingest pipeline’da field strip (feature flag ile)
2. **Registry adapter → ingest kademeli bağlama** — `rss-sources.ts` yerine SSOT okuma (migration PR)
3. Android registry migration — ayrı PR (APK gerekir)

## Test

```powershell
cd apps/api
pnpm vitest run src/source-registry
```
