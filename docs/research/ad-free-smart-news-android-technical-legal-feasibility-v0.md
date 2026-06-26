# ADR: Reklamsız Akıllı Filtreli Android Haber Uygulaması — Teknik ve Hukuki Fizibilite

**Belge Türü:** Architecture Decision Record (ADR) / Fizibilite Raporu  
**Proje:** Haber Radarı  
**Sürüm:** v0 (Taslak)  
**Tarih:** 2026-06-26  
**Durum:** TASLAK — Yayın öncesi fiyatlar, API şartları, Play politikaları ve KVKK/GDPR yeniden doğrulanmalıdır.

---

## Belge Hakkında

Bu belge, Haber Radarı projesinin reklamsız, akıllı filtreli bir Android haber uygulaması olarak geliştirilmesine ilişkin **karar belgesidir (ADR)**. Teknik mimari tercihleri, hukuki uyum gereksinimleri, maliyet tavanları ve risk değerlendirmelerini içerir.

> **Rol Ayrımı:**
> - **Bu belge (ADR):** Kararların, tercihlerin ve risklerin kayıt altına alındığı ana referans belgesidir. Sık değişmez.
> - **Kaynakça ve Derin Araştırma Eki:** Resmi fiyat, politika ve hukuk kaynakları sık değişeceği için ayrı bir dosyada tutulur. Denetlenebilir kaynakça, doğrulama matrisi ve manüel doğrulama kuyruğunu içerir. Her yayın öncesi dönemde tekrar güncellenmelidir.

---

## 1. Bağlam ve Problem

Türkiye'deki haber tüketicileri reklam bombardımanı, clickbait başlıklar, sansasyonel 3. sayfa haberleri ve bilgi gürültüsüyle karşı karşıyadır. Mevcut haber uygulamaları genellikle reklam destekli modelle çalıştığından içerik kalitesi ile gelir modeli arasında yapısal bir çıkar çatışması vardır.

**Hedef:** Kullanıcıya yalnızca gerçekten önemli gelişmeleri sunan, reklamsız, kişisel bir haber radarı geliştirmek.

---

## 2. Karar Özeti

| Karar Alanı | Tercih | Gerekçe |
|---|---|---|
| **İstemci Platformu** | Android (Kotlin/Compose) | Türkiye'de %85+ Android pazar payı |
| **UI Çerçevesi** | Jetpack Compose | Google'ın resmi deklaratif UI standardı |
| **Yerel Veritabanı** | Room (SQLite) | Offline-first cache; tip güvenli sorgular |
| **Arka Plan İşleri** | WorkManager | Cihaz yeniden başlasa da devam eden periyodik görevler |
| **LLM Katmanı** | Cloud-first (Gemini 2.5 Flash-Lite birincil) | On-device Türkçe desteği yetersiz; AICore arka planda engelli |
| **Yedek LLM** | OpenAI GPT-4o-mini | Failover ve çapraz doğrulama |
| **Backend Proxy** | Supabase Edge Functions / Firebase CF | API key güvenliği; cache ile maliyet düşürme |
| **İçerik Kaynağı** | Yalnızca açık RSS beslemeleri (v0) | Hukuki risk minimizasyonu; ajans sözleşmesi v1'e ertelendi |
| **Clickbait Filtresi** | Hibrit (regex kural tabanlı + LLM/BERTurk) | Küçük Türkçe modellerde anlamsal sapma riski |

---

## 3. Hukuki Uyum Gereksinimleri

### 3.1 Google Play Politikaları

- **Self-Declaration:** Haber uygulaması beyanı zorunludur.
- **Kaynak Atfı:** Her haberin orijinal yayıncısı ve yazarı gösterilmelidir.
- **Güncellik:** 30 günden eski güncel olaylar içeriği barındırılamaz.
- **İletişim Bilgileri:** Geliştirici web sitesi, e-posta ve iletişim bilgileri uygulama içinde yer almalıdır.
- **Hesap Silme:** Hesap oluşturma sunuluyorsa, uygulama içi ve web form üzerinden silme hakkı sağlanmalıdır.

### 3.2 KVKK / Kişisel Veri Koruması

- Aydınlatma yükümlülüğü ve açık rıza metinleri **ayrı tutulmalıdır** (tek onay kutusu yasak).
- KVKK m.11 uyarınca silme, düzeltme ve profillemeye itiraz hakları sunulmalıdır.
- Veri saklama süreleri ve data retention politikası belirlenmelidir.

### 3.3 İçerik ve Telif Hakları

- **Anadolu Ajansı:** Abonelik sözleşmesi olmadan içerik çekme/işleme/yayımlama **yasaktır**.
- **FSEK İktibas Sınırları:** Madde bazlı manüel doğrulama gereklidir.
- **TTK Haksız Rekabet:** Sistematik aggregator mantığıyla sözleşmesiz başlık/özet çekmek risk taşır.
- **Emsal Arama:** Yargıtay ve UYAP portallarından "haber ajansı aboneliği", "izinsiz haber yayımı" araması yapılmalıdır.

---

## 4. Teknik Mimari (v0 Kararları)

### 4.1 İstemci Katmanı

