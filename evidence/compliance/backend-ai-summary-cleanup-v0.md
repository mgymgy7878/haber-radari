# Backend aiSummary cleanup v0 — evidence

**Branch:** `fix/backend-title-link-ai-summary-cleanup-v0`  
**Date:** 2026-06-29  
**Scope:** TITLE_LINK_ONLY kaynaklarda (NTV, Habertürk) user-visible özet alanlarının API response’tan suppress edilmesi.

## Policy

- `apps/api/src/source-registry/title-link-only-payload-policy.ts`
- Source Registry SSOT `legalMode === 'TITLE_LINK_ONLY'` okunur.
- **Geçici backend cleanup:** Aktif legal guard binding değil; `rss-ingest` iç verisi değişmez, yalnızca `smart-feed` response sanitize edilir.
- Android fallback PR #36 main’de; boş summary cihazda güvenli karşılanır.

## Suppressed fields

| Response path | TITLE_LINK_ONLY davranışı |
|---------------|---------------------------|
| `publishedItems[].aiSummary` | `""` |
| `latestRssPreview[].shortDescription` | `""` |
| `rawPreview[].shortDescription` | `""` |

## Unit tests

```
pnpm vitest run src/source-registry/title-link-only-payload-policy.test.ts src/routes/smart-feed.test.ts
pnpm vitest run src
```

- Policy tests: 7/7 PASS  
- smart-feed tests: güncellendi (NTV mock → boş `aiSummary`, audit `userVisibleSummaryItemCount === 0`)  
- Full `src` suite: **184/184 PASS**

## API smoke (curl)

Browser UI yok; API smoke curl ile doğrulandı.

| Check | Result |
|-------|--------|
| `GET /health` | 200 |
| `GET /api/v1/smart-feed?bypassCache=1&includeLatest=1` | 200 |

Örnek excerpt: `evidence/compliance/backend-ai-summary-cleanup-v0-smoke.json`

- NTV (`sourceNames: ["NTV"]`): `shortDescription: ""`
- Habertürk (`sourceNames: ["Habertürk"]`): `shortDescription: ""`
- Forbidden field scan (`body`, `fullText`, `contentHtml`, `rawHtml`, `articleText`, `scrapedText`, `image`, `video`, `audio`, `caption`): **yok**

## Android device smoke

- Device: `120d06e1` (M2101K6G)
- `adb reverse tcp:3001 tcp:3001`
- Mevcut debug APK; Android kodu değişmedi, rebuild yok.
- Feed açıldı, crash yok; NTV/Habertürk kartlarında başlık + link var, dolu özet metni yok (UI dump: `backend-ai-summary-cleanup-device-feed.xml`).
- Otomatik detail navigasyonu bu smoke’ta tetiklenmedi; boş summary fallback PR #36 unit testleri + policy testleri ile kapsandı.

## Out of scope (unchanged)

- Android / Kotlin / Gradle / Manifest
- HTTPS cleartext hardening (B5 OPEN)
- LLM, scraping, full text alanları
- Source Registry SSOT genişletmesi
