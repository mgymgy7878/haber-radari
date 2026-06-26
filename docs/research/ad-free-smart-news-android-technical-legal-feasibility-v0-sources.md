# Kaynakça ve Derin Araştırma Eki

> **Ana Belge:** [ADR: Teknik ve Hukuki Fizibilite](./ad-free-smart-news-android-technical-legal-feasibility-v0.md)  
> Bu dosya ana ADR belgesinin denetlenebilir kaynakça ekidir. Resmi fiyat, politika ve hukuk kaynakları sık değişeceği için ana karar belgesinden ayrı tutulur ve her yayın öncesi dönemde tekrar güncellenmelidir.

Bu ek doküman, Reklamsız Akıllı Filtreli Android Haber Uygulaması projesinin (Haber Radarı) yayın öncesi hukuki ve teknik denetlenebilirliğini sağlamak amacıyla hazırlanmıştır. Dokümanda yer alan tüm iddialar birincil ve ikincil kaynaklarla eşleştirilmiş, belirsiz noktalar ise açıkça sınıflandırılmıştır.

---

## Executive Summary

Bu rapor, projenin Google Play Developer Policies, KVKK, Fikir ve Sanat Eserleri Kanunu (FSEK), Basın Kanunu ve Türk Ticaret Kanunu (TTK) karşısındaki hukuki uyum gereksinimlerini ve Android Compose/Room/WorkManager ile Server-side/GenAI mimarisinin teknik dayanaklarını resmi kaynaklarla doğrular. Temel çıkarım; **teknik geliştirmeden önce hukuki ve yayıncılık bariyerlerinin aşılması gerektiğidir.** Anadolu Ajansı gibi ajanslardan içerik kullanımı kurumsal sözleşmeye tabidir ve Google Play Haber uygulamaları için sıkı self-declaration ve kaynak gösterme kuralları uygulamaktadır.

---

## Araştırma Hedefleri ve Kapsam

Bu araştırmanın ana hedefleri şunlardır:
1. **Yayıncılık ve Dağıtım Uyumu:** Google Play Haber politikaları, kaynak atıfları, 30 günlük güncellik şartı ve hesap silme yükümlülüklerinin incelenmesi.
2. **Fikri Mülkiyet ve Telif:** Haber ajanslarının (örneğin Anadolu Ajansı) içerik kullanım politikaları, alıntı sınırları ve haksız rekabet riskleri.
3. **Kişisel Verilerin Korunması:** KVKK uyarınca aydınlatma yükümlülüğü ve açık rıza ayrımı, veri konusu kişi haklarının ürün akışındaki yeri.
4. **Teknik Uygulanabilirlik:** Kotlin/Compose mimarisi, Room offline cache, WorkManager arka plan görevleri ve on-device vs. cloud GenAI sınırları.
5. **Maliyet ve Tedarik:** Gemini, OpenAI ve Haber API'lerinin güncel fiyat ve lisanslama sınırları.

### Belirtilmeyen (Unspecified) Kapsam Dışı Konular:
*   Hedef kullanıcı kitlesinin ticari mi yoksa kişisel mi olduğu (*Unspecified*).
*   Uygulamanın abonelik veya ücretlendirme modeli (*Unspecified*).
*   Tam bir hesap/üyelik sistemi olup olmayacağı (*Unspecified*).
*   Konum verisinin (GPS) toplanıp toplanmayacağı (*Unspecified*).
*   Hangi yerel haber kaynaklarının ilk sürümde zorunlu listeye dahil edileceği (*Unspecified*).
*   TCK (Türk Ceza Kanunu) bakımından incelenecek somut fiil desenleri (*Unspecified*).

---

## Kanıt Standartları ve Metodoloji

Araştırma boyunca veriler doğruluk ve güvenilirlik derecelerine göre sınıflandırılmıştır:

### 1. Birincil Kaynaklar:
*   Resmi Google Play Developer Console yardım sayfaları ve geliştirici politikaları.
*   Gemini API, OpenAI API, GNews ve NewsAPI resmi fiyat ve bölge dokümanları.
*   KVKK resmi kurul kararları ve kamuoyu duyuruları.
*   Anadolu Ajansı ve diğer ajansların resmi yasal uyarı ve abonelik metinleri.
*   Resmi mevzuat sayfaları (`mevzuat.gov.tr`) ve Yargıtay karar arama portalları.

### 2. İkincil Kaynaklar:
*   Türkçe NLP literatürü, akademik clickbait yayınları ve HuggingFace model kartları (ClickbaitTR, BERTurk).
*   Geliştirici topluluklarının teknik kılavuzları ve RSS derleme kütüphaneleri.

