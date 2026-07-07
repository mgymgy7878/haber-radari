# Evidence: AI News Value Engine v0 Hardening

## 1. Engine Amacı
`AiNewsValueEngine`, uygulamanın ana akışında (Smart Feed) yer alacak veya filtrelenecek haberlerin kararını (Decision) veren ve bu kararı tamamen statik (deterministic) ve metadata (başlık, kategori, kaynak) tabanlı alan bir motordur.

## 2. Metadata-Only Input Contract
Motor hiçbir şekilde LLM (yapay zeka modeli) çağırmaz veya asıl haber metni (body, fullText, html) üzerinde çalışmaz.
Sadece şu veriler üzerinden değerlendirme yapar:
- `title`
- `sourceName`
- `category`
- `legalMode`
- `authorityTier`
- `hasLicensedContent`
- `personalPriorityBoost`

Yasaklı alanlar (`body`, `fullText`, vb.) kesinlikle girdi olarak verilmez. Ayrıca kaynak kod içerisinde `doğrulandı`, `AI onay`, `kesin doğru`, `yalan haber` gibi iddialı ve yanıltıcı terimlerin kullanılmadığı `grep` ile denetlenmiştir.

## 3. Decision Thresholds ve Hard Filtering Policy
Ürün kararlarına istinaden katı gizleme (hard filtering) çok sınırlı tutulmuştur. Motor 5 ana karar döner:
- **`HIDE_LEGAL_BLOCKED`**: Hard filter (Kesin gizle). Kaynağın izni yoksa (`DISABLED`, `NEEDS_REVIEW`) veya lisanssız bir ajans ise.
- **`HIDE_CLICKBAIT`**: Hard filter (Kesin gizle). Başlık, belirlenen clickbait şablonlarına kesin uyuyorsa ve `noiseScore >= 70` ise. (Örn. "şoke eden, işte o detay", SEO "hangi ilde deprem oldu")
- **`HIDE_LOW_VALUE`**: Akıştan gizlenir (Watchlist'e düşebilir), ama Hard filter değildir. `newsValueScore < 40` (ve `noiseScore` yüksek değilse).
- **`SHOW_MONITORING`**: Düşük-orta seviye skorlar (`40-74`) veya `noiseScore 51-69` aralığına girip yine de bilgi değeri olan durumlar.
- **`SHOW_MAIN`**: Yüksek öneme sahip skorlar (`newsValueScore >= 75` veya `personalizedScore >= 75`) ile Resmi/Kritik anonslar (Örn. AFAD deprem).

`smart-feed.ts` entegrasyonu incelendiğinde; `AiNewsValueDecision.HIDE_CLICKBAIT` ve `AiNewsValueDecision.HIDE_LEGAL_BLOCKED` kararları doğrudan `PublishDecision.FILTERED_OUT` sonucunu doğurur. `HIDE_LOW_VALUE` ise `PUBLISH_MAIN` olan bir öğeyi `WATCHLIST_ONLY` konumuna düşürür (Pasif Filtreleme).

## 4. Legal-First Guarantee
Motor içerisinde kuralların sırası (Order) büyük önem taşımaktadır:
1. İlk olarak `legalMode` (`DISABLED` veya `NEEDS_REVIEW`) kontrolü yapılır.
2. Ajans lisans kontrolü yapılır.
3. Bu kontrolleri geçemeyen haber, kullanıcının `personalPriorityBoost` değeri ne kadar yüksek olursa olsun, asla yayına (SHOW_MAIN) alınamaz ve `HIDE_LEGAL_BLOCKED` döner.

## 5. Test Sonuçları
Tüm senaryolar `ai-news-value-engine.test.ts` içinde yeniden yazılmış ve test edilmiştir:
- AFAD M>=5 Deprem (Resmi/Kritik Override) => `SHOW_MAIN` (Geçti)
- Haber Sitesi M<5 Deprem => `SHOW_MONITORING` (Geçti)
- SEO Clickbait Deprem Başlığı ("hangi ilde deprem oldu") => Yüksek Noise, `HIDE_CLICKBAIT` (Geçti)
- Ağır Magazin Clickbait ("şoke eden, işte o detay") => Yüksek Noise, `HIDE_CLICKBAIT` (Geçti)
- Güvenli Ekonomi Haberleri => `SHOW_MONITORING` veya Kişisel Boost ile `SHOW_MAIN` (Geçti)
- Yasaklı Kaynak (DISABLED/NEEDS_REVIEW/Lisanssız) => `HIDE_LEGAL_BLOCKED` (Geçti)
- Kişisel Boost, Legal Block veya Yüksek Clickbait'i aşamaz (Geçti)
- Skorların 0-100 arasında sınırlandırılması (Geçti)

Testlerin tamamı (%100) başarıyla geçmiştir. 

## 6. Güvenlik
- LLM Çağrısı: **YOK**
- Production Deploy: **YAPILMADI**
- Mobil UI Entegrasyonu: **BU PR'DA YOK** (Android cihaz bekleniyor).
- Yan Etki / Dışa Bağımlılık: **YOK** (Saf, deterministic function).
