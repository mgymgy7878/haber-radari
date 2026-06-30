# PR #69 — Global Official Feed Seed v0 — Android Smoke Evidence

**Date:** 2026-06-30  
**PR:** [#69](https://github.com/mgymgy7878/haber-radari/pull/69)  
**Branch:** `feat/global-official-feed-seed-v0` @ `b13a029` (+ local preview merge patch, uncommitted)  
**Verdict:** **SMOKE_PARTIAL_PASS** → merge için hâlâ `NOT_READY_SMOKE_MISSING` (Fed/EU açık kart kanıtı eksik)

---

## RCA özeti

| Soru | Yanıt |
|------|--------|
| USGS nereye yazılıyor? | Room `articles` — `NewsRepository.refreshFeeds()` |
| Son Haberler nereden geliyordu? | Yalnızca backend `latestRssPreview` (`RemoteAiCuratedFeedRepository`) |
| `localArticlesFallback` kullanılıyor mu? | **Hayır** — parametre geçiliyordu ama remote repo yok sayıyordu |
| USGS neden UI'da yoktu? | Android-local global official ingest ile backend preview arasında **köprü yoktu** |

### Minimal düzeltme

`LatestRssPreviewUiLogic.mergeWithLocalAndroidIngest()` — Fed/EU/USGS local kayıtlarını backend preview ile birleştirir; `shortDescription` her zaman `null` (metadata-only).

Entegrasyon: `FeedViewModel` — fetch/cache sonrası merge.

UX copy: Son Haberler alt metni → "ham RSS kayıtları (başlık-link önizlemesi)".

---

## Smoke verdict

| # | Kriter | Sonuç |
|---|--------|-------|
| A | Kaynak Yönetimi (6 kaynak; Fed/EU kapalı; USGS açık; BBC inceleme) | **PASS** |
| B | USGS feed kartı (title/date/source/link; description yok) | **PASS** (patch sonrası) |
| C | Fed/EU açıldıktan sonra kart (yalnızca metadata) | **NOT RUN** (toggle otomasyonu DB'de enable doğrulamadı) |
| D–F | Crash / ANR / forbidden leak | **PASS** |

---

## Ortam

| Alan | Değer |
|------|--------|
| Cihaz | `120d06e1` — M2101K6G (Android 13) |
| installDebug | **SUCCESS** |
| Backend | `adb reverse` + health 200 |

---

## USGS UI kartı (PASS)

UIAutomator (patch sonrası):

```text
USGS Earthquakes | 12 dk önce | RSS
M 0.6 - 15 km SSW of Searles Valley, CA
(description/body TextView yok)
```

**Screenshot:** `evidence/android/screenshots/global-official-feed-seed-v0-usgs-feed-card.png`

Yeni disclaimer metni görünür: "ham kayıtlar (başlık-link önizlemesi)".

---

## Kaynak Yönetimi (PASS)

**Screenshot:** `evidence/android/screenshots/global-official-feed-seed-v0-source-management.png`

---

## Fed/EU açık kart (NOT RUN)

- Compose Switch tap otomasyonu `enabled=1` yazmadı (DB: `eu-commission-press=0`, `fed-press=0`).
- Kod köprüsü Fed/EU için hazır (`LOCAL_ANDROID_INGEST_PREVIEW_SOURCE_IDS`); manuel toggle + refresh ile tekrar smoke gerekir.

---

## Test

```text
./gradlew :app:testDebugUnitTest  → BUILD SUCCESSFUL (206 tests, +5 LatestRssPreviewUiLogicTest)
./gradlew :app:assembleDebug      → BUILD SUCCESSFUL
./gradlew :app:installDebug       → SUCCESS (M2101K6G)
```

---

## Logcat

| Kontrol | Sonuç |
|---------|--------|
| FATAL EXCEPTION (com.haberradari) | Yok |
| ANR | Yok |
| forbidden field leak | Yok |

**Dosya:** `evidence/android/global-official-feed-seed-smoke-v0-logcat.txt`

---

## Kod değişikliği (bu oturum)

| Dosya | Değişiklik |
|-------|------------|
| `LatestRssPreviewUiLogic.kt` | **Yeni** — local global official → Son Haberler merge |
| `LatestRssPreviewUiLogicTest.kt` | **Yeni** — 5 unit test |
| `FeedViewModel.kt` | merge entegrasyonu |
| `FeedScreen.kt` | UX copy güvenli dil |

**PR body:** Güncellenmedi — Fed/EU açık kart kanıtı eksik → `NOT_READY_SMOKE_MISSING`.

---

## Merge önerisi

**HAYIR** — USGS UI kanıtı tamam; Fed/EU toggle sonrası kart screenshot'ı hâlâ gerekli.

Sonraki adım: Manuel EU veya Fed toggle → refresh → feed kart screenshot + logcat → `READY_AFTER_SMOKE`.
