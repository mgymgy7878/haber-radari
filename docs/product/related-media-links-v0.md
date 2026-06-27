# Related Media Links v0

## 1. Amaç
* Her haber için varsa ilgili video/sosyal medya/resmi kaynak linklerini göstermek.
* Yazılı AI özetini destekleyen medya bağlantıları sağlamak.

## 2. Desteklenecek medya tipleri
* YOUTUBE
* NEWS_VIDEO
* X_TWITTER
* INSTAGRAM
* TIKTOK
* FACEBOOK
* OFFICIAL_SOURCE
* LIVE_STREAM
* OTHER

## 3. Önerilen model
**RelatedMediaLink:**
* `id`: String
* `articleId`: String
* `platform`: Enum (YOUTUBE, NEWS_VIDEO, vs.)
* `url`: String
* `canonicalUrl`: String
* `title`: String?
* `sourceName`: String
* `publisherHandle`: String?
* `thumbnailUrl`: String?
* `publishedAt`: Long?
* `confidenceScore`: Float
* `relationType`: Enum
  * SAME_EVENT
  * SOURCE_VIDEO
  * OFFICIAL_STATEMENT
  * EYEWITNESS_SOCIAL
  * BACKGROUND_CONTEXT
* `safetyStatus`: Enum
  * ALLOWED
  * NEEDS_REVIEW
  * BLOCKED
* `reason`: String?
* `createdAt`: Long

## 4. Link keşif kaynakları
* RSS item içindeki media/enclosure alanları
* Haber sayfasındaki metadata/video embed linkleri
* Kaynağın resmi YouTube kanalı, sadece backend tarafında
* Resmi kurum sosyal medya linkleri
* Sosyal medya linkleri manuel/metadata üzerinden
* İlk v0’da genel web scraping veya agresif sosyal medya taraması yapılmayacak.

## 5. Yasal/güvenlik sınırları
* Video indirme yok.
* Video içeriği kopyalama yok.
* Telifli medya yeniden yayınlama yok.
* Sadece link/thumbnail/başlık gibi metadata tutulacak.
* Sosyal medya kişisel veri taraması yapılmayacak.
* API key mobil istemciye konmayacak.
* Link keşfi backend/proxy tarafında yapılacak.
* Şüpheli veya düşük güvenli sosyal medya linkleri NEEDS_REVIEW olacak.

## 6. UI önerisi
* Haber detayında “İlgili video ve kaynaklar” bölümü
* Kartlarda küçük video/social ikonları
* En fazla 3 öncelikli link göster
* Daha fazlası “Tüm bağlantılar” altında
* Öncelik sırası:
  1. Resmi kaynak
  2. Haberi üreten kurumun videosu
  3. Güvenilir YouTube haber kanalı
  4. Doğrulanmış sosyal medya
  5. Diğer sosyal medya

## 7. AI Reader entegrasyonu
* AI özeti oluştururken ilgili medya linkleri destekleyici kaynak olarak listelenebilir.
* AI, video içeriğini v0’da izlemez/çözümlemez.
* İleride backend video transcript varsa sadece lisanslı/izinli metadata veya resmi transcript ile çalışılır.

## 8. Riskler
* Yanlış olayla eşleşmiş video
* Clickbait YouTube linkleri
* Sahte sosyal medya hesapları
* Telif/embedding riski
* Kişisel veri riski
* Rate limit/API maliyeti

## 9. Kabul kriterleri
* Mobilde API key yok
* Full video/text copy yok
* Link metadata modeli hazır
* UI/Backend implementation sonraki PR’a bırakılmış
* PR #11/#12 dosyalarına müdahale yok
