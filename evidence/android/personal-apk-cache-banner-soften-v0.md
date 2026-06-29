# Personal APK — Cache Banner Soften v0

**Branch:** `feat/personal-apk-cache-banner-soften-v0`  
**Main baseline:** `ab949c1` (PR #56 device smoke evidence)  
**Tarih:** 2026-06-29  
**Play/KVKK/B5:** Dokunulmadı

---

## Amaç

Backend kapalıyken cache gösterilirken kırmızı `CachedErrorBanner` bireysel kullanımda fazla alarm veriyordu. PR #55 cache koruma **davranışı** doğru; bu PR yalnızca **UI tonu ve metin** yumuşatır.

---

## Eski / yeni davranış

| Alan | Eski | Yeni |
|------|------|------|
| Banner rengi | `errorContainer` (kırmızı) | `secondaryContainer` (nötr/uyarı) |
| Başlık | Yok (tek paragraf) | **Önbellek modu** |
| Açıklama | "Bağlantı alınamadı; son kayıtlı…" | "Backend bağlantısı alınamadı; son kayıtlı haberler gösteriliyor." |
| Teknik hata metni | `lastError` banner'da gösteriliyordu | Gizlendi (alarm azaltma) |
| Retry ipucu | Yok | "Yenile ile tekrar deneyebilirsin." |
| Retry butonu | Dolu `Button` | `OutlinedButton` |
| FeedStatusBar (cache+hata) | "Bağlantı hatası — önbellek" | **Önbellek modu** |
| Refresh outcome etiketi | "Yenileme başarısız — önbellek korundu" | **Önbellek modu** |
| `ErrorOnlyBanner` (cache yok) | Kırmızı hata | **Değişmedi** |
| Cache koruma (PR #55) | Korunur | **Değişmedi** |

---

## Değişen dosyalar

- `FeedRefreshUiLogic.kt` — `cachedModeBannerTitle/Description/RetryHint`, outcome etiketi
- `FeedUsabilityUiLogic.kt` — `ERROR_WITH_CACHE` status etiketi
- `FeedScreen.kt` — `CachedErrorBanner` görsel/metin yumuşatma
- `FeedRefreshUiLogicTest.kt` — yeni metin testleri
- `FeedUsabilityUiLogicTest.kt` — status etiketi testi

---

## Cache davranışı değişti mi

**Hayır** — refresh/cache algoritması, `FeedViewModel`, repository katmanı dokunulmadı.

---

## Legal-safe

| Kontrol | Sonuç |
|---------|--------|
| Forbidden fields | **Eklenmedi** |
| Yanıltıcı doğrulama dili | **Yok** |
| Metadata-only çizgi | **Korundu** |

---

## Test sonuçları

```
./gradlew :app:testDebugUnitTest  → BUILD SUCCESSFUL
./gradlew :app:assembleDebug      → BUILD SUCCESSFUL
```

---

## Device / manual smoke

**Atlandı** — `adb` PATH'te yok. PR #56 smoke evidence (`v0.5.6-cache-api-down.png`) referans; banner rengi/metin değişikliği manuel doğrulama önerilir.

---

## Kod değişti mi

**Evet** (UI/metin only)

## Manifest / Gradle / XML

**Hayır**

## Schema migration

**Hayır**

## Play / B5

**Hayır**
