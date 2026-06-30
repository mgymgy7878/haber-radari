# Personal APK — Kaynak Sağlığı Detayları v0

## Branch / commit

- **Branch:** `feat/personal-apk-source-health-details-v0`
- **Base:** `main` @ `5b3c0cd` (docs: re-audit tcmb feed after turkish date parser v0.3 #64)
- **Commit:** `e63a84d` — feat: add source health details v0

## Değişen dosyalar

- `apps/android/app/src/main/java/com/haberradari/ui/feed/SourceManagementUiLogic.kt`
- `apps/android/app/src/main/java/com/haberradari/ui/feed/SourceManagementScreen.kt`
- `apps/android/app/src/test/java/com/haberradari/ui/feed/SourceManagementUiLogicTest.kt`
- `evidence/android/personal-apk-source-health-details-v0.md`

## UI/UX değişiklikleri

Kaynak Yönetimi kartlarına sağlık detay paneli eklendi:

- Kaynak durum mesajı (sağlıklı / kapalı / NEEDS_REVIEW / 0 haber / ardışık hata)
- Akış notu (“Neden akışta haber yok?” kaynak bazlı)
- Kayıtlı haber sayısı
- Son başarılı yenileme zamanı
- Son hata zamanı (varsa)
- Son hata özeti (sanitize edilmiş, kısa)
- Ardışık hata sayısı (varsa)
- Kaynak sağlığı disclaimer

Mevcut legalMode chip, toggle davranışı ve kaynak profili ipuçları korundu.

## Kaynak sağlığı metinleri

| Durum | Metin |
|-------|-------|
| Kapalı | Bu kaynak kapalı; akışa haber eklemez. |
| NEEDS_REVIEW | İnceleme bekliyor; üretim akışına alınmaz. |
| 0 makale | Bu kaynaktan henüz kayıtlı haber yok. Yenileme sonrası tekrar kontrol et. |
| Ardışık hata | Son yenilemelerde hata alındı; son kayıtlı haberler korunur. |
| Sağlıklı | Kaynak son yenilemede veri sağladı. |
| Disclaimer | Kaynak sağlığı haberin doğruluğunu tek başına garanti etmez. |

## Son başarılı yenileme / son hata / makale sayısı

- `FeedHealth.lastSuccessAt` → `Son başarılı yenileme: dd MMM yyyy HH:mm` (tr-TR)
- `FeedHealth.lastErrorAt` → `Son hata: dd MMM yyyy HH:mm`
- `FeedHealth.lastErrorMessage` → `sanitizeErrorMessage()` ile stack trace kırpılır, max 120 karakter
- `FeedHealth.consecutiveFailures` → `Ardışık hata: N` (N > 0)
- `SourceStats.articleCount` → `Kayıtlı haber: N`

Null/boş değerler güvenli şekilde gizlenir.

## NEEDS_REVIEW / kapalı kaynak davranışı

- Kapalı kaynak: toggle açılabilir; durum mesajı akışa eklemediğini belirtir.
- NEEDS_REVIEW (BBC Türkçe): toggle disabled kalır; ingest kapalı mesajı gösterilir.
- Feed ingest logic değişmedi; yalnızca görüntüleme.

## Legal-safe çizgi korunumu

- Metadata-only; tam metin / görsel / scrape alanı eklenmedi.
- “Doğrulandı”, “kesin doğru”, “yalan haber yakalar”, “kanıtlandı” dili kullanılmadı.
- Ürün dili: kaynak sağlığı, kaynak profili, kaynak sinyali, disclaimer.

## Forbidden field eklenmedi teyidi

`body`, `fullText`, `contentHtml`, `rawHtml`, `articleText`, `scrapedText`, `image`, `video`, `audio`, `caption` alanları eklenmedi.

## TCMB/AFAD/diğer kaynak seed eklenmedi teyidi

- Android seed hâlâ 3 kaynak: NTV, BBC Türkçe, Habertürk.
- TCMB seed gate açılmadı.
- AFAD runtime seed eklenmedi.
- Registry / feedUrl değişmedi.

## Test sonuçları

```
./gradlew :app:testDebugUnitTest  → BUILD SUCCESSFUL
./gradlew :app:assembleDebug      → BUILD SUCCESSFUL
```

Yeni/güncellenen unit testler:

- Sağlıklı / kapalı / NEEDS_REVIEW / 0 makale / ardışık hata durum metinleri
- `sanitizeErrorMessage` (stack trace, uzun mesaj)
- Disclaimer ve durum metinlerinde yasaklı doğrulama dili kontrolü
- `buildSourceHealthDetails` alanları

## Device/manual smoke

**Cihaz smoke atlandı; adb PATH'te yok.**

## Kod değişti mi

**Evet** — yalnızca Kaynak Yönetimi UI + testable UI logic.

## Manifest/Gradle/XML değişti mi

**Hayır**

## Schema migration var mı

**Hayır**

## Play/B5 hattına dokunuldu mu

**Hayır**