```
Android App (Kotlin)
├── UI: Jetpack Compose
├── Cache: Room (SQLite)
├── Background: WorkManager (periyodik fetch)
├── Filtreleme: Kural tabanlı regex → LLM hibrit
└── Bildirim: Bildirim kuyruğu (push gönderimi v1)
```

### 4.2 Sunucu Katmanı

```
Backend Proxy (Supabase Edge / Firebase CF)
├── RSS Parser + Normalizasyon
├── LLM Gateway (Gemini Flash-Lite → GPT-4o-mini failover)
├── Ortak Cache (fiyat optimizasyonu)
└── API Key Vault (istemciye sızdırılmaz)
```

### 4.3 On-Device AI Kısıtları

ML Kit GenAI / AICore on-device modelleri şu nedenlerle v0'da kullanılmaz:
- Yalnızca belirli yüksek donanımlı cihazlarda çalışır (Gemini Nano destekli).
- Arka plan görevlerinde engellenir (`BACKGROUND_USE_BLOCKED`).
- Türkçe dil desteği belirsizdir.

**Karar:** Cloud-first yaklaşımı zorunludur.

---

## 5. Maliyet Tavanları (Haziran 2026)

| Servis | Fiyat | Not |
|---|---|---|
| Gemini 2.5 Flash-Lite | $0.0375 / 1M input token | En düşük maliyetli özetleme |
| Gemini 2.5 Flash | $0.075 / 1M input token | Daha yüksek kalite gerektiğinde |
| GPT-4o-mini | $0.15 / 1M input token | Yedek motor |
| GNews | $49/ay (Essential) | Geliştirme: ücretsiz 100 req/gün |
| NewsAPI | $449+/ay (Business) | Free plan ticari kullanıma kapalı |

> ⚠️ **Bu fiyatlar Haziran 2026 tarihlidir. Yayın öncesi güncel fiyatlar sources dosyasından doğrulanmalıdır.**

---

## 6. Risk Kaydı

| Risk | Seviye | Önlem |
|---|---|---|
| Sözleşmesiz içerik çekme → hukuki dava | 🔴 Yüksek | v0'da yalnızca açık RSS; ajans sözleşmesi v1'e ertelendi |
| Google Play telif reddi (kopya uygulama) | 🟡 Orta | Orijinal filtre/skor mantığı; kaynak atfı zorunlu |
| API key sızıntısı (APK decompile) | 🔴 Yüksek | Backend proxy zorunlu; istemciye key gömülmez |
| On-device GenAI Türkçe yetersizliği | 🟡 Orta | Cloud-first; on-device deney v2+ |
| LLM fiyat artışı | 🟡 Orta | Multi-provider failover; cache katmanı |

---

## 7. Belirlenmemiş (Unspecified) Konular

Aşağıdaki konular henüz proje gereksinimlerinde tanımlanmamıştır ve karar alınması gerekir:

- [ ] Hedef kitle: ticari mi, kişisel mi?
- [ ] Ücretlendirme / abonelik modeli
- [ ] Tam hesap/üyelik sistemi olup olmayacağı
- [ ] Konum verisi (GPS) toplanıp toplanmayacağı
- [ ] İlk sürümdeki zorunlu yerel haber kaynakları listesi
- [ ] TCK bakımından incelenecek somut fiil desenleri

---

## 8. Sonraki Adımlar

1. **Legal-Safe RSS Core v0:** Yalnızca açık RSS beslemeleriyle çalışan temel veri çekme iskeletinin oluşturulması.
2. **KVKK Aydınlatma Metni Taslağı:** Uzman görüşü alınarak hazırlanması.
3. **Google Play Self-Declaration Hazırlığı:** Haber uygulaması beyan formunun doldurulması.
4. **Mevzuat Manüel Doğrulama:** Sources dosyasındaki "Manüel Doğrulama Gerekli" kalemlerin tamamlanması.

---

## Kaynakça ve Derin Araştırma Eki

Bu ADR belgesindeki tüm hukuki, teknik ve ticari iddiaların birincil kaynaklarla eşleştirilmiş denetlenebilir listesi ayrı bir ekte tutulmaktadır:

📎 **[Kaynakça ve Derin Araştırma Eki](./ad-free-smart-news-android-technical-legal-feasibility-v0-sources.md)**

Bu ek aşağıdaki bileşenleri içerir:
- **Executive Summary** — Araştırma çıkarımlarının özeti
- **Hukuki Doğrulama Matrisi** — Google Play, KVKK, AA, FSEK, TTK kaynakları
- **Teknik Doğrulama Matrisi** — Android, LLM, API fiyatları
- **Türkçe Filtreleme Kaynakları** — ClickbaitTR, BERTurk referansları
- **Risk Kaydı** — Kaynaklarla eşleştirilmiş risk analizi
- **Doğrulama Etiketleri** — `Doğrulandı` / `Manüel Doğrulama Gerekli` / `Unspecified` sınıflandırması
- **CSV Kaynak Tablosu** — 35 adet numaralandırılmış kaynak (CLM-01 → CLM-35)

> **Not:** Resmi fiyat, politika ve hukuk kaynakları değişebileceğinden, **her yayın öncesi dönemde sources dosyası tekrar gözden geçirilmeli ve güncellenmelidir.** Ana ADR belgesi bu nedenle kaynak URL'lerini doğrudan taşımaz; denetlenebilir kaynakça sorumluluğu sources dosyasındadır.
