# Source Signal Trust UX v0

**Date:** 2026-06-28  
**Status:** ✅ PASS (explanatory UI only + device evidence)  
**Context:** PR #24 — publish-gate davranışı değiştirilmedi  
**Branch:** `feat/source-signal-trust-ux-v0`  
**Commit:** `533f6a9`

---

## Amaç

PR #23 shadow skorlarını kullanıcıya **küçük, açıklayıcı, iddiasız** Trust UX ile göstermek. Kaynak sinyali yalnızca şeffaflık katmanı; publish kararına bağlı değil.

---

## Build marker (cihaz doğrulama)

| Alan | Değer |
|------|-------|
| `versionName` | `0.6.7-debug` |
| `versionCode` | `67` |
| Cihaz | M2101K6G (Android 13) |
| Feed debug banner | `debug 0.6.7-debug • 67 • 533f6a9` |

---

## API payload değişikliği

`debugStats.sourceScoreShadow` prod UI kontratı değil. Item ve kaynak seviyesinde UI-safe alan:

```json
{
  "sourceSignal": {
    "label": "Kaynak sinyali",
    "tierLabel": "Ajans / kaynak sağlayıcı",
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
| Feed Trust Card (`TrustEvidenceRow`) | Özet chip: `Kaynak sinyali: yüksek profil` |
| Detail Why Shown (`WhyShownSection`) | "Kaynak sinyali" satırları + disclaimer |
| Detail Sources (`SourceListItemCard`) | Kaynak altında tier + band satırı |
| `sourceSignal` yoksa | Bileşenler no-op — kırılma yok |

---

## Manuel smoke (`GET /api/v1/smart-feed?bypassCache=1`)

| Kontrol | Sonuç |
|---------|-------|
| `items[0].sourceSignal.label` | `Kaynak sinyali` ✅ |
| `items[0].sourceSignal.disclaimer` | mevcut ✅ |
| `debugStats.sourceScoreShadow.readOnly` | `true` ✅ |
| `stats.publishedCount` | `2` |
| `publish behavior changed` | **false** ✅ |

---

## Test sonuçları

| Suite | Sonuç |
|-------|-------|
| API vitest | **107/107 PASS** |
| API build (`tsc`) | **PASS** |
| Android `testDebugUnitTest` | **101/101 PASS** |
| Classification regression (12 case) | **korundu** |
| Source scoring regression | **korundu** |

---

## Screenshot listesi (cihaz)

| Dosya | Durum | İçerik |
|-------|-------|--------|
| `evidence/v0.6.7-source-signal-feed-trust.png` | ✅ | Feed kartında `Kaynak sinyali: yüksek profil` chip |
| `evidence/v0.6.7-source-signal-detail-why-shown.png` | ✅ | Why Shown + Kaynak sinyali bölümü + disclaimer |
| `evidence/v0.6.7-source-signal-detail-sources.png` | ✅ | Kaynak kartında sinyal satırı (Anadolu Ajansı) |

Cihaz kurulum: `adb reverse tcp:3001 tcp:3001`, `installDebug`, API `127.0.0.1:3001`.

---

## Publish davranışı

**publish behavior changed: false**

- `publish-gate.ts` PR diff'inde değişmedi
- `sourceSignal` yalnızca UI/açıklama; publish gate'e bağlı değil

---

## Safety flags

| Alan | Değer |
|------|-------|
| `publishBehaviorChanged` | **false** |
| `realExternalCallExecuted` (unit/API tests) | **false** |
| `realExternalCallExecuted` (manuel smoke + cihaz RSS) | **true** (yalnızca smoke/cihaz) |
| `productionApiKeyUsed` | **false** |
| `operatorApprovalUsed` | **false** |
| Scraping genişletildi | **false** |
| Tam metin kopyalama | **false** |
| Mutlak doğruluk iddiası | **false** |

**Not:** Mutlak doğruluk/yalan iddiası yoktur. Disclaimer cihazda görünür: "Bu sinyal haberin doğruluğunu tek başına garanti etmez."

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
