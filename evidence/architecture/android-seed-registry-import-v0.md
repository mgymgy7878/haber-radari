# Android seed → Source Registry SSOT import (v0)

**Branch:** `feat/android-seed-registry-import-v0`  
**PR title:** `refactor(android): derive seed sources from source registry`  
**Date:** 2026-06-29

## Özet

Android varsayılan kaynak seed listesi artık canonical `source-registry-v0.json` asset’inden türetiliyor. Frozen `ANDROID_SEED_RUNTIME_BINDINGS` (3 kaynak) korunuyor; registry’deki 21 kaynak otomatik açılmıyor.

## Seed kaynak sayısı

| Metrik | Değer |
|--------|-------|
| Önceki Android seed kaynak sayısı | **3** |
| Yeni Android seed kaynak sayısı | **3** |
| Yeni kaynak enable edildi mi? | **Hayır** |

## Registry mapping tablosu

| Android `id` | Registry `sourceId` | displayName | category (Android) | feedUrl | enabled |
|--------------|---------------------|-------------|-------------------|---------|---------|
| `ntv-turkiye` | `ntv_turkiye` | NTV Türkiye | türkiye | `https://www.ntv.com.tr/turkiye.rss` | true |
| `bbc-turkce` | `bbc_turkce` | BBC Türkçe | dünya | `https://feeds.bbci.co.uk/turkce/rss.xml` | true |
| `haberturk` | `haberturk` | Habertürk | genel | `https://www.haberturk.com/rss` | true |

`publishEligible` tek başına enable kriteri **değil** — `ANDROID_SEED_RUNTIME_ENABLE_V0` frozen matrisi kullanılıyor.

## legalMode tablosu

| Android `id` | Önceki (hardcoded seed) | Registry | Yeni Android seed |
|--------------|-------------------------|----------|-------------------|
| `ntv-turkiye` | `RSS_METADATA_ONLY` | `TITLE_LINK_ONLY` | `TITLE_LINK_ONLY` |
| `haberturk` | `RSS_METADATA_ONLY` | `TITLE_LINK_ONLY` | `TITLE_LINK_ONLY` |
| `bbc-turkce` | `RSS_METADATA_ONLY` | `NEEDS_REVIEW` | `NEEDS_REVIEW` |

NTV/Habertürk `TITLE_LINK_ONLY`: description/summary saklanmaz (`TitleLinkOnlyTest`, `LegalModeTest` geçti).

## DISABLED / NEEDS_REVIEW güvenliği

- Registry’deki **DISABLED** kaynaklar (ör. `afad_official`, `sports_widget_example`) Android seed bindings’de yok → seed’e girmez.
- `assertSeedLegalSafety()` DISABLED registry kaydı binding’e denk gelirse deriver hata verir (unit test: `DISABLED registry kaynağı seed listesine eklenemez`).
- **NEEDS_REVIEW** (`bbc-turkce`): parity için DB seed satırı korunur; production RSS ingest **kapalı** (`LegalMode.blocksProductionIngest()`, `SourceDao.getEnabledSources()`, `RssParser`, `NewsRepository.refreshFeeds`).
- Registry’deki diğer NEEDS_REVIEW kaynaklar (ör. `market_ticker_tcmb_fx`) bindings’de yok → seed’e girmez.

## NTV / Habertürk TITLE_LINK_ONLY

Registry SSOT: `ntv_turkiye`, `haberturk` → `legalMode: TITLE_LINK_ONLY`.  
Android deriver doğrudan registry `legalMode` okur; test: `NTV ve Habertürk TITLE_LINK_ONLY`.

## Asset / SSOT kaynağı

- Canonical: `apps/api/src/source-registry/source-registry-v0.json`
- Android asset kopyası: `apps/android/app/src/main/assets/source-registry-v0.json` (manuel ikinci SSOT değil; canonical’dan kopya)

## Mevcut kurulum notu (Room)

`insertSources` → `OnConflictStrategy.IGNORE`: mevcut DB’de kayıtlar varsa `legalMode` güncellenmez; yalnızca fresh install / boş DB seed’i yeni değerleri alır. Davranış parity (3 kaynak görünür) korunur; legalMode drift düzeltmesi yeni kurulumlarda etkili olur.

## Test sonuçları

| Suite | Sonuç |
|-------|-------|
| `:app:testDebugUnitTest` | **PASS** (tüm unit testler) |
| `AndroidSeedRegistryDeriverTest` | **PASS** (parity, legalMode, no-21-source, DISABLED guard) |
| `DefaultSourceSeedTest` | **PASS** |
| API `vitest run src/source-registry src/config/rss-sources` | **PASS** (91 test) |
| `:app:assembleDebug` | **PASS** |

## Cihaz smoke

| Adım | Sonuç |
|------|-------|
| `adb reverse tcp:3001 tcp:3001` | OK |
| `:app:installDebug` | OK (M2101K6G) |
| `am start com.haberradari/.MainActivity` | OK |
| Logcat FATAL / AndroidRuntime crash | **Yok** |

## API PR #44 parity

- Bu PR **API kodu değiştirmez**.
- `source-registry` + `rss-sources` testleri geçti → runtime RSS kaynak seti (4 kaynak, 2 aktif: NTV Son Dakika + Habertürk Ekonomi) korunuyor.

## Kapsam dışı (bilinçli)

| Konu | Durum |
|------|-------|
| Trust UX metin cleanup (“Doğrulama”, “Kanıt” vb.) | **Ayrı PR** — bu PR’da değişiklik yok |
| B5 HTTPS hardening | **OPEN / değişmedi** — Manifest/Gradle dokunulmadı |
| Publish gate | **Açılmadı** |
| Yeni kaynak enable | **Yok** |

## Değişen dosyalar (özet)

- `apps/android/app/src/main/assets/source-registry-v0.json` (yeni)
- `apps/android/.../data/registry/AndroidSeedRegistryDeriver.kt` (yeni)
- `apps/android/.../data/registry/SourceRegistryDocument.kt` (yeni)
- `LegalMode.kt`, `SourceDao.kt`, `NewsRepository.kt`, `RssParser.kt`, `HaberRadariApp.kt`, `RssSyncWorker.kt`
- `AndroidSeedRegistryDeriverTest.kt`, `DefaultSourceSeedTest.kt`
