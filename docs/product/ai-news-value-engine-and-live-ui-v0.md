# AI News Value Engine \u0026 Live UI (v0)

Bu doküman, Haber Radarı'nın "yapay zeka haber değeri motoru" (AI News Value Engine) ve "anlık veri panelleri" mimarisini tanımlar. Amacımız, Google Play hazırlığı gibi operasyonel süreçlerden ziyade çekirdek kullanıcı deneyimine ve uygulamanın zekasına odaklanmaktır.

## 1. Executive Verdict

Haber Radarı'nın yeni önceliği; kişisel kullanım deneyimini mükemmelleştirmek, AI haber değeri filtresiyle gürültüyü engellemek, arayüzü zenginleştirmek ve anlık veri panelleri sunmaktır.
Sistemin kalbinde, clickbait/asayiş haberlerini eleyen ve sadece "kamu, piyasa veya güvenlik etkisi" olan haberleri öne çıkaran metadata tabanlı bir skorlama motoru yatar.

## 2. AI Haber Değeri Motoru

Bu motor, aşağıdaki skoring faktörlerini hesaplayıp haberin gösterim stratejisini belirler:

*   **Haber Değeri Skoru:** Haberin genel kamuoyu/toplumsal/ekonomik etkisinin büyüklüğü.
*   **Clickbait Riski:** Haberin başlık formatı veya eksik bilgisiyle sırf merak uyandırmak için tasarlanmış olma ihtimali.
*   **Düşük Değer/Gürültü Skoru:** Asayiş, yerel magazin, 3. sayfa türü spesifik ve dar etkili olayların ölçümü.
*   **Genel Önem Skoru:** Haber değeri skoru yüksek, gürültü ve clickbait skoru düşük olan içeriklerin final notu.
*   **Kişisel İlgi Skoru:** Kullanıcının (local-first) beyan ettiği ilgi alanlarıyla örtüşme durumu.
*   **Kaynak Profili Skoru:** Haberin geldiği kaynağın `authorityTier` ve `legalMode` güvenilirlik katsayısı.
*   **Tek Kaynak / Çok Kaynak Ayrımı:** Olayın birden fazla kaynaktan doğrulanıp doğrulanmadığını belirten katsayı.

## 3. Metadata-only AI Input Contract

Sistem, yapay zekaya (LLM) **asla** haberin tamamını göndermez. Sadece metadata-only sınırlarında kalır.

**Kullanılabilir Alanlar:**
*   `title` (Başlık)
*   `sourceName` (Kaynak Adı)
*   `publishedAt` (Yayın Zamanı)
*   `category/section` (Kategori)
*   `canonicalUrl/originalLink` (Orijinal URL)
*   `source profile / authorityTier / legalMode` (Kaynak Yasal ve Yetki Profili)
*   `sourceCount / cluster signal` (Küme / Kaynak Sayısı Sinyali)
*   `publishReason / warningLabel` (Yayınlanma Nedeni)
*   `user-selected local interests` (Kullanıcı Profil Tercihleri)

**Kesinlikle Yasaklı Alanlar:**
Haber tam içeriği (body), html, image, caption, video/audio transcript, OCR veya kazınmış herhangi bir detay (scraped details). LLM analizleri lokal metadata üzerinde çalışmalı ve gerçek bir LLM API pilotu kullanıcı onayı olmadan bağlanmamalıdır.

## 4. Sınıflandırma Kararları (Output Enum)

AI motoru aşağıdaki mantıksal kararlardan birini üretir:

*   `SHOW_MAIN`: Öncelikli akışta gösterilecek kadar önemli ve/veya çok kaynaklı haber.
*   `SHOW_MONITORING`: İzleme listesine alınacak, henüz gelişmekte olan veya kişisel ilgi alanına giren haber.
*   `HIDE_LOW_VALUE`: 3. sayfa, magazin veya dar etkili asayiş haberi (gizlenir).
*   `HIDE_CLICKBAIT`: SEO oltası veya merak tuzağı (gizlenir).
*   `HIDE_LEGAL_BLOCKED`: `DISABLED` veya `NEEDS_REVIEW` statüsündeki yasal engelli kaynak (gizlenir).
*   `SHOW_CRITICAL_SINGLE_SOURCE`: Tek kaynaklı ama etkisi yüksek (örn. AFAD deprem) olduğu için ana akışta "uyarı etiketiyle" gösterilecek kayıt.
*   `SHOW_GENERAL_IMPORTANT`: Kişisel öncelik olmasa da herkesin bilmesi gereken ana başlık.

