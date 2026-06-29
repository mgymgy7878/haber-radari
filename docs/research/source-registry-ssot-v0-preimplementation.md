# Source Registry SSOT v0 — Pre-Implementation Spec

**Belge türü:** Teknik sözleşme / migration öncesi plan  
**Proje:** Haber Radarı  
**Sürüm:** v0 (pre-implementation)  
**Tarih:** 2026-06-28  
**Durum:** **AKTİF PLAN** — Runtime davranışı değiştirmez; implementation PR öncesi referans.

**Üst SSOT:** [haber-radari-source-plan-update-v1.md](./haber-radari-source-plan-update-v1.md)

---

## 1. Executive Summary

### SSOT neden gerekli?

API Smart Feed hattı (`apps/api/src/config/rss-sources.ts`) ile Android yerel RSS hattı (`NewsRepository.seedDefaultSources()`) **farklı kaynak listeleri** kullanıyor. API tarafında `legalMode` alanı yok; Android tarafında `legalMode` var ama tüm seed kaynaklar `RSS_METADATA_ONLY`. Bu drift, ajans kaynaklarının lisanssız ingest edilmesi ve ticari medyada summary/description taşınması gibi **legal blocker** riskleri doğurur.

### Bugünkü drift riski

| Risk | Mevcut durum |
|------|----------------|
| Çift registry | API 4 kaynak, Android 3 kaynak — kesişim kısmi |
| `legalMode` eksikliği (API) | `trustTier` + `enabled` var; yasal mod yok |
| AA enabled (API) | SSOT: lisans yok → **DISABLED**; runtime `enabled: true` |
| Android `RSS_METADATA_ONLY` | SSOT hedefi ticari medya için **TITLE_LINK_ONLY** |
| `publishEligible` yok | Ingest/publish ayrımı kodda ifade edilmiyor |

### Bu PR neden runtime davranışı değiştirmiyor?

Bu adım yalnızca:

1. Drift’i belgelemek  
2. SSOT v0 schema’sını tanımlamak  
3. Contract test + fixture zeminini kurmak  

içindir. `RSS_SOURCES`, `rss-ingest.ts`, `PublishGate.evaluate()`, Android seed ve UI **değiştirilmez**. Fixture’lar production config’e import edilmez.

---

## 2. Current Registry Map

| Location | File path | Source count | Fields | legalMode | authorityTier | Health/scoring | Android/API uyumu |
|----------|-----------|--------------|--------|-----------|---------------|----------------|-------------------|
| API runtime | `apps/api/src/config/rss-sources.ts` | 4 | `id`, `name`, `url`, `categoryHint`, `language`, `country`, `enabled`, `trustTier` | **Yok** | `authority-tier-resolver.ts` (shadow, türetilmiş) | `shadow-score-builder.ts`, `source-health-scorer.ts` | Kısmi |
| API ingest | `apps/api/src/services/rss-ingest.ts` | 4 (RSS_SOURCES) | enabled filter | **Yok** | Dolaylı (scoring) | `sourceStatuses[]` | API-only |
| API shadow/signal | `apps/api/src/source-scoring/*` | 4 | `trustTier` input | **Yok** | `AuthorityTier` enum | readOnly shadow + dry-run | API-only |
| Android seed | `apps/android/.../NewsRepository.kt` | 3 | `id`, `name`, `feedUrl`, `legalMode`, `authorityLevel` | **Var** (hepsi `RSS_METADATA_ONLY`) | `SourceAuthority.GENERAL_MEDIA` | Yerel RSS path | Kısmi |
| Android model | `apps/android/.../Source.kt` | — | Room entity | `LegalMode` enum | `SourceAuthority` | `RssParser` legalMode filter | Android-only |

---

## 3. Drift Matrix

| sourceName | baseDomain | API’de | Android’de | API legalMode (runtime) | Android legalMode (runtime) | authorityTier (hedef) | Risk | Hedef status |
|------------|------------|--------|--------------|-------------------------|----------------------------|----------------------|------|--------------|
| Anadolu Ajansı (Güncel) | aa.com.tr | Evet (`aa_guncel`) | Hayır | — (`enabled: true`) | — | PRIMARY_WIRE_OR_AGENCY | **Yüksek** — lisanssız ajans ingest | **DISABLED** |
| TRT Haber | trthaber.com | Evet (`trt_haber`) | Hayır | — | — | PRIMARY_WIRE_OR_AGENCY | Orta — metadata sınırı belirsiz | **TITLE_LINK_ONLY** / review pending |
| NTV Son Dakika | ntv.com.tr | Evet (`ntv_son_dakika`) | Hayır | — | — | ESTABLISHED_MEDIA | Orta | **TITLE_LINK_ONLY** |
| Habertürk Ekonomi | haberturk.com | Evet (`haberturk_ekonomi`) | Hayır | — | — | ESTABLISHED_MEDIA | Orta | **TITLE_LINK_ONLY** |
| NTV Türkiye | ntv.com.tr | Hayır | Evet (`ntv-turkiye`) | — | RSS_METADATA_ONLY | ESTABLISHED_MEDIA | Orta — summary taşınabilir | **TITLE_LINK_ONLY** |
| BBC Türkçe | bbci.co.uk | Hayır | Evet (`bbc-turkce`) | — | RSS_METADATA_ONLY | ESTABLISHED_MEDIA | Orta — ToS inceleme gerekir | **NEEDS_REVIEW** → TITLE_LINK_ONLY |
| Habertürk (genel) | haberturk.com | Hayır | Evet (`haberturk`) | — | RSS_METADATA_ONLY | ESTABLISHED_MEDIA | Orta | **TITLE_LINK_ONLY** |

