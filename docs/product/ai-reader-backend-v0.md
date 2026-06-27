# AI Reader Backend v0

## 1. Amaç
* Haberi kullanıcı adına okuyup “ne oldu?” özeti üretmek.
* Tıklama ihtiyacını azaltmak.
* Orijinal kaynağı korumak.

## 2. Backend akışı
* articleId/url alınır.
* Kaynak güvenlik kontrolü yapılır.
* Sayfa geçici fetch edilir.
* Metin extractor sadece işlem süresince çalışır.
* Tam metin kalıcı saklanmaz.
* AI summary JSON üretir.
* Sadece summary alanları DB/cache’e yazılır.

## 3. Önerilen response contract
**AiReaderSummary:**
* articleId
* sourceUrl
* sourceName
* shortAiSummary
* detailedAiSummary
* whatHappened
* whyItMatters
* keyActors
* location
* timeline
* publicInterestReason
* emotionalTone
* visibilityRecommendation
* confidenceScore
* sourceAttribution
* generatedAt
* expiresAt

## 4. Saklanabilecek alanlar
* AI üretimi özetler
* önem nedeni
* görünürlük nedeni
* duygu tonu
* kaynak adı/link
* generation timestamp/cache TTL

## 5. Saklanmayacak alanlar
* fullText
* articleBody
* contentHtml
* raw scraped page
* video/audio transcript, lisanslı değilse
* kullanıcı kişisel verisi

## 6. Maliyet kontrolü
* sadece önemli/okunabilir haberlerde AI çağrısı
* önce Human Value Filter
* duplicate clustering
* cache key: canonicalUrl + contentHash/etag
* TTL bazlı tekrar kullanım
* batch işlem

## 7. Güvenlik
* SSRF koruması
* domain allow/deny policy
* timeout
* max content length
* robots/legal policy notu
* rate limit
* API key sadece backend secrets
* PII minimization

## 8. AI prompt ilkeleri
* Haberi kopyalama, özgün özet üret
* Sansasyonel dil kullanma
* Kaza/cinayet/ölüm gibi haberlerde travmatik detay verme
* Kamu yararı varsa açıklama ekle
* Belirsizlik varsa “bilinmiyor” yaz
* Kaynağın iddiası ile kesin bilgi ayrımını koru

## 9. Android entegrasyonu
* Article modelindeki mevcut AI Reader alanlarıyla uyumlu olacak
* Mobil sadece backend’den gelen özet alanlarını gösterir
* Offline cache sadece AI summary/metadata tutar
* Orijinal link her zaman görünür

## 10. Related Media Links entegrasyonu
* İlgili video/sosyal linkler destekleyici kaynak olarak listelenir
* Video indirilmez
* Sosyal medya doğrulanmamışsa NEEDS_REVIEW

## 11. Kabul kriterleri
* API key mobilde yok
* full text persistence yok
* AI summary contract hazır
* backend implementation sonraki PR’a ayrılabilir
* Android compile/test etkilenmez
* docs-only commit