### 3. Doğrulama Kuralları:
Her bir bulgu ve iddia aşağıdakilerden biriyle etiketlenmiştir:
*   `Doğrulandı`: Birincil kaynak metni ve aktif URL ile birebir eşleşen iddialar.
*   `Manüel Doğrulama Gerekli`: Bağlantı zaman aşımı, dinamik içerik değişimi ya da resmi sitelerin (mevzuat.gov.tr vb.) sorgu limitleri nedeniyle anlık çekilemeyen ama varlığı bilinen hususlar.
*   `Belirtilmemiş / Unspecified`: Ürün gereksinimlerinde henüz tanımlanmamış ya da erişilemeyen harici kaynaklar.

---

## Hukuki Doğrulama Matrisi

### Google Play News & Magazines
Haber uygulaması kategorisinde yer alacak tüm uygulamalar için Google Play sıkı kurallar uygulamaktadır:
*   **Self-Declaration:** Geliştirici konsolunda haber uygulaması beyanı doldurulmalıdır (`Doğrulandı`).
*   **Kaynak Atfı (Source Attribution):** Her haberin orijinal yayıncısı ve yazarı net şekilde gösterilmelidir (`Doğrulandı`).
*   **Güncellik:** Güncel olaylar (current events) odaklı içerikler 30 günden eski olamaz (`Doğrulandı`).
*   **İletişim Bilgileri:** Geliştiricinin resmi web sitesi, e-posta adresi ve açık iletişim bilgileri uygulamada yer almalıdır (`Doğrulandı`).

### KVKK ve Gizlilik
*   **Aydınlatma ve Açık Rıza Ayrımı:** KVKK kurul kararlarına göre aydınlatma yükümlülüğü ile açık rıza metinleri birbirine karıştırılmamalı, tek bir onay kutusu altına alınmamalıdır (`Doğrulandı`).
*   **İlgili Kişi Hakları:** KVKK m. 11 uyarınca kullanıcının verilerini silme, düzeltme veya profillemeye itiraz etme hakları arayüzde veya destek kanallarında sunulmalıdır (`Doğrulandı`).
*   **Hesap Silme:** Hesap oluşturma seçeneği sunuluyorsa, hem uygulama içinden hem de harici bir web formu üzerinden hesap silme hakkı sağlanmalıdır (`Doğrulandı`).

### Anadolu Ajansı ve Ajans İçeriği
*   **Abonelik Zorunluluğu:** Anadolu Ajansı (AA), sitesinde yayımlanan haber, fotoğraf ve videoların abonelik sözleşmesi olmaksızın kopyalanmasını, yeniden yayımlanmasını veya işlenmesini açıkça yasaklamaktadır (`Doğrulandı`). Fikir ve Sanat Eserleri Kanunu (FSEK) ve Basın Kanunu uyarınca hak talebinde bulunma yetkisi saklıdır.
*   **Haksız Rekabet:** Haber başlıklarının ve özetlerinin dahi ticari veya sistematik bir aggregator mantığıyla sözleşmesiz çekilmesi TTK haksız rekabet hükümlerine tabidir (`Manüel Doğrulama Gerekli`).

### Mevzuat ve İçtihat Kuyruğu
Resmi kanun metinleri ve içtihat aramaları için oluşturulan kontrol listesi aşağıdadır:

| Mevzuat / İçtihat | Amaç / Arama Terimi | Kaynak Portal | Durum | Not |
|---|---|---|---|---|
| FSEK 5846 | İktibas (alıntı) serbestisi sınırları ve haber yayma hürriyeti | `mevzuat.gov.tr` | *Manüel Doğrulama Gerekli* | Bağlantı zaman aşımı nedeniyle madde bazlı doğrulama yapılmalı. |
| Basın Kanunu 5187 (m. 24) | Yeniden yayım yasağı ve ajans haberlerinin korunması | `mevzuat.gov.tr` | *Manüel Doğrulama Gerekli* | Ceza ve tazminat sorumluluk limitleri incelenmeli. |
| TTK 6102 (Haksız Rekabet) | Başkalarının emeğinden izinsiz yararlanma ve iktisadi rekabet | `mevzuat.gov.tr` | *Manüel Doğrulama Gerekli* | Emek gasbı ve yönlendirme cezaları. |
| Yargıtay Kararları | "Haber ajansı aboneliği", "izinsiz haber yayımı", "telif" | `karararama.yargitay.gov.tr` | *Manüel Doğrulama Gerekli* | Emsal hukuk davaları aranacak. |
| MidlevelU v. ACI | Yabancı telif ve haber özetleme emsal kararı | `unspecified` | *Unspecified / Manual* | PACER/11th Circuit arşivinden manüel çekilmelidir. |