**Özet:** 7 benzersiz feed; yalnızca 1 kaynak (Habertürk domain) her iki tarafta farklı feed URL ile temsil ediliyor; 4 kaynak yalnızca API’de, 3 kaynak yalnızca Android’de.

---

## 4. Source Registry SSOT v0 Schema

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `sourceId` | string | Evet | Stabil kimlik (snake_case) |
| `sourceName` | string | Evet | UI / attribution adı |
| `baseDomain` | string | Evet | `aa.com.tr`, `ntv.com.tr` |
| `feedUrl` | string | Hayır | RSS endpoint |
| `canonicalUrlPattern` | string | Hayır | Link doğrulama şablonu |
| `country` | string | Hayır | `TR`, `INTL` |
| `language` | string | Hayır | `tr` |
| `category` | string | Hayır | Feed bölümü |
| `sourceType` | enum | Hayır | `AGENCY`, `COMMERCIAL_MEDIA`, `PUBLIC_BROADCASTER`, `OFFICIAL`, `WIRE` |
| `legalMode` | enum | **Evet** | DISABLED / NEEDS_REVIEW / TITLE_LINK_ONLY / RSS_METADATA_ONLY / LICENSED |
| `authorityTier` | string | **Evet** | OFFICIAL / PRIMARY_WIRE_OR_AGENCY / ESTABLISHED_MEDIA / … |
| `reviewStatus` | enum | **Evet** | `pending` / `approved` / `rejected` |
| `publishEligible` | boolean | **Evet** | Production publish hattına girebilir mi |
| `allowedFields` | string[] | **Evet** | İzinli metadata alanları |
| `forbiddenFields` | string[] | **Evet** | Yasak alanlar (guardrail) |
| `imagePolicy` | enum | Hayır | `forbidden` / `link_only` / `licensed_only` |
| `summaryPolicy` | enum | Hayır | `forbidden` / `rss_short_only` / `licensed_only` |
| `robotsRisk` | enum | Hayır | `unknown` / `low` / `medium` / `high` |
| `termsReviewedAt` | ISO date \| null | Hayır | Hukuki inceleme tarihi |
| `licenseStatus` | enum | Hayır | `none` / `pending` / `active` / `expired` |
| `sourceHealthEnabled` | boolean | Hayır | Shadow health scoring |
| `freshnessSlaMinutes` | number | Hayır | Tazelik SLA |
| `notes` | string | Hayır | Operasyon notu |

**Kod referansı (test-only):** `apps/api/src/source-registry/source-registry-types.ts`

---

## 5. legalMode Contract

| Mod | allowedFields (özet) | forbiddenFields (özet) | Production ingest | publishEligible (varsayılan) | Örnek |
|-----|---------------------|------------------------|-------------------|------------------------------|-------|
| **DISABLED** | `[]` | `*` (tüm içerik) | Fetch atlanır | `false` | AA (lisans yok) |
| **NEEDS_REVIEW** | title, link, sourceName, publishedAt | description, summary, body, medya… | Kapalı (inceleme) | `false` | BBC Türkçe (öncesi) |
| **TITLE_LINK_ONLY** | title, canonicalUrl, sourceName, publishedAt, category | description, summary, body, html, medya… | Başlık + link-out | `true` (review approved sonrası) | NTV, Habertürk |
| **RSS_METADATA_ONLY** | title, shortDescription, link, sourceName, publishedAt | body, fullText, html, medya… | ToS/robots olumluysa kısa metadata | `true` | AFAD (onaylı) |
| **LICENSED** | title, shortDescription, link… (lisans kapsamı) | body, fullText, html… | Lisans `active` ise | `false` until `licenseStatus=active` | AA (kurumsal sözleşme) |

**Kod referansı:** `apps/api/src/source-registry/source-registry-contract.ts` → `LEGAL_MODE_CONTRACT`

---

## 6. Target Decision for Current 7 Sources

