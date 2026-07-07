# AI News Value Engine \u0026 Live UI (v0)

Bu doküman, Haber Radarı'nın "yapay zeka haber değeri motoru" (AI News Value Engine) ve "anlık veri panelleri" mimarisini tanımlar. Amacımız, Google Play hazırlığı gibi operasyonel süreçlerden ziyade çekirdek kullanıcı deneyimine ve uygulamanın zekasına odaklanmaktır.

## 1. Executive Verdict

Haber Radarı'nın yeni önceliği; kişisel kullanım deneyimini mükemmelleştirmek, AI haber değeri filtresiyle gürültüyü engellemek, arayüzü zenginleştirmek ve anlık veri panelleri sunmaktır.
Sistemin kalbinde, clickbait/asayiş haberlerini eleyen ve sadece "kamu, piyasa veya güvenlik etkisi" olan haberleri öne çıkaran metadata tabanlı deterministic bir skorlama motoru yatar.

## 2. AI Haber Değeri Motoru (Deterministic Scoring)

Bu motor, aşağıdaki skoring faktörlerini hesaplayıp haberin gösterim stratejisini belirler:

**Skorlar:**
*   `newsValueScore`: 0-100 (Haber değeri skoru)
*   `noiseScore`: 0-100 (Clickbait / Gürültü skoru)
*   `personalPriorityBoost`: 0-30 (Kişisel ilgi yükseltmesi)
*   `personalizedScore`: `min(100, newsValueScore + personalPriorityBoost)`

**Legal Order (Öncelik 1):**
Önce legal eligibility çalışır. `DISABLED` / `NEEDS_REVIEW` veya "lisanssız ajans" kaynakları `HIDE_LEGAL_BLOCKED` olarak etiketlenir. Bu kaynaklar skorla veya kişisel ayarla kurtarılamaz.

**Kaynak Bonusları:**
*   `OFFICIAL_PUBLIC_SOURCE`: +40 (Örnek: AFAD, TCMB, KAP, SPK, TÜİK, USGS)
*   `SOURCE_PROFILE_STRONG` / `REPUTABLE`: +20
*   *Özel Ajans Notu:* AA, DHA, İHA, Reuters, AP, AFP gibi ajanslar, legal olarak lisans yoksa veya sözleşme geçerli değilse pozitif skor alamaz; legal blocker önce işler.

**Kategori Bonusları:**
*   Afet / kamu güvenliği: +40
*   Ekonomi / piyasa / TCMB / KAP / SPK: +30
*   Resmi kurum duyurusu: +30
*   Uluslararası kriz / savaş / diplomasi: +25
*   Teknoloji / AI kritik gelişme: +20

**Başlık / Metadata Keyword Bonusları:**
*   Etki Sinyalleri ("karar", "açıklandı", "faiz", "atama", "deprem M≥5", "düzenleme", "soruşturma", "yaptırım", "bilanço"): +10 ile +20 arası.
*   Tüm `newsValueScore` hesaplamaları 100 ile sınırlandırılır (cap edilir).

**Noise Score (Clickbait / Gürültü):**
*   Soru oltası: "...mi oldu?", "nerede oldu?", "ne zaman?" => +50
*   Clickbait kalıpları: "şoke eden", "işte o detay", "görenleri şaşırt...", "korkutan", "son dakika deprem mi oldu?" => +40/+60
*   Magazin / düşük değerli yerel asayiş / 3. sayfa: +60
*   SEO evergreen deprem başlıkları: +70

## 3. Decision Thresholds (Karar Eşikleri)

Sistem aşağıdaki kurallara göre haberleri yönlendirir:

1.  `noiseScore > 50` => `HIDE_CLICKBAIT` veya `HIDE_LOW_VALUE`
2.  `baseNewsValueScore >= 85` => `SHOW_MAIN` (Global critical override - kişisel tercih ve filtreleri ezer)
3.  `personalizedScore >= 75` => `SHOW_MAIN`
4.  `personalizedScore` 40-74 => `SHOW_MONITORING`
5.  `personalizedScore < 40` => `HIDE_LOW_VALUE`

