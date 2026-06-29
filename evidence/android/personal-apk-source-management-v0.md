# Personal APK Source Management v0

**Branch:** `feat/personal-apk-source-management-v0`  
**PR title:** `feat: add personal apk source management v0`  
**Date:** 2026-06-29  
**Play/KVKK/B5:** Dokunulmadı

---

## Özet

Kaynak Sağlığı ekranı **Kaynak Yönetimi v0** olarak genişletildi: kaynak listesi, aç/kapat, `legalMode` etiketleri, aktif kaynak sayısı ve kaynak sağlığı özeti.

---

## Değişen dosyalar

| Dosya | Değişiklik |
|-------|------------|
| `SourceManagementUiLogic.kt` | **Yeni** — legalMode etiketleri, toggle kuralları |
| `SourceManagementViewModel.kt` | **Yeni** — kaynak stats + enabled değişimi |
| `SourceManagementScreen.kt` | **Yeni** — yönetim UI (eski SourceHealthScreen yerine) |
| `SourceDao.kt` | `updateSourceEnabled()` |
| `NewsRepository.kt` | `setSourceEnabled()` — NEEDS_REVIEW/DISABLED guard |
| `MainActivity.kt` | SourceManagement routing |
| `FeedScreen.kt` | Toolbar “Kaynak Yönetimi” |
| `SourceHealthScreen.kt` | **Silindi** (birleştirildi) |
| `SourceHealthViewModel.kt` | **Silindi** |
| Test fakes | `updateSourceEnabled` eklendi |

---

## UI/UX

| Özellik | Açıklama |
|---------|----------|
| Özet bar | Aktif kaynak sayısı + kaynak sinyali disclaimer |
| Kaynak kartı | Ad, kategori, legalMode chip, ingest durumu, profil metni |
| Switch | TITLE_LINK_ONLY / RSS_METADATA_ONLY / LICENSED için aç/kapat |
| BBC (NEEDS_REVIEW) | Switch **disabled** + açıklama |
| Kaynak sağlığı | Son başarılı fetch, ardışık hata (önceki ekrandan korundu) |
| Empty state | Kaynak yok mesajı |

---

## Kaynak aç/kapat davranışı

| legalMode | Switch | Repository |
|-----------|--------|------------|
| `TITLE_LINK_ONLY` | Açık | `enabled` güncellenir |
| `RSS_METADATA_ONLY` | Açık | `enabled` güncellenir |
| `NEEDS_REVIEW` | **Kapalı** | Değişiklik **yok** |
| `DISABLED` | **Kapalı** | Değişiklik **yok** |

Seed refresh policy (`PR #49`) kullanıcı `enabled` tercihini ezmez.

---

## Feed tutarlılığı

`FeedViewModel` ve `SourceManagementViewModel` aynı kuralı kullanır:

```kotlin
sources.count { it.enabled && !it.legalMode.blocksProductionIngest() }
```

---

## Legal-safe

| Kontrol | Sonuç |
|---------|--------|
| Forbidden fields | **Eklenmedi** |
| Doğrulama dili | **Yok** — `SourceManagementUiLogicTest` |
| Metadata-only | **Korundu** |

---

## Test sonuçları

| Suite | Sonuç |
|-------|-------|
| `:app:testDebugUnitTest` | **PASS** |
| `SourceManagementUiLogicTest` | **PASS** |
| `SourceManagementRepositoryTest` | **PASS** |
| `DefaultSourceSeedTest` / `SourceSeedRefreshPolicyTest` | **PASS** (regression) |
| `:app:assembleDebug` | **PASS** |

---

## Cihaz smoke

| Adım | Sonuç |
|------|--------|
| `adb` | **PATH yok** — atlandı |

---

## Manifest / Gradle / XML

| Alan | Değişti mi? |
|------|-------------|
| AndroidManifest | **Hayır** |
| Gradle | **Hayır** |
| XML resources | **Hayır** |

---

## Kod değişti mi?

**Evet** — Android kaynak yönetimi v0.

## B5/Play hattına dokunuldu mu?

**Hayır**

---

## Merge önerisi

**Ready for review**