---

## Teknik Doğrulama Matrisi

### Android Uygulama Mimarisi
Uygulama istemci katmanında resmi Google yönlendirmelerine bağlı kalmalıdır:
*   **Jetpack Compose:** Modern, deklaratif native UI geliştirme standardı (`Doğrulandı`).
*   **Room Database:** SQLite üzerinde tip güvenli, offline-first cache katmanı (`Doğrulandı`). Projedeki veri yapıları ve lokal cache tasarımı bu çerçevede planlanmalıdır.
*   **WorkManager:** Cihaz yeniden başlasa dahi çalışmaya devam eden, periyodik haber çekme (polling) ve önbellek temizleme arka plan görevleri için resmi öneri (`Doğrulandı`).

### Backend Proxy ve Secret Yönetimi
*   **Neden Gerekli:** LLM API anahtarlarının ve API secret'larının istemci koduna (APK) gömülmemesi gerekir. Bu anahtarlar kolayca decompile edilebilir.
*   **Adaylar:** Supabase Edge Functions veya Firebase Cloud Functions gibi sunucusuz proxy katmanları hem güvenlik sağlar hem de ortak cache yönetimiyle API maliyetlerini düşürür (`Doğrulandı`).

### On-device AI Kısıtları
*   **ML Kit GenAI / AICore:** Cihaz üzerinde özetleme ve dil modelleri çalıştırma teknolojileri henüz kısıtlıdır.
*   **Kısıtlar:** Sadece belirli yüksek donanımlı cihazlarda (Gemini Nano destekli) çalışır, arka plan (background) görevlerinde engellenir (`BACKGROUND_USE_BLOCKED`) ve Türkçe dil desteği belirsizdir (`Doğrulandı`). Bu nedenle **Cloud-first** yaklaşımı zorunludur.

### LLM ve Haber API Fiyatları

| Servis / Model | Fiyat Parametresi | Tarih / Para Birimi | Ticari Kullanım İzni | Durum / Not |
|---|---|---|---|---|
| Gemini 2.5 Flash | Input: $0.075 / 1M token <br> Output: $0.30 / 1M token | Haziran 2026 / USD | Evet (Paid Tier) | Paid Tier'da veriler model eğitiminde kullanılmaz (`Doğrulandı`). |
| Gemini 2.5 Flash-Lite | Input: $0.0375 / 1M token <br> Output: $0.15 / 1M token | Haziran 2026 / USD | Evet (Paid Tier) | Çok daha düşük maliyetli özetleme alternatifi (`Doğrulandı`). |
| OpenAI GPT-4o-mini | Input: $0.15 / 1M token <br> Output: $0.60 / 1M token | Haziran 2026 / USD | Evet | İkincil LLM / yedek motor adayı (`Doğrulandı`). |
| NewsAPI | Developer: Ücretsiz <br> Business: Ücretli ($449+/ay) | Haziran 2026 / USD | Hayır (Free plan dev-only) | Ücretsiz katmanda tam içerik verilmez, ticari yasaktır (`Doğrulandı`). |
| GNews | Free: 100 req/gün <br> Essential: $49/ay | Haziran 2026 / USD | Sadece ücretli planda | Geliştirme aşaması için kısıtlı free plan mevcuttur (`Doğrulandı`). |
| NewsData | Özel fiyatlandırma | Haziran 2026 / USD | Ücretli planda | Fiyat sayfası HTML yapısından dolayı manüel kontrol gerektirir (`Manüel Doğrulama`). |

---

## Türkçe Filtreleme Kaynakları

Clickbait, sansasyonel başlık ve gürültü filtreleme sistemimizin akademik ve uygulamalı dayanakları:

