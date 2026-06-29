# Personal APK — Offline / Cache / Refresh v0

## Branch / commit

- Branch: `feat/personal-apk-offline-cache-refresh-v0`
- Commit: `b5e635f`

## Değişen dosyalar

- `apps/android/app/src/main/java/com/haberradari/ui/feed/FeedRefreshUiLogic.kt` (yeni)
- `apps/android/app/src/main/java/com/haberradari/ui/feed/FeedViewModel.kt`
- `apps/android/app/src/main/java/com/haberradari/ui/feed/FeedScreen.kt`
- `apps/android/app/src/main/java/com/haberradari/ui/feed/FeedUsabilityUiLogic.kt`
- `apps/android/app/src/main/java/com/haberradari/data/repository/NewsRepository.kt`
- `apps/android/app/src/main/java/com/haberradari/domain/repository/RemoteAiCuratedFeedRepository.kt`
- `apps/android/app/src/test/java/com/haberradari/ui/feed/FeedRefreshUiLogicTest.kt` (yeni)
- `apps/android/app/src/test/java/com/haberradari/NewsRepositoryRefreshTest.kt` (yeni)

## Refresh success / failure davranışı

| Durum | Davranış |
|-------|----------|
| Refresh success | Haberler güncellenir, `lastUpdatedAt` güncellenir, `refreshOutcome=SUCCESS`, hata temizlenir |
| Refresh failure + cache | Disk/in-memory cache korunur, `refreshOutcome=FAILED_SHOWING_CACHE`, banner + Tekrar dene |
| Refresh failure + cache yok | Liste boşaltılmaz (varsa in-memory), `refreshOutcome=FAILED_NO_CACHE`, ErrorOnlyBanner |
| Aktif kaynak yok | `countEnabledIngestSources()==0` → network skip, `SKIPPED_NO_ACTIVE_SOURCES`, Kaynak Yönetimi mesajı |

## Cache korunumu

- `RemoteAiCuratedFeedRepository`: `forceRefresh` öncesi `cacheFile.delete()` kaldırıldı; yalnızca başarılı fetch sonrası üzerine yazılır.
- `FeedViewModel.refresh()`: refresh sırasında içerik temizlenmez; hata durumunda `FeedRefreshUiLogic.applyCachedSnapshot` / `mergeErrorPreservingContent` kullanılır.
- `NewsRepository.refreshFeeds()`: aktif kaynak yoksa erken çıkış (Room makaleleri silinmez).

## Offline / cache UI mesajları

- **FeedStatusBar**: son güncelleme, bağlantı durumu (Canlı / Önbellek / Hata), refresh outcome etiketi.
- **CachedDataBanner**: "Son kayıtlı haberler gösteriliyor" (+ yaş).
- **CachedErrorBanner**: "Bağlantı alınamadı; son kayıtlı haberler gösteriliyor" + hata detayı + Tekrar dene.
- **ErrorOnlyBanner**: cache yokken hata + Tekrar dene.
- **NoActiveSourcesBanner**: aktif kaynak yok mesajı + Yenile.

## Aktif kaynak yok davranışı

- `NewsRepository.refreshFeeds()` ve `FeedViewModel.refresh()` / `fetchCuratedFeed()` aktif kaynak sayısını Room'dan okur; 0 ise network çağrısı yapılmaz.
- Kullanıcıya: "Aktif kaynak yok. Kaynak Yönetimi ekranından en az bir kaynak açın."

## Legal-safe alanların korunumu

- Yalnızca metadata-only akış; tam metin, görsel, scraped body alanı eklenmedi.
- Ürün dili: kaynak sinyali, önbellek, bağlantı hatası — doğrulama iddiası yok.

## Forbidden field eklenmedi teyidi

Eklenmedi: `body`, `fullText`, `contentHtml`, `rawHtml`, `articleText`, `scrapedText`, `image`, `video`, `audio`, `caption`.

## Test sonuçları

```
./gradlew :app:testDebugUnitTest  → BUILD SUCCESSFUL
./gradlew :app:assembleDebug      → BUILD SUCCESSFUL
```

Yeni/güncellenen testler:

- `FeedRefreshUiLogicTest` — skip, cache koruma, banner mesajları, legal dil
- `NewsRepositoryRefreshTest` — boş kaynak skip, count

## Device smoke

**Atlandı** — `adb` PATH'te yok (`where.exe adb` bulunamadı).

## Kod değişti mi

**Evet**

## Manifest / Gradle / XML değişti mi

**Hayır**

## Schema migration var mı

**Hayır**

## Play / B5 hattına dokunuldu mu

**Hayır** — Play/KVKK/B5 dosyalarına dokunulmadı; prod hostname/TLS değiştirilmedi.
