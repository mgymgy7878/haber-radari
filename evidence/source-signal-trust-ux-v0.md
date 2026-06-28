# Source Signal Trust UX v0

**Date:** 2026-06-28  
**Status:** ✅ PASS (explanatory UI only)  
**Context:** PR #24 — publish-gate davranışı değiştirilmedi

---

## Amaç

PR #23 shadow skorlarını kullanıcıya **küçük, açıklayıcı, iddiasız** Trust UX ile göstermek. Kaynak sinyali yalnızca şeffaflık katmanı; publish kararına bağlı değil.

---

## API payload değişikliği

`debugStats.sourceScoreShadow` prod UI kontratı değil. Item ve kaynak seviyesinde UI-safe alan:

```json
{
  "sourceSignal": {
    "label": "Kaynak sinyali",
    "tierLabel": "Bilinen medya",
    "scoreBand": "HIGH | MEDIUM | LOW | UNKNOWN",
    "reasons": ["..."],
    "disclaimer": "Bu sinyal haberin doğruluğunu tek başına garanti etmez."
  }
}
```

Her `sources[]` öğesinde isteğe bağlı `sourceSignal` (aynı şema).

Mapper: `apps/api/src/source-scoring/source-signal-mapper.ts`

---

## Android UI değişikliği

| Yer | Değişiklik |
|-----|------------|
| Feed Trust Card (`TrustEvidenceRow`) | Özet `SourceSignalChip` |
| Detail Why Shown (`WhyShownSection`) | "Kaynak sinyali" satırları + disclaimer |
| Detail Sources (`SourceListItemCard`) | Kaynak altında `SourceSignalRow` |
| `sourceSignal` yoksa | Bileşenler no-op — kırılma yok |

Sürüm: `0.6.7-debug` (versionCode 67)

---

## Test sonuçları

| Suite | Sonuç |
|-------|-------|
| API vitest | **107/107 PASS** |
| API build | **PASS** |
| Android testDebugUnitTest | **101/101 PASS** |
| Classification regression | **korundu** |
| Source scoring regression | **korundu** |

---

## Screenshot listesi

| Dosya | Durum |
|-------|-------|
| `evidence/v0.6.7-source-signal-feed-trust.png` | Manuel cihaz/emülatör |
| `evidence/v0.6.7-source-signal-detail-why-shown.png` | Manuel cihaz/emülatör |
| `evidence/v0.6.7-source-signal-detail-sources.png` | Manuel cihaz/emülatör |

---

## Publish davranışı

**publish behavior changed: false**

---

## Safety flags

| Alan | Değer |
|------|-------|
| `realExternalCallExecuted` (unit/API tests) | **false** |
| `productionApiKeyUsed` | **false** |
| `operatorApprovalUsed` | **false** |
| Scraping genişletildi | **false** |
| Tam metin kopyalama | **false** |
| Mutlak doğruluk iddiası | **false** |

**Not:** Mutlak doğruluk/yalan iddiası yoktur. Kaynak sinyali yardımcı profil bilgisidir.

---

## Değişen dosyalar

### API
- `apps/api/src/source-scoring/source-signal-mapper.ts`
- `apps/api/src/source-scoring/source-signal-mapper.test.ts`
- `apps/api/src/routes/smart-feed.ts`
- `apps/api/src/routes/smart-feed.test.ts`

### Android
- `data/model/SourceSignal.kt`
- `data/model/AiCuratedNewsItem.kt`
- `data/network/dto/AiCuratedFeedDto.kt`
- `data/network/mapper/SourceSignalMapper.kt`
- `domain/repository/RemoteAiCuratedFeedRepository.kt`
- `ui/feed/TrustTransparencyUiLogic.kt`
- `ui/feed/TrustTransparencyComponents.kt`
- `app/build.gradle.kts`
- `test/.../SourceSignalUiLogicTest.kt`
