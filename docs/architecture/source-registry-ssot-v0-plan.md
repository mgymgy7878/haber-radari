# Source Registry SSOT v0 — Hazırlık Planı

**Belge türü:** Mimari plan / implementation öncesi SSOT  
**Proje:** Haber Radarı  
**Sürüm:** v0  
**Tarih:** 2026-06-29  
**Durum:** **AKTİF PLAN** — Bu belge runtime davranışı değiştirmez.

**İlgili PR’lar (main):**

| PR | Sonuç |
|----|--------|
| #36 | Android `aiSummary` fallback |
| #39 | Data Safety + News declaration draft |
| #40 | Release HTTPS / cleartext hardening **plan** (B5 OPEN) |
| #41 | Backend TITLE_LINK_ONLY `aiSummary` **response sanitize** (aktif legal guard değil) |

**Önceki araştırma (referans, bu planın yerine geçmez):**

- [source-registry-ssot-v0-preimplementation.md](../research/source-registry-ssot-v0-preimplementation.md)
- [source-registry-ssot-v0-implementation-note.md](../research/source-registry-ssot-v0-implementation-note.md)

---

## 1. Executive summary

Haber Radarı’nda API Smart Feed hattı ile Android yerel RSS hattı **farklı kaynak listeleri** ve **farklı `legalMode` gerçekleri** kullanıyor. PR #41 geçici `title-link-only-payload-policy` katmanı smart-feed response’ta özeti temizler; ancak ingest, publish gate ve Android seed hâlâ SSOT’a tam bağlı değildir.

**SSOT v0 hedefi:** API ve Android kaynak envanteri tek registry’den türetilir. Her kayıtta en az `legalMode`, `authorityTier`, `allowedFields`, `forbiddenFields`, `reviewStatus`, `publishEligible` bulunur.

**Bu plan PR kapsamı:** Dokümantasyon + acceptance criteria + migration fazları. Kod, manifest, Gradle veya runtime değişikliği yok.

---

## 2. Current state

### 2.1 Kaynak envanteri — nerede ne var?

| Katman | Dosya / modül | Kaynak sayısı | `legalMode` | SSOT bağlı? | Not |
|--------|---------------|---------------|-------------|-------------|-----|
| **API runtime ingest** | `apps/api/src/config/rss-sources.ts` | 4 | Yok (`enabled`, `trustTier`, `disabledReason`) | Hayır | Aktif: `ntv_son_dakika`, `haberturk_ekonomi` |
| **API ingest servisi** | `apps/api/src/services/rss-ingest.ts` | `RSS_SOURCES.filter(enabled)` | Yok | Hayır | RSS `description` → `shortDescription` (iç pipeline) |
| **API SSOT fixture** | `apps/api/src/source-registry/source-registry-v0.json` | 20 | Var | Read-only | `readOnly: true`; production ingest’e bağlı değil |
| **API SSOT tipleri** | `apps/api/src/source-registry/source-registry-types.ts` | — | Enum + forbidden set | Şema referansı | Contract test zemini |
| **API SSOT loader** | `apps/api/src/source-registry/source-registry-loader.ts` | — | — | Read-only okuma | smart-feed audit + PR #41 policy |
| **PR #41 geçici policy** | `apps/api/src/source-registry/title-link-only-payload-policy.ts` | — | Registry okur | Kısmi | Yalnızca response sanitize |
| **smart-feed sanitize** | `apps/api/src/routes/smart-feed.ts` | — | Dolaylı | PR #41 | `aiSummary`, `shortDescription` suppress |
| **Legal guard (dry-run)** | `apps/api/src/source-registry/legal-content-guardrail-dry-run.ts` | — | Registry okur | Audit only | Aktif publish blocker değil |
| **Summary policy audit** | `apps/api/src/source-registry/title-link-only-summary-policy-audit.ts` | — | Registry okur | Audit only | Response disclaimer ile |
| **Publish gate** | `apps/api/src/engine/publish-gate.ts` | — | Yok | Hayır | `legalMode` / `publishEligible` kontrol etmez |
| **Android seed** | `apps/android/.../NewsRepository.kt` → `seedDefaultSources()` | 3 | Var (hepsi `RSS_METADATA_ONLY`) | Hayır | `ntv-turkiye`, `bbc-turkce`, `haberturk` |
| **Android model** | `apps/android/.../data/model/Source.kt`, `LegalMode.kt` | — | Enum | Yerel | Room entity |
| **Android RSS parse** | `apps/android/.../data/remote/RssParser.kt` | — | `legalMode` filter | Yerel | TITLE_LINK_ONLY → description boş |
| **Android Smart Feed** | `RemoteAiCuratedFeedRepository.kt` | Backend | Backend DTO | API response | PR #36 fallback boş `aiSummary` |

