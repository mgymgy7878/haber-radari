# Feature Evidence: Android Live UI News Value v0

## Amaç
PR #80 ile backend'e eklenen AI News Value Engine skorlarını (`decision`, `newsValueScore`, `noiseScore`, `reasonCode`) Android uygulamasında metadata-only ve legal-safe şekilde göstermek.

## PR Diff Audit & Düzeltmeler
PR oluşturulduktan sonra yapılan "Diff Audit" sonucunda `AiCuratedNewsItem.kt`, `AiCuratedFeedDto.kt`, ve `AiCuratedFeedRepository.kt` dosyalarının PR diff'te eksik olduğu tespit edildi.
Bu dosyalar (DTO ve Domain mappingleri) PR'a dahil edildi ve başarıyla gönderildi.

## Ürün Dili ve Safe Reason Mapping
Uygulama arayüzünde doğrudan "AI", "raw reasonCode", "kesin doğru", "doğrulandı" gibi riskli ifadelerin gösterilmesi engellendi.
- "Raw reasonCode" metinleri `TrustTransparencyUiLogic` içerisinde güvenli, son kullanıcı odaklı metinlere (Örn: `Kaynak profili uygun; tek kaynaklı gelişen kayıt.`) dönüştürüldü.
- Riskli dil kontrolü (AI özeti, kesin doğru vb.) `grep` aramaları ile yapıldı ve UI arayüzünden temizlendiği teyit edildi. 

## Yapılan Değişiklikler
1. **DTO Güncellemeleri**
   - `AiCuratedFeedDto.kt` dosyasına `AiNewsValueDto` eklendi.
   - `AiCuratedFeedResponseDto` içerisindeki `aiNewsValue` alanı opsiyonel olarak eklendi.

2. **Domain Modeli Güncellemeleri**
   - `AiCuratedNewsItem.kt` dosyasına `AiNewsValue` data class'ı eklendi.
   - `AiCuratedNewsItem` modeline `aiNewsValue` nesnesi eklendi.
   - `WatchlistPreviewItem` modeline `aiNewsValue` eklendi.

3. **Repository ve Mapping**
   - `RemoteAiCuratedFeedRepository.kt` içerisinde, sunucudan dönen DTO içerisindeki `aiNewsValue` alanı Domain katmanındaki modele (hem `AiCuratedNewsItem` hem de `WatchlistPreviewItem` için) map edildi.

4. **Kullanıcı Arayüzü (UI) Değişiklikleri (`FeedScreen.kt` / `AiCuratedNewsItemCard`)**
   - **Haber Değeri Çipi (Chip):** 
     - `newsValueScore >= 75` ise `Haber değeri: Yüksek`
     - `newsValueScore 40-74` arası ise `Haber değeri: Orta`
     - `<40` ise `Haber değeri: Düşük`
   - **Akış Kararı Çipi:** 
     - `decision == "SHOW_MAIN"` -> `Öncelikli Akış`
     - `decision == "SHOW_MONITORING"` -> `Gelişen Kayıt`
     - `decision == "HIDE_LOW_VALUE"` -> `İzleme`
   - **Kaynak Sinyali Çipi:** Kaynak sayısına göre `Çok-kaynaklı sinyal` veya `Tek kaynak sinyali` olarak belirtildi.
   - **Neden Gösterildi:** AI motorunun verdiği `reasonCode` kartın içerisinde safe string mapper ile dönüştürülüp gösterildi.

## Doğrulama / Test
- **Android unit test sonucu:** PASSED
- **assembleDebug sonucu:** PASSED
- **Backend API test sonucu:** PASSED
- **Production deploy:** YAPILMADI
- **LLM çağrısı:** YAPILMADI
- **Device smoke:** `FAILED` (Crash yok, fakat UI'a ham `reasonCode` sızdı: `SHOW_MONITORING_THRESHOLD`).

## Cihaz Smoke Testi (Hata Tespiti)
- Cihaza clean APK (`app-debug.apk`) kuruldu ve MainActivity başlatıldı.
- Crash (java.lang.NoClassDefFoundError) çözüldü, uygulama başarıyla açılıyor.
- UI hiyerarşisi (`window_dump.xml`) incelendiğinde, kartlar üzerinde `"Neden gösterildi? SHOW_MONITORING_THRESHOLD"` şeklinde işlenmemiş ham bir `reasonCode` tespit edildi.
- **Sorun:** `TrustTransparencyUiLogic.mapReasonCodeToSafeUiString` fonksiyonu, motorun ürettiği tüm ham kodları (`SHOW_MONITORING_THRESHOLD`, vb.) içermiyor ve `sanitizeTrustDisplayText` üzerinden UI'a sızmasına neden oluyor.
- **Ekran Görüntüsü:** `smoke_bug.png` olarak kaydedildi.
- **Müdahale:** Kullanıcının "Düzeltme" talimatı doğrultusunda kod değişikliği yapılmadı.

## Final Durum
- **Verdict:** `FAILED_DEVICE_SMOKE` (UI'da raw reasonCode sızıntısı var).
- **Merge önerisi:** HAYIR (Bu bug düzeltilmeden merge edilemez).
