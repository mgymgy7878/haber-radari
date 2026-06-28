# Classification Regression Fixture Pack v0

**Date:** 2026-06-28  
**Status:** ✅ PASS  
**Context:** PR #21 merge sonrası substring false-positive regression kalkanı

---

## Amaç

`turkish-text-match`, `feed-category`, `publish-gate` davranışlarını sabit JSON fixture üzerinden test etmek. `kazandı`, `Balıkesir`, `Büyük Britanyalı`, `Formula 1` gibi tuzaklar PR’a girmeden yakalanır.

---

## Dosyalar

| Dosya | Rol |
|-------|-----|
| `apps/api/src/classification/fixtures/classification-regression-cases.json` | 12 sabit case |
| `apps/api/src/classification/classification-regression.test.ts` | Fixture-driven regression runner |
| `apps/api/src/engine/turkish-text-match.ts` | `ralli` spor token (fixture gap kapatma) |

---

## Fixture case listesi (12)

| id | Beklenti |
|----|----------|
| `win-kazandi` | kazandı → kaza/afet yok |
| `win-kazanan` | kazanan → kaza/afet yok |
| `win-kazanmak` | kazanmak → kaza/afet yok |
| `real-trafik-kazasi` | trafik kazası → Afet, kritik ana akış aday |
| `balikesir-deprem` | Afet / Deprem |
| `balikesir-alone` | balık/çevre false-positive yok |
| `real-balik-context` | Çevre / Halk Sağlığı |
| `formula1-not-afet` | Spor / Motor sporları; ana akışta Afet yok |
| `rally-kazasi-sport-context` | spor bağlamında kritik ana akış yok |
| `buyuk-britanyali-not-critical` | büyük/kritik şiddet yok |
| `real-itfaiye-kaza` | gerçek kaza → Afet |
| `deprem-magnitude-critical` | deprem şiddeti → Afet / Deprem + kritik publish |

---

## Test komutları

```powershell
cd apps/api
if (Test-Path dist) { Remove-Item -Recurse -Force dist }
pnpm.cmd vitest run src
pnpm.cmd build
```

```powershell
cd apps/android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME="C:\Users\mscor\AppData\Local\Android\Sdk"
.\gradlew.bat testDebugUnitTest
```

---

## Sonuçlar

| Suite | Sonuç |
|-------|-------|
| API vitest | **85/85 PASS** (73 mevcut + 12 fixture) |
| Android testDebugUnitTest | **96/96 PASS** (değişiklik yok) |

---

## Güvenlik

| Alan | Değer |
|------|-------|
| `realExternalCallExecuted` | **false** |
| `productionApiKeyUsed` | **false** |
| `operatorApprovalUsed` | **false** |

Network, gerçek API, production key kullanılmadı.