### 2.2 Runtime aktif kaynaklar (2026-06-29, main)

**API ingest (`rss-sources.ts`):**

| sourceId | displayName | enabled | Registry `legalMode` (fixture) | Drift |
|----------|-------------|---------|-------------------------------|-------|
| `aa_guncel` | Anadolu Ajansı | `false` | `DISABLED` | Uyumlu (runtime kapalı) |
| `trt_haber` | TRT Haber | `false` | `NEEDS_REVIEW` | Uyumlu (runtime kapalı) |
| `ntv_son_dakika` | NTV | `true` | `TITLE_LINK_ONLY` | Ingest özet üretir; response PR #41 ile temizlenir |
| `haberturk_ekonomi` | Habertürk | `true` | `TITLE_LINK_ONLY` | Aynı |

**Android seed (yerel RSS yolu — Smart Feed birincil ürün hattı olsa da drift riski devam eder):**

| Android id | feedUrl | Android `legalMode` | Registry hedef |
|------------|---------|---------------------|----------------|
| `ntv-turkiye` | ntv.com.tr/turkiye.rss | `RSS_METADATA_ONLY` | `TITLE_LINK_ONLY` |
| `bbc-turkce` | bbci.co.uk/turkce | `RSS_METADATA_ONLY` | `NEEDS_REVIEW` → `TITLE_LINK_ONLY` |
| `haberturk` | haberturk.com/rss | `RSS_METADATA_ONLY` | `TITLE_LINK_ONLY` |

### 2.3 PR #41 geçici katmanın rolü

`title-link-only-payload-policy.ts`:

- Source Registry SSOT `legalMode === 'TITLE_LINK_ONLY'` okur.
- **Aktif legal guard değildir** — ingest ve publish gate’e bağlı değil.
- Yalnızca `smart-feed` response’ta `aiSummary` / `shortDescription` boşaltır.
- İç pipeline (`rss-ingest` → `shortDescription`) değişmez.

**Kalıcı çözüm:** Bu modülün yerini alacak merkezi **registry legalMode resolver** + ingest/publish gate bağlantısı (Migration Aşama 5–7).

### 2.4 Ingest / publish hattı registry kullanımı

```
RSS_SOURCES (rss-sources.ts)     ──▶ rss-ingest.ts (enabled filter)
                                        │
                                        ▼
                                 shortDescription (iç)
                                        │
                    cluster-engine ──▶ publish-gate (legalMode YOK)
                                        │
                                        ▼
                    smart-feed.ts ──▶ title-link-only-payload-policy (response only)
                                        │
                                        ▼
                              Android RemoteAiCuratedFeedRepository
```

Registry `source-registry-v0.json` bugün yalnızca: loader testleri, dry-run audit, PR #41 policy ve smart-feed audit bloklarında **okunur**; ingest listesini üretmez.

### 2.5 Drift ve risk özeti

