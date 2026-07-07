# Feature Evidence: Android Live UI News Value v0

## Amaç
PR #79 ile backend'e eklenen AI News Value Engine skorlarını (`decision`, `newsValueScore`, `noiseScore`, `reasonCode`) Android uygulamasında metadata-only ve legal-safe şekilde göstermek.

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
   - `AiCuratedNewsItemCard` tamamen yeniden yazıldı.
   - **Başlık ve Kaynak:** Üst kısımda `Kaynak Adı · Yayın Zamanı` formatıyla sunuldu. Altında büyük puntoyla başlık yer alıyor.
   - **Haber Değeri Çipi (Chip):** 
     - `newsValueScore >= 75` ise `Haber değeri: Yüksek`
     - `newsValueScore 40-74` arası ise `Haber değeri: Orta`
     - `<40` ise `Haber değeri: Düşük`
   - **Akış Kararı Çipi:** 
     - `decision == "SHOW_MAIN"` -> `Öncelikli Akış`
     - `decision == "SHOW_MONITORING"` -> `Gelişen Kayıt`
     - `decision == "HIDE_LOW_VALUE"` -> `İzleme`
   - **Kaynak Sinyali Çipi:** Kaynak sayısına göre `Çok-kaynaklı sinyal` veya `Tek kaynak sinyali` olarak belirtildi.
   - **Neden Gösterildi:** AI motorunun verdiği `reasonCode` kartın içerisinde "Neden gösterildi?" başlığı altında kullanıcının anlayacağı dilde gösterildi.
   - **Uyarı Metni:** `Uyarı: Bu sinyal haberin doğruluğunu tek başına garanti etmez.` legal uyarısı eklendi.
   - **Orijinal Link:** Orijinal kaynağa yönlendirme (açma) eklendi.

## Doğrulama / Test
- Birim testleri yazıldı ve tüm DTO/mapping/UI state dönüşümleri doğrulandı. (Testler yeşil, bkz: github actions)
- **NOT:** Cihaz bağlı olmadığı için "Device Smoke Test" henüz yapılmadı. PR **Draft** olarak kalmalı ve cihaz (adb) bağlandığında manuel smoke test (görsel kontrol) yapıldıktan sonra merge edilmelidir.

## Sonuç
Android arayüzü artık backend'in AI tabanlı, metadatalardan üretilen `newsValueScore` tabanlı karar mekanizmasını yansıtmaktadır.
