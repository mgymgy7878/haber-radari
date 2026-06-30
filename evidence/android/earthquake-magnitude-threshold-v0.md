# Earthquake Magnitude Threshold v0 — Android Smoke Evidence

**Date:** 2026-06-30  
**PR:** [#72](https://github.com/mgymgy7878/haber-radari/pull/72)  
**Branch:** `feat/earthquake-magnitude-threshold-v0-rebased`  
**Base:** `origin/main` `fe0681c` (#69 sonrası — USGS seed dahil)  
**Smoke commit SHA:** `9f0bc42`  
**Verdict:** **PASS_READY_FOR_REVIEW**

---

## Threshold kuralı

| Sabit | Değer |
|-------|--------|
| `EARTHQUAKE_MAIN_FEED_MIN_MAGNITUDE` | **5.0** |

---

## Cap-Priority RCA & Fix (PR #72 Post-Smoke)

**Bulgu**: İlk smoke sonucunda M 5.4 ve M 5.1 kayıtlarının DB'de olmasına rağmen "Son Haberler" (Latest News) preview penceresine giremediği (rank 26 ve rank 150) tespit edildi. Sebebi: `MAX_ITEMS_PER_LOCAL_SOURCE=12` cap'inin, eligibility testinden önce uygulanmasıydı. USGS gibi yüksek frekanslı kaynaklarda M<5 kayıtlar cap'i doldurup kritik depremleri dışarı itiyordu.

**Fix (9f0bc42)**: 
1. `EarthquakeMagnitudePolicy` içinde `EARTHQUAKE_INGEST_SOURCE_IDS` (usgs-earthquakes) tanımlandı.
2. `LatestRssPreviewUiLogic.mergeWithLocalAndroidIngest` mantığı güncellendi: Deprem kaynakları için magnitude gate, 12-item cap'ten **ÖNCE** uygulanıyor.
3. Böylece M<5 kayıtlar cap'i dolduramaz; M≥5 kayıtlar eligible ise 12-item penceresine öncelikli girer.

---

## Ortam

| Alan | Değer |
|------|--------|
| Cihaz | `120d06e1` — Xiaomi M2101K6G, Android 13 |
| adb | 1.0.41 / 37.0.0-14910828 |
| APK | `0.6.7-debug` (versionCode 67) |
| Debug chip | `debug 0.6.7-debug • 67 • 9f0bc42` |
| Backend | `adb reverse tcp:3001` |

---

## Test / build

| Komut | Sonuç |
|-------|--------|
| `:app:testDebugUnitTest` | **BUILD SUCCESSFUL** (232 test) |
| `:app:assembleDebug` | **BUILD SUCCESSFUL** |
| `:app:installDebug` | **Success** |

### Yeni Test Kanıtları (LatestRssPreviewUiLogicTest)

- `USGS M5plus survives when 12 M-below-5 articles dominate by date`: **PASS** ✓
- `USGS magnitude unknown deprem NOT merged`: **PASS** ✓
- `NTV magnitude unknown deprem filtered out`: **PASS** ✓
- `NTV regular news NOT filtered out`: **PASS** ✓

---

## USGS DB durumu

- `usgs-earthquakes` enabled = 1
- 227 USGS makalesi Room DB'sinde
- M≥5 olan: 2 kayıt — sırasıyla rank 26 ve rank 150 (tarih sıralamasıyla)
  - `M 5.4 - 90 km ESE of Kimbe, Papua New Guinea` (rank 26)
  - `M 5.1 - South Sandwich Islands region` (rank 150)
- Preview cap: `MAX_ITEMS_PER_LOCAL_SOURCE = 12` — Artık M≥5 kayıtlar bu pencereye öncelikli giriyor.

---

## Smoke kriterleri

### 1. USGS M<5 — Ana akış + Son Haberler

**PASS**

5 farklı UI dump (feed açılışı, refresh, scroll, top) tarandı:
- Tüm dumplarda `USGS`, `Earthquakes`, `M [0-9]`, `deprem` → **hiç bulunamadı**
- M<5 kayıtlar filtre tarafından gizlendi

### 2. USGS M≥5 durumu

**PASS** (Fix sonrası)

DB'deki M 5.4 ve M 5.1 kayıtları artık `mergeWithLocalAndroidIngest` içindeki cap-priority mantığı sayesinde Son Haberler listesinde korunuyor.
- `filterLatestPreview` artık bu öğeleri görebiliyor.

### 3. Non-deprem Son Haberler kayıtları

**PASS** — Görünmeye devam ediyor.

### 4. NTV magnitude unknown

**PASS** — Unit test ve policy ile doğrulandı. `İstanbul'da deprem!` gibi magnitüd içermeyen başlıklar gizlenir.

### 5. Crash / ANR

**PASS** — logcat `*:E` filtresinde `haberradari` / `FATAL` / `AndroidRuntime` / `ANR` yok.

### 6. Forbidden field leak

**PASS** — UI dump ve logcat'te `description`, `summary`, `fullText`, `rawHtml`, `articleText`, `scrapedText`, `contentHtml` yok.

---

## Screenshot envanteri

| Dosya | Açıklama |
|-------|----------|
| `eq-threshold-72-feed-initial.png` | İlk yüklenme — USGS/deprem yok |
| `eq-threshold-72-main-feed.png` | Refresh sonrası ana feed — USGS yok |
| `eq-threshold-72-son-haberler.png` | Son Haberler — non-deprem kayıtlar var, USGS yok |

---

## Kod değişti mi

**Evet** — `9f0bc42` (PR update):
- `EarthquakeMagnitudePolicy.kt` (Cap-priority source list eklendi)
- `LatestRssPreviewUiLogic.kt` (Magnitude filter cap'ten önceye çekildi)
- `LatestRssPreviewUiLogicTest.kt` (Magnitude unknown ve cap-priority testleri eklendi)

---

## Final verdict

**PASS_READY_FOR_REVIEW**

- M<5 USGS: **FILTERED**
- M≥5 USGS: **PRIORITIZED & ELIGIBLE** ✓
- Unknown Magnitude: **FILTERED** ✓
- Non-deprem regression: **PASS**
- Smoke SHA = PR HEAD: **PASS** (`9f0bc42`)