| Risk | Mevcut durum | SSOT sonrası hedef |
|------|--------------|-------------------|
| Çift kaynak listesi | API 4, Android 3, registry 20 | Tek registry → türetilmiş runtime listeler |
| `legalMode` API ingest’te yok | `enabled` + manuel `disabledReason` | Registry `legalMode` + `publishEligible` |
| Android ticari medya `RSS_METADATA_ONLY` | Description yerel DB’ye yazılabilir | `TITLE_LINK_ONLY` seed + parse guard |
| PR #41 kalıcı sanılması | Response-only sanitize | Resolver + gate’e taşınır; policy modülü emekli edilir |
| DISABLED ajans sızıntısı | AA/TRT runtime kapalı (iyi) | Tüm ajanslar fixture + gate ile blok |
| Forbidden field sızıntısı | Contract + PR #41 kısmi | Registry `forbiddenFields` + response contract test |

---

## 3. Target SSOT model

Her kaynak kaydı **en az** şu alanları içerir:

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `id` / `sourceId` | string | Evet | Stabil kimlik (`ntv_son_dakika`, `haberturk`) |
| `displayName` / `sourceName` | string | Evet | UI attribution |
| `sourceType` | enum | Evet | `AGENCY`, `COMMERCIAL_MEDIA`, `PUBLIC_BROADCASTER`, `OFFICIAL`, `WIRE`, … |
| `legalMode` | enum | **Evet (boş olamaz)** | Bkz. §4 |
| `authorityTier` | string | Evet | `OFFICIAL`, `PRIMARY_WIRE_OR_AGENCY`, `ESTABLISHED_MEDIA`, … |
| `allowedFields` | string[] | Evet | İzinli metadata alanları |
| `forbiddenFields` | string[] | Evet | Production’da yasak alanlar |
| `reviewStatus` | enum | Evet | `pending` \| `approved` \| `rejected` |
| `publishEligible` | boolean | Evet | Production publish hattına girebilir mi |
| `licenseStatus` | enum | Ajans için evet | `none` \| `pending` \| `active` \| `expired` |
| `canonicalBaseUrl` / `baseDomain` | string | Evet | `ntv.com.tr`, `aa.com.tr` |
| `rssUrl` / `feedUrl` | string | Feed kaynakları için | RSS endpoint metadata |
| `notes` | string | Hayır | Operasyon / hukuk notu |
| `lastReviewedAt` / `termsReviewedAt` | ISO date | Hayır | Hukuki inceleme tarihi |

**Ek policy alanları (önerilen):** `summaryPolicy`, `imagePolicy`, `robotsRisk`, `sourceHealthEnabled`, `freshnessSlaMinutes`.

**Kod referansı (mevcut şema):** `apps/api/src/source-registry/source-registry-types.ts`, `source-registry-v0.json`.

---

## 4. legalMode sözlüğü ve üretim davranışı

| legalMode | Production ingest | publishEligible (varsayılan) | User-visible içerik |
|-----------|-------------------|------------------------------|---------------------|
| **DISABLED** | Yok | `false` | Hiçbir alan taşınmaz |
| **NEEDS_REVIEW** | Yok | `false` | İnceleme tamamlanana kadar kapalı |
| **TITLE_LINK_ONLY** | Başlık + link metadata | `true` (review `approved` sonrası) | title, sourceName, publishedAt, category, canonical/original link — **summary yok** |
| **RSS_METADATA_ONLY** | Yalnızca izinli kısa RSS metadata | `true` (ToS/robots olumlu) | title, shortDescription (sınırlı), link, source, date |
| **LICENSED** | Lisans kapsamı kadar | `false` until `licenseStatus=active` | Sözleşme ile tanımlı alanlar |

**Contract referansı:** `apps/api/src/source-registry/source-registry-contract.ts` → `LEGAL_MODE_CONTRACT`.

### TITLE_LINK_ONLY — response alan eşlemesi

| API alanı | TITLE_LINK_ONLY |
|-----------|-----------------|
| `aiTitle` / `title` | İzinli |
| `aiSummary` | **Boş** (`""` veya omitted) |
| `shortDescription` (preview) | **Boş** |
| `originalUrl` / `canonicalUrl` | İzinli |
| `sourceNames` / `sourceName` | İzinli |
| `publishedAt` | İzinli |
| `category` | İzinli |