**Global vs. Personal (Kişisel ve Genel Denge):**
*   Kritik afet, kamu güvenliği veya çok önemli resmi duyurular (`newsValueScore >= 85`) kullanıcı tercihlerinden bağımsız olarak her zaman gösterilir.
*   Kişisel ilgi yalnızca destek (boost) verir. Örneğin, kullanıcı Ekonomi/Piyasa seçtiyse ilgili haberlere `+30 personalPriorityBoost` verilir. Fakat legal blocker veya yüksek `noiseScore` aşılamaz.
*   Kullanıcı spor veya magazin konularını kapatsa dahi, bu alandaki global kritik haberler (eğer olursa ve `noiseScore` düşükse) gösterilebilir.

## 4. Metadata-only AI Input Contract

Sistem, değerlendirmeleri yaparken sadece metadata tabanlı çalışır:

**Kullanılabilir Alanlar:**
*   `title`, `sourceName`, `publishedAt`, `category/section`, `canonicalUrl/originalLink`, `source profile / authorityTier / legalMode`, `sourceCount / cluster signal`, `publishReason / warningLabel`, `user-selected local interests`.

**Kesinlikle Yasaklı Alanlar:**
Haber makale icerigi, html, image, caption, video/audio transcript, OCR veya kazınmış herhangi bir detay. Mobilde API/LLM key barındırılması ve kullanıcı onayı olmadan gerçek bir LLM çağrısı yapılması yasaktır.

## 5. UI Önerisi ve Karşılıkları

**SHOW_MAIN (Öncelikli Akış):**
*   Ana ekranda üst sıralarda yer alır.
*   Büyük kart tasarımı kullanılır.
*   Haber değeri etiketi ve "Neden gösterildi?" açıklaması yer alır.

**SHOW_MONITORING (Gelişen Kayıtlar):**
*   İzlemeye alınan haberleri temsil eder.
*   Daha kompakt bir liste/kart tasarımı kullanılır.
*   Tek kaynak / kaynak sinyali veya düşük/orta sinyal etiketi belirgindir.

**HIDE_CLICKBAIT / HIDE_LOW_VALUE:**
*   Ana akışta ve izleme listesinde gösterilmez (gizlenir).
*   Gerekirse hata ayıklama (debug/evidence) ekranlarında `reasonCode` ile görüntülenir.

**Anlık Radar (Paneller):**
*   Son büyük depremler (M≥5), TCMB / KAP duyuruları, piyasa göstergeleri.
*   Kaynak sağlık durumu ve son yenileme detayları.
*   RSS Metadata Önizlemesi (Geliştirici/şeffaflık alanı).

## 6. Haber Kartı Önerisi

Klasik bir haber resmi/özeti yerine, analitik bir kart tasarımı kullanılmalıdır:

```text
[BIST 100 endeksinde yeni rekor kapanış]
Bloomberg HT · 12 dk önce

Haber değeri: Yüksek
Sinyal: Tek kaynak / kaynak sinyali
Neden gösterildi: Ekonomi etkisi ve kaynak profili uygun.

Uyarı: Bu sinyal haberin doğruluğunu tek başına garanti etmez.

[ Orijinal kaynağa git ]
```

## 7. Legal ve Güvenli Dil Kuralları

**Kullanılacak Güvenli Dil:**
*   Haber değeri
*   Kaynak sinyali
*   Akış değerlendirmesi
*   Tek kaynak / kaynak sinyali
*   Çok-kaynaklı sinyal
*   Düşük haber değeri
*   Clickbait riski
*   Orijinal kaynağa git
*   "Bu sinyal haberin doğruluğunu tek başına garanti etmez."

**Kullanılmayacak (Yasaklı) Dil:**
*   Teyit edildi, mutlak gercek, uydurma icerik yakalar, yapay zeka üzerinden teyit veya yargı belirten çıkarımlar (örn: yapay zeka teyidi vb.), ham makale icerigi. 
*(Not: Bu metinde sadece kullanım dışı kuralları listelemek amacıyla kelimeler örneklenmiştir.)*

## 8. Roadmap

Geliştirme süreci tamamen bu stratejiye dayalı ilerleyecektir:

1.  **A.** PR #76 (ui-rss-feel-v0) device smoke testini bekler.
2.  **B.** AI News Value Engine v0 plan (Bu doküman) review edilir.
3.  **C.** Metadata-only scoring engine backend implementasyonuna başlanır.
4.  **D.** UI kart ve panel yapıları iyileştirilir.
5.  **E.** Local-first kişiselleştirme ayarları eklenir.
6.  **F.** Anlık veri panelleri (Deprem, BIST vb.) bağlanır.
7.  **G.** Gerçek LLM pilotu en son, sadece kullanıcı izniyle test edilir.