| Kaynak | Hedef legalMode | reviewStatus | publishEligible (hedef) | Not |
|--------|-----------------|--------------|-------------------------|-----|
| AA Güncel | DISABLED (lisans yok) / LICENSED (lisans var) | pending → approved | `false` / `true` (active lisans) | Runtime: API enabled — **düzeltilecek** |
| TRT Haber | TITLE_LINK_ONLY | pending | `false` (review öncesi) | Kamu yayıncı; summary yasak |
| NTV Son Dakika | TITLE_LINK_ONLY | approved | `true` | API-only feed |
| Habertürk Ekonomi | TITLE_LINK_ONLY | approved | `true` | API-only feed |
| NTV Türkiye | TITLE_LINK_ONLY | approved | `true` | Android-only feed |
| BBC Türkçe | NEEDS_REVIEW → TITLE_LINK_ONLY | pending | `false` | ToS/robots inceleme |
| Habertürk (genel) | TITLE_LINK_ONLY | approved | `true` | Android RSS_METADATA_ONLY drift |

---

## 7. Test / Fixture Plan

| Artefakt | Yol | Amaç |
|----------|-----|------|
| Contract fixture | `apps/api/src/source-registry/fixtures/source-registry-contract-cases.json` | Hedef registry kayıtları |
| Contract test | `apps/api/src/source-registry/source-registry-contract.test.ts` | legalMode / publishEligible / forbiddenFields |
| Types | `apps/api/src/source-registry/source-registry-types.ts` | Schema tipleri |
| Validator | `apps/api/src/source-registry/source-registry-contract.ts` | Pure validation (production import yok) |

**Doğrulanan kurallar:**

1. Zorunlu alanlar: `sourceId`, `sourceName`, `baseDomain`, `legalMode`, `authorityTier`, `reviewStatus`, `publishEligible`, `allowedFields`, `forbiddenFields`
2. `DISABLED` → `publishEligible=false`
3. `NEEDS_REVIEW` → `publishEligible=false`
4. `LICENSED` + `licenseStatus≠active` → `publishEligible=false`
5. `TITLE_LINK_ONLY` allowed/forbidden alan politikası
6. Ajans fixture’ları (AA, DHA, İHA, ANKA, Reuters, AP, AFP) lisanssız → `publishEligible=false`
7. Runtime drift snapshot: API `RSS_SOURCES` legalMode taşımıyor (bilinen borç)

**Migration backcompat test planı (sonraki PR):**

- Mevcut `trustTier` → `authorityTier` eşleme tablosu
- `enabled` → `legalMode` + `publishEligible` türetme
- Android `LegalMode` enum ↔ SSOT `legalMode` birebir map
- Eski feed URL’lerinin korunması (breaking change yok)

---

## 8. Non-goals

- Android UI değişikliği yok  
- APK / manifest / build config değişikliği yok  
- Production `RSS_SOURCES` değişikliği yok  
- `rss-ingest` runtime davranışı değişikliği yok  
- `PublishGate.evaluate()` aktif bağlama yok  
- LLM / smart digest entegrasyonu yok  

---

## 9. Next PR Plan

| Sıra | PR | APK gerekir? |
|------|-----|--------------|
| 1 | Source Registry SSOT v0 **implementation** (tek JSON/YAML SSOT + API adapter) | Hayır |
| 2 | Legal Content Guardrail v0 (ingest field strip) | Hayır |
| 3 | Play/KVKK Readiness v0 (privacy/KVKK/Data Safety docs) | Hayır |
| 4 | Publish-Gate Policy fixtures (aktif gate öncesi) | Hayır |
| 5 | Guarded Active Gate v0 (feature flag) | Hayır |
| 6 | Android registry migration | **Evet** (APK) |

---

## Android migration notu (yalnızca plan)

`NewsRepository.seedDefaultSources()` hedef SSOT’a göre güncellenecek; bu PR’da **dokunulmaz**. Hedef:

- `bbc-turkce` → `NEEDS_REVIEW` veya onay sonrası `TITLE_LINK_ONLY`
- `ntv-turkiye`, `haberturk` → `TITLE_LINK_ONLY`
- Smart Feed remote path zaten API’den tüketir; yerel RSS seed ayrı borç olarak izlenir

---

## İlişkili dosyalar

| Dosya | Rol |
|-------|-----|
| [haber-radari-source-plan-update-v1.md](./haber-radari-source-plan-update-v1.md) | Üst karar SSOT |
| [.cursor/rules/haber-radari-project-rules.mdc](../../.cursor/rules/haber-radari-project-rules.mdc) | Cursor proje kuralları |
| `apps/api/src/config/rss-sources.ts` | Mevcut API runtime (değiştirilmedi) |
| `apps/android/.../NewsRepository.kt` | Mevcut Android seed (değiştirilmedi) |
