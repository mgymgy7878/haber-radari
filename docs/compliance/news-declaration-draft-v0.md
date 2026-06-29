# News App Self-Declaration — Taslak v0

> **Bu belge taslaktır; Google Play Console’a gönderilmiş nihai News beyanı değildir.**  
> **Güncel Play Console News / Magazine self-declaration ekranı ile teyit gerekir.**  
> **Yayın öncesi hukuk danışmanı teyidi gerekir.**

**Sürüm:** v0  
**Son güncelleme:** 2026-06-29  
**Blocker:** B4 **OPEN** — draft prepared, Play Console submission pending

---

## 1. App category and purpose

| Alan | Taslak değer |
|------|--------------|
| Play kategori | News & Magazines |
| Uygulama adı | Haber Radarı |
| Amaç | Metadata tabanlı haber radarı; çoklu kaynak sinyali ve orijinal kaynağa yönlendirme |
| Reklam | **Reklamsız** (ad-free) |

Haber Radarı bir **haber doğrulama** veya **fact-checking** uygulaması **değildir**.

*Bu sinyal haberin doğruluğunu tek başına garanti etmez.*

---

## 2. News source model

| Konu | Taslak beyan |
|------|--------------|
| Kaynak türü | RSS/metadata — üçüncü taraf haber siteleri |
| Aktif runtime kaynaklar (v0) | NTV Son Dakika, Habertürk Ekonomi |
| Kapalı kaynaklar | AA (`DISABLED`), TRT (`NEEDS_REVIEW`) — registry uyumu |
| İçerik türü | Başlık, kaynak adı, yayın zamanı, kategori ipucu, link |
| Tam makale metni | **Kopyalanmaz / scrape edilmez** (hedef politika) |
| `TITLE_LINK_ONLY` kaynaklar | Özet/description user-visible taşınmamalı (cleanup planında) |

Kaynak SSOT: `source-registry-v0.json` + `rss-sources.ts` runtime binding.

---

## 3. Source attribution policy

- Her kartta **kaynak adı** görünür (`sources[].sourceName`).  
- **Orijinal URL** link-out ile açılır (Custom Tabs).  
- Çoklu kaynak kümelerinde **kaynak kapsamı** şeffaflığı (`uniqueSourceCount`, evidence status).  
- Tek kaynak uyarısı: *“Tek kaynak — çoklu doğrulama yok; orijinal haberi kontrol edin.”*

---

## 4. Original link-out policy

- Kullanıcı haberi okumak için **yayıncının sitesine** yönlendirilir.  
- Uygulama içinde tam haber gövdesi sunulmaz (MVP).  
- Üçüncü taraf site gizlilik politikası kullanıcıya aittir.

---

## 5. No full-text copying policy

| İzinli | Yasak / riskli |
|--------|----------------|
| Başlık (metadata) | Tam makale metni |
| Kaynak linki | HTML body scrape |
| Kısa RSS snippet (cleanup öncesi — geçici) | `TITLE_LINK_ONLY` için summary gösterimi (telif riski) |

Backend cleanup + legal guard sonrası `TITLE_LINK_ONLY` kaynaklarda özet kaldırılması hedeflenir.

---

## 6. No verification claim policy

**Uygulama şunları iddia etmez:**

- Haber doğrulama hizmeti  
- Yalan / sahte haber tespiti  
- “Kesin doğru” veya “kanıtlandı” sunumu  
- “En güvenilir haber” iddiası  

**İzin verilen dil:**

- Kaynak sinyali, kaynak profili, kaynak sağlığı  
- Yardımcı değerlendirme, metadata tabanlı özet (LLM açıksa)  
- “Neden gösteriliyor?” şeffaflık satırları  

---

## 7. Editorial control / aggregation posture

