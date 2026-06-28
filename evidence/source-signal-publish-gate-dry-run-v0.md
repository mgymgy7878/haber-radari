# Source Signal Publish-Gate Dry-Run v0

**Date:** 2026-06-28  
**Status:** ✅ PASS (dry-run only)  
**Context:** PR #25 — gerçek publish davranışı değiştirilmedi

---

## Amaç

Kaynak sinyali kuralları **aktif olsaydı** hangi haberlere fren koyulurdu simülasyonu. `debugStats.sourceSignalPublishDryRun` altında read-only dry-run çıktısı; `items` / `publishedCount` değişmez.

---

## Dry-run kuralları (v0)

| Koşul | Dry-run aksiyon |
|-------|-----------------|
| Bilinmeyen/düşük profil + tek kaynak + kritik iddia sinyali | `wouldBlockCritical` |
| LOW/UNKNOWN band + metadata eksikliği + tek kaynak + mevcut `PUBLISH_MAIN` | `wouldDemoteMain` |
| Resmi/yüksek profil + çoklu kaynak teyidi | `noAction` |
| `sourceSignal` yok | `insufficientSignal` |
| Diğer | `noAction` |

Dil: `wouldBlock`, `wouldDemote`, `dryRunOnly`, `insufficientSignal` — mutlak doğruluk/yalan iddiası yok.

---

## debugStats alanları

```json
{
  "sourceSignalPublishDryRun": {
    "version": "v0",
    "readOnly": true,
    "disclaimer": "...",
    "evaluatedCount": 51,
    "wouldBlockCount": 1,
    "wouldDemoteCount": 0,
    "decisions": [
      {
        "clusterId": "...",
        "actualPublishDecision": "PUBLISH_MAIN",
        "dryRunAction": "wouldBlockCritical",
        "wouldBlockCritical": true,
        "wouldDemoteMain": false,
        "dryRunOnly": true,
        "reasons": ["..."],
        "sourceSignalBand": "UNKNOWN",
        "uniqueSourceCount": 1
      }
    ]
  }
}
```

---

## Test sonuçları

| Suite | Sonuç |
|-------|-------|
| API vitest | **113/113 PASS** |
| API build | **PASS** |
| Classification regression | **korundu** |
| Source scoring + signal mapper | **korundu** |

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

---

## Değişen dosyalar

- `apps/api/src/source-scoring/source-signal-publish-dry-run.ts`
- `apps/api/src/source-scoring/source-signal-publish-dry-run.test.ts`
- `apps/api/src/routes/smart-feed.ts`
- `apps/api/src/routes/smart-feed.test.ts`
