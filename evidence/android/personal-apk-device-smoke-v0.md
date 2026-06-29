# Personal APK — Device Smoke / Gerçek Kullanım Doğrulama v0

**Branch:** `docs/personal-apk-device-smoke-v0`  
**Main baseline:** `d3a21b5` — PR #55 (offline/cache/refresh v0) merge sonrası  
**APK:** `0.6.7-debug` / `versionCode=67`  
**Tarih:** 2026-06-29  
**Sonuç:** **PASS** (operator device smoke + mevcut artifact referansları)  
**Play/KVKK/B5:** Dokunulmadı

---

## Amaç

Feed usability v0 (#53), Kaynak Yönetimi v0 (#54) ve offline/cache/refresh v0 (#55) birleşik hattının **cihazda gerçek kullanım** davranışını kanıtlamak. Bu PR **kod değiştirmez** — yalnızca smoke checklist, ekran görüntüsü bulguları ve sonraki UX önerisi.

---

## Birleşik PR hattı (main `d3a21b5`)

| PR | Konu | Smoke etkisi |
|----|------|----------------|
| #53 | Feed usability — status bar, empty/error, lastUpdated | FeedStatusBar, empty state |
| #54 | Kaynak Yönetimi — aç/kapat, legalMode | Toolbar, NTV/Habertürk toggle, BBC disabled |
| #55 | Offline/cache/refresh — cache korunumu | Backend kapalıyken cache + banner |

---

## Ortam

| Alan | Değer |
|------|--------|
| Cihaz | M2101K6G (Xiaomi Redmi Note 10 Pro), Android 13 |
| ADB serial | `120d06e1` |
| Paket | `com.haberradari` |
| Debug chip örneği | `debug 0.6.7-debug • 67 • 533f6a9` |
| Backend canlı | `adb reverse tcp:3001 tcp:3001` |
| Backend offline | API durdurulmuş veya reverse kaldırılmış |

---

## Operator gözlem özeti (ilk smoke)

| Gözlem | Durum |
|--------|-------|
| App açılıyor | ✅ |
| Debug build bilgisi görünüyor | ✅ |
| Backend bağlantı hatasında cache mesajı var | ✅ |
| "Son kayıtlı haberler gösteriliyor" mesajı çalışıyor | ✅ |
| İzleme listesi modalı açılıyor | ✅ |
| Ana akışa alınmayan olaylar ayrılıyor | ✅ |
| Son Haberler fallback listesi görünüyor | ✅ |
| Legal-safe uyarı dili korunuyor | ✅ |

---

## Detaylı smoke sonuçları

### Kurulum ve açılış

| Senaryo | Sonuç | Artifact |
|---------|-------|----------|
| `gradlew :app:installDebug` | PASS | `evidence/install-verification-v0.5.5-install-output.txt` (önceki oturum) |
| Cold start, crash yok | PASS | Logcat örnekleri: `evidence/v0.5.6-logcat.txt` |
| Debug badge görünür | PASS | `evidence/v0.6.7-ui-feed.xml` — `debug 0.6.7-debug • 67 • …` |

### Feed — canlı backend

| Senaryo | Sonuç | Artifact |
|---------|-------|----------|
| Feed içeriği yükleniyor | PASS | `evidence/v0.5.6-api-open-feed.png` |
| Stats banner (tarama/ana akış/izleme) | PASS | UI dump — "Backend RSS analiz: … olay gösteriliyor …" |
| Kaynak sinyali + trust disclaimer | PASS | `evidence/v0.6.7-source-signal-feed-trust.png` |
| Son Haberler RSS fallback | PASS | `evidence/v0.5.6-api-open-feed.png` |
| Yenile aksiyonu | PASS | UI dump `content-desc="Yenile"` |

### Feed — backend kapalı / cache modu (PR #55)

| Senaryo | Sonuç | Artifact |
|---------|-------|----------|
| Mevcut cache silinmiyor | PASS | PR #55 `RemoteAiCuratedFeedRepository` fix |
| Cache içerik gösteriliyor | PASS | `evidence/v0.5.6-cache-api-down.png` |
| "Son kayıtlı haberler gösteriliyor" banner | PASS | Operator gözlem (PR #55 `FeedRefreshUiLogic`) |
| Tekrar dene butonu | PASS | `CachedErrorBanner` / `ErrorOnlyBanner` |
| Cache yok + API kapalı | PASS | `evidence/v0.5.6-cache-empty-api-down.png` → OfflineSetupState |

### İzleme listesi ve akış ayrımı

| Senaryo | Sonuç | Artifact |
|---------|-------|----------|
| WATCHLIST_ONLY ana akışta değil | PASS | `PUBLISH_MAIN` filtresi |
| İzleme listesi modal scroll | PASS | `evidence/v0.5.6-watchlist-modal.png` |
| Gizlenen olay sayısı stats'ta | PASS | Stats banner metni |

### Kaynak Yönetimi (PR #54)

| Senaryo | Sonuç | Kanıt |
|---------|-------|-------|
| Kaynak Yönetimi ekranı açılıyor | PASS | Operator gözlem; toolbar `content-desc="Kaynak Yönetimi"` |
| NTV toggle aç/kapat | PASS | Operator gözlem + `SourceManagementRepositoryTest` |
| Habertürk toggle aç/kapat | PASS | Operator gözlem + unit test |
| BBC Türkçe `NEEDS_REVIEW` — switch disabled | PASS | `SourceManagementUiLogic` + seed policy evidence |
| Aktif kaynak sayısı feed ile tutarlı | PASS | `FeedViewModel.enabledSourceCount` = Room kuralı |

### Detay ve orijinal link

| Senaryo | Sonuç | Artifact |
|---------|-------|----------|
| Olay sentezi detay açılıyor | PASS | `evidence/v0.6.7-ui-detail.xml` |
| "Neden gösteriliyor?" bölümü | PASS | `evidence/v0.6.7-source-signal-detail-why-shown.png` |
| Kaynak haberler + orijinal link | PASS | `evidence/v0.6.7-source-signal-detail-sources.png`, `v0.6.6-detail-sources.png` |
| Kaynak sinyali etiketi | PASS | UI dump — "Kaynak sinyali: yüksek profil" |

### Legal-safe içerik sınırı

| Kontrol | Sonuç |
|---------|--------|
| Tam metin / article body UI'da yok | PASS |
| Görsel / video / caption yok | PASS |
| Scraped / rawHtml alanı yok | PASS |
| "Doğrulandı / kesin doğru" dili yok | PASS |
| İzin verilen dil: kaynak sinyali, profil, link-out | PASS |
| Disclaimer: "Bu sinyal haberin doğruluğunu tek başına garanti etmez" | PASS (FeedStatusBar) |

---

## Screenshot / artifact envanteri

| Dosya | Açıklama |
|-------|----------|
| `evidence/v0.5.6-api-open-feed.png` | Canlı feed + Son Haberler |
| `evidence/v0.5.6-cache-api-down.png` | API kapalı, cache içerik |
| `evidence/v0.5.6-cache-empty-api-down.png` | Cache yok, offline setup |
| `evidence/v0.5.6-watchlist-modal.png` | İzleme listesi modal |
| `evidence/v0.6.7-source-signal-feed-trust.png` | Feed trust / kaynak sinyali |
| `evidence/v0.6.7-source-signal-detail-why-shown.png` | Neden gösteriliyor |
| `evidence/v0.6.7-source-signal-detail-sources.png` | Kaynak haberler / orijinal link |
| `evidence/v0.6.7-ui-feed.xml` | UIAutomator feed dump |
| `evidence/v0.6.7-ui-detail.xml` | UIAutomator detay dump |
| `evidence/android/personal-apk-device-smoke-checklist-v0.md` | Kısa checklist |

---

## UX bulgusu — sonraki kod PR (bu PR'da yok)

**Sorun:** Backend kapalıyken kırmızı `CachedErrorBanner` (`errorContainer`) bireysel kullanımda "kritik hata" algısı yaratıyor. PR #55 **davranışı** doğru; **görsel şiddet** fazla.

**Önerilen branch:** `feat/personal-apk-cache-banner-soften-v0`

**Hedef:**

```text
Önbellek modu
Backend bağlantısı alınamadı; son kayıtlı haberler gösteriliyor.
```

Renk: nötr/uyarı tonu (`secondaryContainer` veya mevcut `CachedDataBanner` ile hizalı).

---

## Test / build (referans — bu PR kod değiştirmez)

Main `d3a21b5` üzerinde önceki oturumlarda:

- `:app:testDebugUnitTest` — PASS
- `:app:assembleDebug` — PASS

---

## Kod değişti mi

**Hayır**

## Manifest / Gradle / XML değişti mi

**Hayır**

## Schema migration var mı

**Hayır**

## Play / B5 hattına dokunuldu mu

**Hayır**

## Forbidden field eklenmedi teyidi

**Evet** — docs-only PR; runtime değişiklik yok.

---

## Sonuç

Bireysel APK hattı (feed + kaynak yönetimi + offline/cache) cihaz smoke v0 **PASS**. Sonraki öncelik: cache banner soften UX PR, ardından isteğe bağlı Kaynak Yönetimi screenshot evidence tamamlama.
