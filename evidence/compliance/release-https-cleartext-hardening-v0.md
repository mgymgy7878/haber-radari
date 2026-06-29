# Release HTTPS / Cleartext Hardening Implementation (v0)

**Branch:** `fix/android-release-https-cleartext-hardening-v0`  
**PR title:** `fix(android): harden release cleartext network config`  
**Date:** 2026-06-29

## Önceki durum

| Bulgu | Konum |
|-------|--------|
| `usesCleartextTraffic="true"` | `app/src/main/AndroidManifest.xml` |
| `networkSecurityConfig` yok | — |
| `smartFeedBaseUrl = "http://127.0.0.1:3001"` | `FeatureConfig.kt` (tüm build type) |
| Debug/release ayrımı yok | `build.gradle.kts` |

## Yeni debug / release ayrımı

| Build | Cleartext | Smart Feed Base URL | Remote feed |
|-------|-----------|---------------------|-------------|
| **Debug** | NSC: yalnızca `127.0.0.1`, `localhost`, `10.0.2.2` | `http://127.0.0.1:3001` (BuildConfig) | Açık |
| **Release** | NSC: global `cleartextTrafficPermitted=false` | `""` (boş) veya `-PprodSmartFeedBaseUrl=https://...` | Yalnızca HTTPS URL varsa açık |

## Değişen dosyalar

| Dosya | Değişiklik |
|-------|------------|
| `app/src/main/AndroidManifest.xml` | `usesCleartextTraffic` kaldırıldı; `networkSecurityConfig` eklendi |
| `app/src/main/res/xml/network_security_config.xml` | **Yeni** — release/main cleartext kapalı |
| `app/src/debug/res/xml/network_security_config.xml` | **Yeni** — debug localhost cleartext istisnası |
| `app/build.gradle.kts` | `SMART_FEED_BASE_URL` debug vs release BuildConfig |
| `FeatureConfig.kt` | BuildConfig tabanlı URL; release HTTPS policy |
| `HaberRadariApp.kt` | `assertReleaseSmartFeedUrlPolicy()` startup guard |
| `RemoteAiCuratedFeedRepository.kt` | Release HTTP guard |
| `ReleaseNetworkSecurityHardeningTest.kt` | **Yeni** — manifest/NSC/gradle policy testleri |

## Release cleartext sonucu

| Kontrol | Sonuç |
|---------|--------|
| Main manifest `usesCleartextTraffic=true` | **Yok** |
| Release merged manifest `usesCleartextTraffic` | **Yok** |
| Release merged manifest `networkSecurityConfig` | **Var** (`@xml/network_security_config`) |
| Release `BuildConfig.SMART_FEED_BASE_URL` | `""` (http yok) |
| Release main NSC | `cleartextTrafficPermitted="false"` |

Merged manifest yolu (build sonrası):

`app/build/intermediates/merged_manifests/release/processReleaseManifest/AndroidManifest.xml`

## Debug local HTTP istisnası

`app/src/debug/res/xml/network_security_config.xml`:

- Base: cleartext **kapalı**
- `domain-config`: `127.0.0.1`, `localhost`, `10.0.2.2` — **yalnızca debug** source set

Workflow: `adb reverse tcp:3001 tcp:3001` + debug APK.

## Release prod URL durumu

Gerçek prod HTTPS URL **uydurulmadı**. Release:

- `SMART_FEED_BASE_URL=""` → `aiRemoteFeedEnabled=false` (remote kapalı, mock/local RSS devam)
- Prod deploy: `./gradlew :app:assembleRelease -PprodSmartFeedBaseUrl=https://api.example.com`

## Grep sonuçları (`app/src/main`)

| Pattern | Production main |
|---------|-----------------|
| `usesCleartextTraffic="true"` | **Yok** |
| `http://` (ürün URL) | **Yok** — yalnızca FeatureConfig release guard string |

## Test / build

| Suite | Sonuç |
|-------|-------|
| `:app:testDebugUnitTest` | **PASS** (131 test) |
| `ReleaseNetworkSecurityHardeningTest` | **PASS** |
| `:app:assembleDebug` | **PASS** |
| `:app:assembleRelease` | **PASS** |

## Cihaz smoke (debug)

| Adım | Sonuç |
|------|-------|
| `adb reverse tcp:3001 tcp:3001` | OK |
| `:app:installDebug` | OK |
| Launch `MainActivity` | OK |
| Logcat FATAL | **Yok** |

Release APK cihaza kurulmadı (imza/ops release track ayrı); merged manifest + BuildConfig evidence yeterli.

## Mobil API / LLM key

Android APK içinde API/LLM key **yok** (değişmedi).

## B5 HTTPS durumu

| Alan | Durum |
|------|--------|
| Release cleartext (APK/config) | **TECHNICALLY CLOSED** |
| Prod HTTPS backend URL + TLS ops | **PENDING** |
| Play Data Safety / B5 formal PASS | **PENDING PLAY REVIEW + prod URL** |

**Özet:** `B5 CLEARTEXT_HARDENING_DONE — prod HTTPS URL/config pending`

Plan belgesi (`release-https-cleartext-hardening-plan-v0.md`) implementation PR ile güncellenmedi; bu evidence implementation kanıtıdır.

## Kapsam dışı (bilinçli)

- API backend logic değişmedi
- Source Registry / Android seed değişmedi
- Trust UX metinleri değişmedi
- Publish gate açılmadı
