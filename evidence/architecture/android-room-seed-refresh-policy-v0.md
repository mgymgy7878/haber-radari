# Android Room seed refresh policy (v0)

**Branch:** `fix/android-room-seed-refresh-policy-v0`  
**PR title:** `fix(android): refresh seed source metadata from registry`  
**Date:** 2026-06-29  
**Önceki PR:** #45 (Android seed registry import) — teknik borç kapatma

## PR #45 borcu

PR #45 sonrası Android seed canonical `source-registry-v0.json` asset’inden türetiliyor; ancak `SourceDao.insertSources` → `OnConflictStrategy.IGNORE` nedeniyle **mevcut kurulumlarda** `legalMode` ve diğer registry metadata alanları güncellenmiyordu. Fresh install doğru değerleri alıyordu; upgrade path drift bırakıyordu.

## Eski davranış

```
seedDefaultSources() → insertSources(IGNORE)
  → satır varsa: hiçbir alan güncellenmez
  → satır yoksa: registry seed eklenir (fresh install)
```

## Yeni refresh policy

```
seedDefaultSources()
  1. insertSources(IGNORE)     — eksik seed satırları eklenir (fresh install)
  2. refreshExistingSeedMetadata()
       → yalnızca ANDROID_SEED_RUNTIME_BINDINGS (3 kaynak)
       → SourceDao.updateSeedMetadata() — enabled DOKUNULMAZ
```

`SourceSeedRefreshPolicy.mergePreservingUserPreferences()` kullanıcı `enabled` tercihini korur.

## Güncellenen alanlar (registry SSOT)

| Alan | Güncellenir |
|------|-------------|
| `name` (displayName) | Evet |
| `feedUrl` | Evet |
| `legalMode` | Evet |
| `category` | Evet |
| `authorityLevel` | Evet |
| `enabled` | **Hayır** — kullanıcı tercihi |

## Korunan kullanıcı alanları

| Alan | Korunur |
|------|---------|
| `enabled` | Evet |

(`Source` entity’de hidden/favorite/sort alanı yok.)

## Seed kaynak sayısı

| Metrik | Önce | Sonra |
|--------|------|-------|
| Android seed kaynak sayısı | **3** | **3** |
| Registry otomatik enable | Hayır | Hayır |

## legalMode refresh sonucu (existing install simülasyonu)

| Android `id` | Eski (pre-PR#45 drift) | Refresh sonrası |
|--------------|------------------------|-----------------|
| `ntv-turkiye` | `RSS_METADATA_ONLY` | `TITLE_LINK_ONLY` |
| `haberturk` | `RSS_METADATA_ONLY` | `TITLE_LINK_ONLY` |
| `bbc-turkce` | `RSS_METADATA_ONLY` | `NEEDS_REVIEW` |

## No new source enable

Registry’de 21 kaynak var; yalnızca frozen binding’deki 3 kaynak seed/refresh edilir. `afad_official`, `tcmb`, `kap` vb. DB’ye eklenmez.

## DISABLED / NEEDS_REVIEW güvenliği

- DISABLED kaynaklar binding listesinde yok → seed’e girmez (`AndroidSeedRegistryDeriver.assertSeedLegalSafety`).
- BBC `NEEDS_REVIEW`: DB’de görünür, `blocksProductionIngest()` → RSS sync/ingest **kapalı** (`SourceDao.getEnabledSources`, `NewsRepository.refreshFeeds`).

## DB version / migration

| Değişiklik | Durum |
|------------|-------|
| Room schema version | **Değişmedi** (v2) |
| Migration eklendi mi? | **Hayır** — runtime UPDATE policy |
| `fallbackToDestructiveMigration` | Değişmedi |

## Test sonuçları

| Suite | Sonuç |
|-------|-------|
| `:app:testDebugUnitTest` | **PASS** |
| `SourceSeedRefreshPolicyTest` | **PASS** (fresh install, existing refresh, user pref, no-21-source, BBC ingest block, idempotency) |
| `DefaultSourceSeedTest` | **PASS** |
| `AndroidSeedRegistryDeriverTest` | **PASS** |
| Room migration test | **Yok** (schema değişmedi) |
| `:app:assembleDebug` | **PASS** |

## Cihaz smoke

| Adım | Sonuç |
|------|-------|
| `adb devices` | **Atlandı** — ortamda `adb` PATH’te yok |
| `:app:installDebug` + launch | **Atlandı** — cihaz smoke bu ortamda çalıştırılamadı |

## API parity

API runtime RSS kaynak seti **değişmedi** — bu PR yalnızca Android Room seed refresh policy. `apps/api/src/config/rss-sources.ts` dokunulmadı.

## Değişmeyen sınırlar

- Manifest / Gradle / XML: **değişmedi**
- HTTPS hardening: **yapılmadı**
- Trust UX copy: **değişmedi**
- Publish gate: **açılmadı**
- Source Registry fixture: **değişmedi**
- Yeni kaynak enable: **hayır**

## B5 durumu

**B5 = PROD_HTTPS_PENDING** — prod host/TLS hazır değil; Play publish hâlâ bekler. Bu PR Android veri tutarlılığı borcunu kapatır.

## Merge önerisi

**Ready for review** — dar kapsam, unit test + assembleDebug PASS; schema migration gerektirmez.
