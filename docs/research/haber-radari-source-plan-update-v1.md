# Haber Radarı — Kaynak, Legal ve Publish-Gate Kararları (SSOT v1)

**Belge türü:** Aktif karar kaydı (Single Source of Truth)  
**Proje:** Haber Radarı  
**Sürüm:** v1  
**Tarih:** 2026-06-28  
**Durum:** **AKTİF** — Kaynak registry, legalMode, Play/KVKK, publish-gate ve ürün dili kararları için birincil referans.

> Bu belge, `docs/research/archive/superseded/` altındaki eski ADR ve ham derin araştırma notlarının yerine geçer. Çelişki durumunda **bu dosya** esas alınır.

---

## 1. Amaç ve kapsam

Haber Radarı; reklamsız, metadata tabanlı, kişisel önemli gelişme radarıdır. Bu SSOT; hangi kaynakların nasıl kullanılabileceğini, içerik sınırlarını, publish-gate sırasını, Play/KVKK blocker’larını ve LLM kullanım sınırlarını tanımlar.

**Kapsam dışı:** Kod implementasyonu detayı, API contract alanları, test fixture’ları. Bunlar için `docs/architecture/` ve `evidence/` kullanılır.

---

## 2. İçerik sınırları (mutlak)

| Kural | Durum |
|-------|-------|
| Tam haber metni (`articleText`, `fullText`, `body`) | **Yasak** |
| `rawHtml`, `scrapedText` | **Yasak** |
| Görsel, video, audio, caption çekme/yeniden sunma | **Yasak** |
| Web scraping | **Varsayılan kapalı** |
| İzin verilen alanlar | `title`, kısa özet/metadata, `sourceName`, `originalUrl`, zaman damgası, kaynak atfı |

RSS feed’in varlığı **tek başına izin sayılmaz**. Her kaynak için ToS, robots.txt ve lisans durumu ayrı değerlendirilir.

---

## 3. Kaynak sınıflandırması

### 3.1 Ajanslar

**Kaynaklar:** AA, DHA, İHA, ANKA, Reuters, AP, AFP ve benzeri haber ajansları.

| Durum | `legalMode` / politika |
|-------|------------------------|
| Yazılı lisans / kurumsal sözleşme **yok** | **DISABLED** — ingest ve registry’de kapalı |
| Yazılı lisans **var** | Yalnızca **LICENSED** — sözleşme kapsamı ve attribution zorunlu |

Ajans içeriği RSS’te görünse bile lisans yoksa **açılmaz**.

### 3.2 Ticari / ulusal medya

**Örnekler:** NTV, Habertürk, BBC Türkçe, TRT Haber, Sözcü, Cumhuriyet, Hürriyet, Milliyet, Sabah, T24, Euronews vb.

| Varsayılan | Açıklama |
|------------|----------|
| **TITLE_LINK_ONLY** veya **NEEDS_REVIEW** | Başlık + link-out; özet/metadata yalnızca hukuki inceleme sonrası |
| **RSS_METADATA_ONLY** | Yalnızca ToS + robots + lisans kontrolü **olumlu** ise açılır |

Ticari medyada otomatik tam metadata ingest **varsayılan kapalıdır**.

### 3.3 Resmi / kurumsal kaynaklar (omurga havuz)

**Örnekler:** AFAD, deprem.afad, TCMB, SPK, KAP, TÜİK, Sağlık Bakanlığı, BTK, TÜBİTAK, USGS, EMSC, ECB, IMF, WHO.

| Kural | Değer |
|-------|-------|
| Rol | Omurga kaynak havuzu — afet, ekonomi, resmi duyuru sinyalleri |
| İçerik modeli | **Metadata-only** + link-out + source attribution |
| Tam metin / medya | Yasak (Bölüm 2) |

Resmi kaynaklar güvenilirlik sinyali sağlar; yine de telif ve kullanım şartlarına uyulur.

---

## 4. Source registry SSOT

| Karar | Açıklama |
|-------|----------|
| Tek registry hedefi | API (`apps/api`) ve Android (`apps/android`) kaynak tanımları **tek SSOT**’a indirilecek |
| Mevcut durum | Çift registry bilinen borç; yeni kaynak ekleme her iki tarafta senkron planlanmalı |
| `trustTier` / `legalMode` | Bu SSOT sınıflandırmasına göre hizalanır |

---

## 5. Publish-gate politikası

