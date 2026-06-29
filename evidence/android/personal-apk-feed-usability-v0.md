# Personal APK Feed Usability v0

**Branch:** `feat/personal-apk-feed-usability-v0`  
**PR title:** `feat: improve personal apk feed usability v0`  
**Date:** 2026-06-29  
**Play/KVKK/B5:** Dokunulmadı — bireysel kullanım UX odaklı

---

## Özet

Feed ekranı bireysel günlük kullanım için durum bilgisi, empty/error ayrımı ve haber kartı link dili iyileştirildi. Legal-safe metadata-only çizgi korundu.

---

## Değişen dosyalar

| Dosya | Değişiklik |
|-------|------------|
| `FeedUsabilityUiLogic.kt` | **Yeni** — durum/empty/time format mantığı |
| `FeedUsabilityUiLogicTest.kt` | **Yeni** — unit testler |
| `FeedViewModel.kt` | `lastUpdatedAt`, kaynak sayıları, `observeSources()` |
| `FeedScreen.kt` | `FeedStatusBar`, empty/error UX, RSS kart tarihi |
| `ArticleCard.kt` | Kaynak/tarih/orijinal link dili |

---

## UI/UX değişiklikleri

| Özellik | Açıklama |
|---------|----------|
| **FeedStatusBar** | Son güncelleme, bağlantı/önbellek durumu, aktif kaynak sayısı, kaynak sinyali disclaimer |
| **Empty state** | Aktif kaynak yok vs haber yok ayrımı (`PersonalFeedEmptyState`) |
| **Error banner** | Hata + “Tekrar dene” + önbellek mesajı |
| **Offline setup** | Aktif kaynak yok senaryosu için ayrı metin |
| **LatestRssItemCard** | Kaynak adı, yayın zamanı, “Orijinal kaynağa git” |
| **ArticleCard** | `original_link` string, göreceli tarih |
| **Curated kart** | “Kaynak profilini incele” (doğrulama dili yok) |

---

## Legal-safe çizgi

| Kontrol | Sonuç |
|---------|--------|
| Tam metin / body / scraped alanları | **Eklenmedi** |
| Görsel / video / caption | **Eklenmedi** |
| Yanıltıcı doğrulama dili | **Yok** — Trust UX testleri geçer |
| Metadata-only (title, source, date, link) | **Korundu** |
| RSS description | Yalnızca mevcut `legalMode` izinli alanlar |

---

## Forbidden field teyidi

`ui/feed` grep: `rawHtml`, `articleText`, `scrapedText`, `fullText`, `contentHtml` — **UI değişikliklerinde eklenmedi**.

---

## Test sonuçları

| Suite | Sonuç |
|-------|-------|
| `:app:testDebugUnitTest` | **PASS** (148 test) |
| `FeedUsabilityUiLogicTest` | **PASS** |
| `FeedDisplayPhaseTest` | **PASS** (regression) |
| `TrustUxLanguageTest` | **PASS** |
| `:app:assembleDebug` | **PASS** |

---

## Cihaz smoke

| Adım | Sonuç |
|------|--------|
| `adb` | **PATH’te yok** — cihaz smoke atlandı |

---

## Manifest / Gradle / XML

| Alan | Değişti mi? |
|------|-------------|
| AndroidManifest | **Hayır** |
| Gradle | **Hayır** |
| network security / XML resources | **Hayır** (mevcut `strings.xml` kullanıldı) |

---

## Kod değişti mi?

**Evet** — Android feed UI/ViewModel/state.

## B5 / Play hattına dokunuldu mu?

**Hayır** — `B5_STATUS=PROD_HTTPS_PENDING` değişmedi.

---

## Merge önerisi

**Ready for review** — dar kapsam, test PASS, legal-safe korundu.