---

## 5. Ajans politikası

**Kaynaklar:** AA, DHA, İHA, ANKA, Reuters, AP, AFP (`AGENCY_SOURCE_IDS` in types).

| Durum | legalMode | ingest | publish |
|-------|-----------|--------|---------|
| Lisans yok | `DISABLED` | Blok | Blok |
| Lisans incelemede | `DISABLED` veya `NEEDS_REVIEW` | Blok | Blok |
| Aktif lisans | `LICENSED` | Lisans kapsamı | `licenseStatus=active` + `publishEligible=true` |

**Kural:** Lisanssız ajans fixture’ı publish hattına ulaşmadan bloklanmalı. Publish gate öncesi registry eligibility kontrolü zorunlu (Migration Aşama 7).

**Mevcut:** `aa_guncel` registry + runtime `enabled=false` — uyumlu örnek.

---

## 6. Ticari medya politikası

**Örnekler:** NTV, Habertürk, BBC Türkçe, TRT Haber, Sözcü, Cumhuriyet, Hürriyet, Milliyet, Sabah, T24, Euronews.

| Varsayılan | Koşul |
|------------|-------|
| `TITLE_LINK_ONLY` | ToS/robots temel kontrol + `reviewStatus=approved` |
| `NEEDS_REVIEW` | ToS/robots/lisans incelemesi tamamlanmadan |

`RSS_METADATA_ONLY` **yalnızca** ToS/robots/lisans kontrolü olumluysa ve kısa metadata açıkça izinliyse açılır. Ticari medya için varsayılan **TITLE_LINK_ONLY** kalır.

**Mevcut registry:** `ntv_son_dakika`, `haberturk_ekonomi`, `ntv_turkiye`, `haberturk` → `TITLE_LINK_ONLY`; `bbc_turkce`, `trt_haber` → `NEEDS_REVIEW`.

---

## 7. Resmi / kurumsal kaynak politikası

**Omurga adayları (registry fixture’ta mevcut):** AFAD, deprem.afad, TCMB, SPK, KAP, TÜİK, Sağlık Bakanlığı, BTK, TÜBİTAK, USGS, EMSC, ECB, IMF, WHO (genişletilebilir).

| İlke | Uygulama |
|------|----------|
| Varsayılan mod | `RSS_METADATA_ONLY` (onay sonrası) |
| İçerik sınırı | Metadata-only + link-out + attribution |
| Full text / scrape | Yasak |
| Görsel / medya | `imagePolicy=forbidden` veya `link_only` |

Resmi kaynaklar bile production’da `body` / `fullText` / `rawHtml` taşımaz.

---

## 8. Forbidden fields (production contract)

Registry ve API response contract şu alanları **production’da yasaklar**:

- `body`
- `fullText`
- `contentHtml`
- `rawHtml`
- `articleText`
- `scrapedText`
- `image`
- `video`
- `audio`
- `caption`
- görsel OCR çıktısı
- video transkript

**Kod referansı:** `TITLE_LINK_ONLY_FORBIDDEN_FIELDS` in `source-registry-types.ts`.

Smart Feed contract: [smart-feed-api-contract-v0.md](./smart-feed-api-contract-v0.md).

---

## 9. Migration plan

| Aşama | İş | Çıktı | Runtime etkisi |
|-------|-----|-------|----------------|
| **1** | Mevcut API / Android / registry envanteri | Drift matrisi (bu belge §2) | Yok |
| **2** | SSOT schema + fixture doğrulama | `source-registry-v0.json` + contract testler | Yok (read-only) |
| **3** | API registry SSOT okuma | `rss-sources.ts` registry’den türetilir | **Evet** — ayrı PR |
| **4** | Android seed SSOT export/import | `seedDefaultSources()` registry snapshot | **Evet** — ayrı PR |
| **5** | PR #41 geçici policy → registry resolver | Tek `resolveUserVisibleSummary(registry, sourceId, value)` | **Evet** — ayrı PR |
| **6** | Legal eligibility testleri | Ajans DISABLED, TITLE_LINK_ONLY summary boş, forbidden scan | Test PR |
| **7** | Publish gate öncesi blocker | `publishEligible` + `legalMode` gate | **Evet** — en son, onaylı |