### 5.1 Mevcut durum (main, PR #25 sonrası)

| Öğe | Durum |
|-----|-------|
| `sourceSignalPublishDryRun` | **readOnly=true** — yalnızca simülasyon / ölçüm |
| `PublishGate.evaluate()` | **Değişmedi** — gerçek publish kararı etkilenmez |
| Aktif source-signal publish gate | **Yok** — PR #25 dry-run main’e alınmadan aktif gate **bağlanmaz** |

### 5.2 Aktif gate sırası (gelecek bağlama için)

1. **Legal eligibility** — kaynak DISABLED / NEEDS_REVIEW / lisans kontrolü  
2. **Source quality** — authority, health, metadata yeterliliği  
3. **Cluster confirmation** — çoklu kaynak teyidi, cluster skoru  
4. **Afet / breaking-news safety exception** — resmi afet kaynakları için kontrollü istisna

Aktif gate bağlama: feature flag + dry-run metrikleri + operatör onayı sonrası ayrı PR.

---

## 6. Play / KVKK blocker’ları

Yayın öncesi tamamlanması gereken maddeler:

| Blocker | Gereksinim |
|---------|------------|
| Privacy Policy URL | Yayında, erişilebilir, Play Console ile uyumlu |
| KVKK aydınlatma metni | Ürün içi veya bağlantılı; aydınlatma ≠ açık rıza |
| Google Play Data Safety | Form beyanı gerçek veri akışıyla uyumlu |
| News & Magazine self-declaration | Haber uygulaması beyanı |
| HTTPS / cleartext | Production’da cleartext kapalı; `usesCleartextTraffic` yalnızca dev |
| Mobil API / LLM key | İstemcide **yok**; backend proxy zorunlu |
| Yanıltıcı ürün dili | “Doğrulama”, “kesin doğru”, “yalan haber yakalar” vb. **yasak** (Bölüm 8) |

---

## 7. LLM kullanımı

| Kural | Değer |
|-------|-------|
| Konum | Kalıcı **backend proxy** arkasında |
| Mobil istemci | LLM çağrısı **yapmaz**; API key **gömülmez** |
| Kullanıcıya dönük özetleme | Source Registry + Play/KVKK + cache/quota/kill switch hazır olana kadar **kapalı** |
| Varsayılan | `LLM_DIGEST_EXTERNAL_ENABLED=0`; operatör onayı olmadan gerçek external çağrı yok |

---

## 8. Ürün dili ve iddia sınırları

Haber Radarı **şunları iddia etmez:**

- Haber doğrulama veya fact-checking hizmeti  
- Yalan haber tespiti  
- “Kesin doğru haber” veya “kanıtlandı” sunumu  

İzin verilen dil: **sinyal**, **kaynak profili**, **neden gösterildi**, **metadata tabanlı özet**, **link-out**.

---

## 9. Öncelik sırası (karar çatışması)

1. **Yasal güvenlik**  
2. **Teknik doğruluk**  
3. **Maliyet kontrolü**  
4. **Ürün hızı**

Hukuki kesin hüküm verilmez; risk sınıflandırması yapılır (`DISABLED`, `NEEDS_REVIEW`, `LICENSED` vb.).

---

## 10. Sonraki adımlar (plan sırası)

1. Source Registry Audit v0 — API + Android tek SSOT  
2. Play/KVKK Readiness v0 — blocker maddelerinin kapatılması  
3. Publish-Gate Policy v0 — dry-run metrikleri sonrası **aktif** gate (feature flag)  
4. Source health admin ekranı  
5. LLM proxy maliyet / quota / kill switch operasyonu  

---

## 11. İlişkili belgeler

| Belge | Rol |
|-------|-----|
| [Smart Feed API contract v0](../architecture/smart-feed-api-contract-v0.md) | API alanları ve contract |
| [Current architecture v0.6](../architecture/current-architecture-v0.6.md) | Mimari SSOT |
| [Evidence index](../../evidence/README.md) | Test ve faz kanıtları |
| [Arşiv: superseded notlar](./archive/superseded/) | Tarihsel ADR / derin araştırma — **aktif karar için kullanılmaz** |

---

## 12. Revizyon geçmişi

| Sürüm | Tarih | Not |
|-------|-------|-----|
| v1 | 2026-06-28 | İlk aktif SSOT; eski ADR + derin araştırma supersede edildi |