## 5. Haber Değeri Kuralları

**Yüksek Değer:**
*   Afet / deprem / kamu güvenliği anonsları
*   Ekonomi / piyasa etkisi yaratacak regülasyonlar (TCMB, KAP, BIST)
*   Resmi kurum duyuruları (Bakanlıklar, Valilikler vb.)
*   Geniş toplumsal etki yaratan makro olaylar
*   Uluslararası kriz / savaş / diplomasi gelişmeleri
*   Teknoloji / AI alanında sektörü dönüştüren kritik gelişmeler

**Düşük Değer / Gürültü:**
*   Magazin ve popüler kültür dedikoduları
*   3. sayfa ve sadece bireyleri ilgilendiren asayiş olayları
*   Soru işaretiyle biten merak tuzağı başlıkları ("...deprem mi oldu?")
*   Gizem yaratan başlıklar ("...bunu gören şaştı", "...işte o detay")
*   Salt SEO amacıyla tekrarlanan jenerik içerikler

## 6. UI Önerisi

Uygulama arayüzü artık sadece bir "liste" değil, bir "kontrol paneli" (dashboard) hissiyatı vermelidir.

**Ana Ekran Panelleri:**
*   Öncelikli Akış (Yüksek değerli gelişmeler)
*   Gelişen Kayıtlar (İzlemeye alınanlar)
*   Anlık Radar (Saniyeler içinde düşen son veriler)
*   Deprem / Afet Modülü
*   Piyasa / Ekonomi Özeti
*   Resmi Duyurular Köşesi
*   Kaynak Sağlığı (Bağlantı ve entegrasyon durumları)
*   RSS Metadata Önizlemesi (Geliştirici/şeffaflık logu)

## 7. Haber Kartı Önerisi

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

## 8. Anlık Veri Panelleri

Haber akışının dışında, statik verilerin takip edilebileceği modüller:

*   Son büyük depremler (M≥4.0 liste)
*   M≥5 deprem radar alarmı
*   TCMB / KAP / SPK / TÜİK anlık duyuru sayacı
*   Piyasa göstergeleri (BIST, USD/TRY, EUR/TRY, Altın, BTC)
*   Kaynak sağlık durumu (Hangi ajanstan en son ne zaman veri geldi)
*   Haber yoğunluğu / Filtrelenen gürültü sayısı istatistiği

## 9. Kişisel Ayarlar

*   **Benim önceliklerim:** Kritik haberler her zaman göster, Ekonomi/piyasa göster, AI/teknoloji göster. Spor/magazin kapalı.
*   **Filtreler:** Clickbait filtresi (Normal / Sıkı), Tek kaynak davranışı (Göster / İzleme / Gizle).
*   **Deprem Eşiği:** M≥4.0, M≥5.0 vb. ayarlanabilir.
*   **Bildirim Yoğunluğu:** Sessiz / Dengeli / Kritik.

## 10. Roadmap

Geliştirme süreci tamamen bu stratejiye dayalı ilerleyecektir:

1.  **A.** PR #76 (ui-rss-feel-v0) device smoke testini bekler.
2.  **B.** AI News Value Engine v0 plan (Bu doküman) review edilir.
3.  **C.** Metadata-only scoring engine backend implementasyonuna başlanır.
4.  **D.** UI kart ve panel yapıları (React Native/Expo tarafında) iyileştirilir.
5.  **E.** Local-first kişiselleştirme ayarları eklenir.
6.  **F.** Anlık veri panelleri (Deprem, BIST vb.) bağlanır.
7.  **G.** Gerçek LLM pilotu en son, sadece kullanıcı izniyle test edilir.