**Sıra önerisi:** Aşama 2 (fixture sabitleme) → 3 (API) → 4 (Android) → 5 (policy birleştirme) → 6 (test) → 7 (aktif guard).

PR #41 katmanı Aşama 5’e kadar **geçici olarak kalır**; kalıcı çözüm gibi dokümante edilmez.

---

## 10. Acceptance criteria (SSOT v0 implementation)

Implementation PR’ları için PASS kriterleri:

- [ ] API ve Android kaynak listeleri tek registry’den türetilebilir (manuel drift yok).
- [ ] Her kayıtta `legalMode` boş olamaz.
- [ ] `DISABLED` ve `NEEDS_REVIEW` production ingest’e girmez.
- [ ] `TITLE_LINK_ONLY` kaynakta `aiSummary` / `shortDescription` response’ta boştur.
- [ ] Forbidden fields production response’a çıkmaz (contract + otomatik scan testi).
- [ ] Lisanssız ajans fixture’ı publish’e ulaşmadan bloklanır.
- [ ] Android PR #36 `aiSummary` fallback kırılmaz (boş summary crashsiz).
- [ ] Backward compatibility: mevcut smart-feed alan adları ve client DTO korunur.
- [ ] B5 HTTPS blocker bu implementation’da değişmez (ayrı PR).

---

## 11. Test ve evidence planı (implementation PR’ları)

| Test türü | Kapsam |
|-----------|--------|
| Contract | `source-registry-contract.test.ts` — tüm fixture kayıtları |
| Policy | `title-link-only-payload-policy` → gelecekte `legal-mode-resolver` |
| Integration | `smart-feed.test.ts` — NTV/Habertürk boş summary |
| Forbidden scan | Response JSON’da yasak anahtar yok |
| Ajans block | `aa_guncel` ingest + publish yok |
| Android unit | `AiSummaryUiLogicTest`, `TitleLinkOnlyTest` |
| Device smoke | Feed + detail, boş summary fallback |
| Evidence | `evidence/source-registry/` altında smoke JSON + md |

---

## 12. Non-goals (bu plan PR’ı)

- SSOT runtime kodu yazılmayacak
- Android kaynakları taşınmayacak
- Manifest / Gradle / XML değişmeyecek
- HTTPS hardening yapılmayacak (B5 OPEN)
- Aktif publish gate / legal guard açılmayacak
- LLM entegrasyonu yapılmayacak
- Full text / scrape / rawHtml pipeline’a eklenmeyecek

---

## 13. Sonraki adım önerisi

Bu plan merge sonrası önerilen sıra:

1. **SSOT implementation v0** — Aşama 3–5 (küçük, reviewable PR’lar)
2. **HTTPS hardening implementation** — manifest/Gradle riski nedeniyle ayrı track (B5)
3. **Aktif legal guard binding** — Aşama 7 (en son, operasyon onayı ile)

---

## 14. Referans dosyalar

| Dosya | Rol |
|-------|-----|
| `apps/api/src/config/rss-sources.ts` | API runtime ingest listesi |
| `apps/api/src/source-registry/source-registry-v0.json` | SSOT fixture (read-only) |
| `apps/api/src/source-registry/title-link-only-payload-policy.ts` | PR #41 geçici response sanitize |
| `apps/api/src/routes/smart-feed.ts` | Response mapper + audit |
| `apps/android/.../NewsRepository.kt` | Android seed |
| `evidence/compliance/backend-ai-summary-cleanup-v0.md` | PR #41 kanıtı |