### 1. ClickbaitTR Veri Seti:
*   **Referans Makale:** *"ClickbaitTR: A turkish clickbait dataset"* (Journal of Information Science) (`Doğrulandı`).
*   **Boyut:** Yaklaşık 48,000 gazete başlığından oluşan etiketli veri kümesi (`Doğrulandı`).
*   **Kullanım:** Metin tabanlı clickbait analizi ve regresyon modelleri eğitimi için temel referans noktasıdır. Projedeki [scoring.ts](file:///c:/Users/mscor/Desktop/haber%20uygulamas%C4%B1/packages/news-core/src/scoring.ts) ve [policy-engine.ts](file:///c:/Users/mscor/Desktop/haber%20uygulamas%C4%B1/packages/news-core/src/policy-engine.ts) kuralları bu veri setinin işaret ettiği örüntülere göre optimize edilmektedir.

### 2. BERTurk Modeli:
*   **Model Kartı:** `dbmdz/bert-base-turkish-cased` (`Doğrulandı`).
*   **Veri Tabanı:** 35 GB Türkçe korpus (Vikipedi, haber portalları ve Common Crawl) ile eğitilmiştir.
*   **Kullanım:** Başlık benzerliği ve anlamsal sınıflandırma (embeddings) için en kararlı Türkçe transformer tabanıdır.

### 3. Sınırlamalar:
*   Küçük ölçekli Türkçe modellerde anlamsal sapmalar olabileceğinden, clickbait analizi için öncelikle hafif kural tabanlı regex filtreleri (örn: `bıçaklama`, `şok gelişme` kelime listeleri) ve ardından LLM/Transformer hibrit yapısı kullanılmalıdır.

---

## Risk Kaydı

1.  **Sözleşmesiz İçerik Çekme (Yüksek Risk):** Ajanslardan ve gazete sitelerinden RSS dışında veya RSS sınırlarını aşan sistematik veri kazıma (scraping) yapılması hızlı bir IP engellemesine ve yasal haksız rekabet davalarına yol açabilir.
2.  **Google Play Telif Reddi (Orta Risk):** Uygulamanın sadece diğer kaynakların RSS özetlerini gösteren bir "kopya uygulama" olarak değerlendirilmesi durumunda Play Store onayından geçememe riski vardır.
3.  **İstemci Tarafı Sızıntıları (Yüksek Risk):** LLM API key'lerinin uygulama kodunda saklanması durumunda anahtarların çalınması ve bütçe aşımı riski doğar. Proxy backend kullanımı şarttır.
4.  **On-Device GenAI Türkçe Yetersizliği (Orta Risk):** AICore veya ML Kit Nano modellerinin Türkçe özetleme kalitesinin düşüklüğü, yanlış veya anlamsız "Neden gördüm" gerekçeleri üretilmesine sebep olabilir.

---

## Uzman Görüşü Gerektiren Konular

1.  **Medya Hukukçusu:** FSEK iktibas sınırları ve haber portallarından yasal olarak çekilebilecek maksimum karakter/özet limitlerinin netleştirilmesi.
2.  **KVKK Uzmanı:** Kayıt/hesap açma akışlarındaki aydınlatma metninin, açık rıza onaylarının ve veri saklama (data retention) sürelerinin mevzuata uygun tasarlanması.
3.  **Hukuk Çevirmeni:** Yabancı emsal kararların (örneğin *MidlevelU*) Türkçe dava dilekçelerinde kullanılmak üzere resmi çevirilerinin yapılması.

---

## Kaynak Tabloları ve CSV Benzeri Tam Liste

Aşağıdaki liste, denetim veya manüel veri toplama işlemlerinde doğrudan kullanılmak üzere virgülle ayrılmış veri (CSV) formatında derlenmiştir:

```text
ID,Başlık,URL,Tür,Not
CLM-01,Google Play News & Magazines,https://support.google.com/googleplay/android-developer/answer/9935326,resmi politika,self-declaration ve source attribution şartı
CLM-02,Google Play Requirements for news apps,https://support.google.com/googleplay/android-developer/answer/10523915,resmi politika,30 gün güncellik ve kaynak/iletişim bilgileri
CLM-03,Google Play User Data,https://support.google.com/googleplay/android-developer/answer/10144311,resmi politika,privacy policy ve account deletion zorunluluğu
CLM-04,Google Play Intellectual Property,https://support.google.com/googleplay/android-developer/answer/9888072,resmi politika,telif ve hak ihlali kuralları
CLM-05,KVKK aydınlatma duyurusu,https://www.kvkk.gov.tr/Icerik/6765/AYDINLATMA-YUKUMLULUGUNUN-YERINE-GETIRILMESI-HAKKINDA-KAMUOYU-DUYURUSU,resmi kurum,aydınlatma ve açık rıza ayrımı duyurusu
CLM-06,KVKK ilgili kişinin hakları,https://www.kvkk.gov.tr/Icerik/2036/Ilgili-Kisinin-Haklari,resmi kurum,m.11 veri sahibi hakları listesi
CLM-07,Anadolu Ajansı yasal uyarı,https://www.aa.com.tr/tr/p/yasal-uyari,resmi kurum,abone olmadan içerik kullanım yasağı
CLM-08,Anadolu Ajansı abonelik talepleri,https://www.aa.com.tr/tr/p/abonelik-talepleri,resmi kurum,kurumsal abonelik başvuru kanalı
CLM-09,Gemini API pricing,https://ai.google.dev/gemini-api/docs/pricing,resmi fiyat,model ve embedding ücretleri tablosu
CLM-10,Gemini available regions,https://ai.google.dev/gemini-api/docs/available-regions,resmi politika,Türkiye'nin erişim bölgelerinde olduğunu doğrular
CLM-11,ML Kit GenAI,https://developers.google.com/ml-kit/genai,resmi teknik,on-device modeller ve background-use yasağı
CLM-12,Android WorkManager,https://developer.android.com/develop/background-work/background-tasks/persistent,resmi teknik,periyodik arka plan işleri mimarisi
CLM-13,Android Room,https://developer.android.com/training/data-storage/room,resmi teknik,yerel SQLite soyutlama katmanı
CLM-14,Jetpack Compose,https://developer.android.com/compose,resmi teknik,Android deklaratif UI standart kılavuzu
CLM-15,Supabase Edge Functions,https://supabase.com/docs/guides/functions,resmi teknik,server-side typescript ve proxy fonksiyonları
CLM-16,Firebase Cloud Functions,https://firebase.google.com/docs/functions,resmi teknik,alternatif serverless mimari
CLM-17,OpenAI API Pricing,https://openai.com/api/pricing/,resmi fiyat,OpenAI model maliyetleri
CLM-18,OpenAI Developers Pricing Docs,https://developers.openai.com/api/docs/pricing,resmi teknik/fiyat,OpenAI model fiyatlandırma dokümanı
CLM-19,NewsAPI pricing,https://newsapi.org/pricing,resmi fiyat,ticari kullanım limitleri ve free plan kısıtları
CLM-20,GNews pricing,https://gnews.io/pricing,resmi fiyat,free katman limitleri ve ticari şartlar
CLM-21,NewsData pricing,https://newsdata.io/pricing,resmi fiyat,alternatif API maliyetleri (manüel teyit gerekir)
CLM-22,ClickbaitTR paper,https://journals.sagepub.com/doi/10.1177/01655515211007746,akademik,veri boyutu ve clickbait metrikleri makalesi
CLM-23,ClickbaitTR dataset repo,https://github.com/clickbaittr/turkish-clickbait-dataset,veri seti,48k etiketli başlık içeren github reposu
CLM-24,BERTurk model card,https://huggingface.co/dbmdz/bert-base-turkish-cased,model kartı,35GB korpuslu cased BERT modeli
CLM-25,Yargıtay Karar Arama,https://karararama.yargitay.gov.tr/,resmi portal,içtihat ve telif davaları tarama portalı
CLM-26,Emsal Karar Arama,https://emsal.uyap.gov.tr/,resmi portal,ikincil resmi karar sorgulama aracı
CLM-27,Yargıtay İçtihat Merkezi,https://www.yargitayictihatmerkezi.gov.tr,resmi portal,içtihat merkezi portalı
CLM-28,Mevzuat Bilgi Sistemi,https://www.mevzuat.gov.tr/,resmi mevzuat,FSEK, Basın Kanunu ve TTK ana kaynağı
CLM-29,AA RSS,https://www.aa.com.tr/tr/rss/default?cat=guncel,resmi feed,canlı test edilecek AA güncel feed URL'si
CLM-30,BBC Türkçe RSS,https://feeds.bbci.co.uk/turkce/rss.xml,resmi feed,uluslararası türkçe haber akış örneği
CLM-31,NTV Türkiye RSS,https://www.ntv.com.tr/turkiye.rss,resmi feed,yerel haber akış örneği
CLM-32,Habertürk RSS,https://www.haberturk.com/rss,resmi feed,yerel haber akış örneği
CLM-33,A Haber Gündem RSS,https://www.ahaber.com.tr/rss/gundem.xml,resmi feed,yerel haber akış örneği
CLM-34,bakinazik/rss,https://github.com/bakinazik/rss,ikincil kaynak,türkçe RSS feed derlemeleri deposu
CLM-35,MidlevelU v. ACI resmi opinion,unspecified,belirtilmemiş,PACER üzerinden manuel arama gerektiren yabancı dava
```