| Soru | Taslak cevap |
|------|--------------|
| Editör mü? | **Hayır** — otomatik RSS ingest + publish gate |
| İnsan editörü | Yok (v0) |
| Kullanıcı içeriği (UGC) | **Yok** — yorum, paylaşım, upload yok |
| Kişiselleştirme | Sınırlı (kategori/kaynak tercihi — cihazda) |
| AI içerik üretimi | Smart digest metadata-only; varsayılan kapalı/mock |

Play News declaration: **aggregator / radar** konumlandırması — **Console teyidi gerekir**.

---

## 8. User-generated content status

**UGC yok.**

- Yorum, forum, kullanıcı haber gönderimi yok  
- Moderation policy N/A (v0)

---

## 9. Ads and monetization

| Konu | v0 |
|------|-----|
| Reklamlar | Yok (ad-free ürün hedefi) |
| In-app purchase | Yok (gözlem) |
| Abonelik | Yok (gözlem) |
| Sponsorlu içerik | Yok |

Monetization placeholder: `[GELECEK — HUKUK TEYİDİ]`

---

## 10. Contact / publisher information

| Alan | Placeholder |
|------|-------------|
| Yayıncı / geliştirici | `[UNVAN — HUKUK TEYİDİ]` |
| İletişim e-posta | `[contact@example.com]` |
| Web sitesi | `[https://example.com]` |
| Fiziksel adres | `[ADRES — HUKUK TEYİDİ]` |

Play Console “Contact details” ile uyumlu olmalıdır.

---

## 11. Legal source registry relation

| Registry alanı | Declaration etkisi |
|----------------|-------------------|
| `legalMode` | TITLE_LINK_ONLY, DISABLED, NEEDS_REVIEW |
| `publishEligible` | Runtime ingest gate |
| `summaryPolicy=forbidden` | Özet gösterimi yasak |
| `allowedFields` | Yalnız metadata |

Runtime disabled: `aa_guncel`, `trt_haber`.  
Runtime enabled: `ntv_son_dakika`, `haberturk_ekonomi`.

---

## 12. Play Console declaration draft answers

> **Nihai form cevapları değildir** — Console ekranı ile satır satır teyit edilmelidir.

| Console sorusu (özet) | Taslak cevap | Confidence |
|----------------------|--------------|------------|
| Is this a news app? | Yes | high |
| Do you aggregate third-party news? | Yes (RSS metadata) | high |
| Do you publish full article text in-app? | No (link-out) | high |
| User-generated content? | No | high |
| Fact-checking / verification service? | **No** | high |
| Source attribution shown? | Yes | high |
| Ads? | No | high |
| Licensed content (AA etc.)? | Disabled until licensed | high |

---

## 13. Open questions

| # | Soru |
|---|------|
| Q1 | Play “News” alt kategorisi ve declaration sürümü güncel mi? |
| Q2 | RSS snippet gösterimi geçici drift — declaration’da nasıl anlatılır? |
| Q3 | Smart digest açılınca declaration güncellenir mi? |
| Q4 | Türkiye-only yayın mı, global mi? |
| Q5 | Store listing dilinde “AI” ifadesi nasıl sınırlanır? |

---

## 14. Hukuk danışmanı teyidi gereken alanlar

1. RSS/metadata + link-out telif uyumu (NTV, Habertürk ToS)  
2. News self-declaration metninin aggregator tanımına uygunluğu  
3. “Doğrulama iddiası yok” ifadesinin store listing ile tutarlılığı  
4. DISABLED/NEEDS_REVIEW kaynakların declaration’da belirtilmesi gerekir mi?  
5. LLM metadata digest açılınca haber/AI içerik beyanı  
6. Yayıncı iletişim bilgileri ve TTK gereklilikleri  

---

## İlişkili belgeler

- [Data Safety Taslak v0](./data-safety-draft-v0.md)  
- [Play/KVKK Readiness v0](./play-kvkk-readiness-v0.md)  
- [Evidence snapshot](../../evidence/compliance/data-safety-news-declaration-v0.md)
