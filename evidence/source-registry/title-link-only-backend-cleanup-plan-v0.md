# TITLE_LINK_ONLY Backend Cleanup Plan v0

## Amaç

NTV ve Habertürk (`TITLE_LINK_ONLY`) için backend DTO cleanup geçiş planını belgelemek. **Bu belge aktif cleanup değildir** — runtime payload, Android/APK değişmez.

## Current Enabled Sources (post PR #31 / #34)

| sourceId | name | runtime `enabled` | registry `legalMode` | `publishEligible` |
|----------|------|-------------------|----------------------|-------------------|
| `aa_guncel` | Anadolu Ajansı | false | DISABLED | false |
| `trt_haber` | TRT Haber | false | NEEDS_REVIEW | false |
| `ntv_son_dakika` | NTV | **true** | TITLE_LINK_ONLY | true |
| `haberturk_ekonomi` | Habertürk | **true** | TITLE_LINK_ONLY | true |

**Aktif ingest:** yalnızca NTV + Habertürk.

---

## NTV / Habertürk LegalMode Status

| Alan | NTV | Habertürk |
|------|-----|-----------|
| `legalMode` | TITLE_LINK_ONLY | TITLE_LINK_ONLY |
| `summaryPolicy` | forbidden | forbidden |
| `allowedFields` | title, canonicalUrl, originalLink, sourceName, publishedAt, category | aynı |
| `forbiddenFields` | description, summary, body, fullText, contentHtml, rawHtml, articleText, scrapedText, image, video, audio, caption | aynı |

---

## Current DTO / User-Visible Fields (published item)

Smart-feed `PUBLISH_MAIN` item (özet):

| API field | Kaynak | User-visible (Android) |
|-----------|--------|------------------------|
| `aiTitle` | `leadArticle.originalTitle` | Evet — kart + detay |
| `aiSummary` | `leadArticle.shortDescription` | **Evet** — kart + detay (boş kontrolü yok) |
| `sources[].url` | `originalUrl` | Evet (link) |
| `sources[].sourceName` | RSS source name | Evet |
| `sources[].imageUrl` | RSS enclosure | Potansiyel (TITLE_LINK_ONLY forbidden) |
| `smartDigest.*` | LLM/metadata digest | Ayrı UI blok |

`mapClusterSources()` `sources[]` içine `shortDescription` **taşımıyor**; özet yalnızca üst seviye `aiSummary` üzerinden görünür.

---

## `aiSummary` Lineage (end-to-end)

```
RSS item (contentSnippet | content | summary)
  → rss-ingest.ts: sanitizeHtml → RawArticle.shortDescription
  → cluster-engine / publish-gate (shortDescription classification input)
  → smart-feed.ts: aiSummary = leadArticle.shortDescription
  → API JSON items[].aiSummary
  → Android AiCuratedFeedDto.aiSummary (required String)
  → FeedScreen / AiCuratedDetailScreen Text(item.aiSummary)
```

- **LLM kaynağı değil** (smart digest ayrı alan).
- **TITLE_LINK_ONLY** registry'de `summary`/`description` forbidden; mevcut pipeline bunları `aiSummary` olarak user-visible taşır → **telif/legal drift**.

---

## Android Dependency Analysis (read-only grep)

| Dosya | Kullanım | Fallback var mı? |
|-------|----------|------------------|
| `AiCuratedFeedDto.kt` | `aiSummary: String` (required) | Hayır |
| `AiCuratedNewsItem.kt` | `aiSummary: String` | Hayır |
| `FeedScreen.kt` | `text = item.aiSummary` (curated kart) | **Hayır** — boş string render edilir |
| `AiCuratedDetailScreen.kt` | `text = item.aiSummary` | **Hayır** |
| `FeedScreen.kt` (latestRss) | `shortDescription` nullable, `isNullOrEmpty` kontrolü | Evet (preview path) |
| `RemoteAiCuratedFeedRepository.kt` | `aiSummary = itemDto.aiSummary` | — |

**Sonuç:** Curated feed path'te `aiSummary` kaldırılırsa veya boş gönderilirse eski APK kart/detayda boş gövde metni görünür; crash olmayabilir ama UX kırılır.

---

## Forbidden Fields for TITLE_LINK_ONLY (registry)

Kesin taşınmaması gerekenler (user-facing veya payload):

- `summary`, `description`, `shortDescription` (eşdeğer içerik)
- `body`, `fullText`, `contentHtml`, `rawHtml`, `articleText`, `scrapedText`
- `image`, `video`, `audio`, `caption`

**İzinli metadata:** `title`, `canonicalUrl`/`url`, `sourceName`, `publishedAt`, `category`.

---

## Cleanup Options

| Seçenek | Açıklama | Android risk | Legal risk |
|---------|----------|--------------|------------|
| **A — Status quo** | `aiSummary` taşınmaya devam | Düşük (mevcut APK) | **Yüksek** (summary forbidden) |
| **B — Boş `aiSummary`** | Backend `""` gönder | Orta (boş kart) | Orta |
| **C — Alan kaldır** | DTO'dan `aiSummary` çıkar | **Yüksek** (deserialize/UI) | Düşük |
| **D — Staged: Android fallback sonra backend** | Önce UI boş özet güvenli; sonra backend temizlik | **Düşük** (kontrollü) | Düşük (hedef) |
| **E — Aktif guard binding** | Runtime strip | **Yüksek** | Orta — önerilmez (PR #29/#30) |

**Önerilen:** **D** (staged migration).

---

## Recommended Staged Migration

### Aşama 1 — Android fallback PR (APK gerekir)

- `FeedScreen` / `AiCuratedDetailScreen`: `aiSummary` boşsa gövde metnini gizle veya “Özet yok — kaynağa git” placeholder.
- `AiCuratedFeedDto`: `aiSummary` optional veya boş string tolere (geriye uyum).
- Debug APK: `%USERPROFILE%\Desktop\haber-radari-debug-<commit>.apk`
- Cihaz doğrulama: WhatsApp → telefon → ekran görüntüsü.

### Aşama 2 — Backend DTO cleanup PR (APK-free, Aşama 1 merge + cihaz test sonrası)

- `smart-feed.ts`: TITLE_LINK_ONLY kaynaklar için `aiSummary=""` veya alan omit (Android fallback hazır olmalı).
- `rss-ingest.ts`: TITLE_LINK_ONLY için `shortDescription` ingest'te boş bırakma (opsiyonel, ingest katmanı).
- `latestRssPreview` / watchlist preview path'lerinde `shortDescription` aynı politika.
- Publish gate classification: `shortDescription` boşken yalnızca title kullan.

### Aşama 3 — Aktif legal guard binding (en son)

- Yalnızca Aşama 1–2 tamamlandıktan ve smoke/evidence temiz olduktan sonra.
- Feature flag ile dar kapsam.

---

## Risks

| Risk | Mitigasyon |
|------|------------|
| Android kart kırılması | Aşama 1 fallback zorunlu |
| Telif (summary gösterimi) | Aşama 2 backend cleanup |
| NTV/Habertürk dışı etki | Source-id bazlı politika (`ntv_son_dakika`, `haberturk_ekonomi` only) |
| Publish gate davranışı | Classification input ayrı test |
| Hukuki kesinlik iddiası | Hukuk danışmanı teyidi |

---

## Acceptance Criteria (future cleanup PR)

- [ ] Android fallback merge + cihaz smoke (boş `aiSummary` kartı)
- [ ] Backend PR: NTV/Habertürk item'larında `aiSummary` boş veya omit
- [ ] `publishedCount` / ordering regression test
- [ ] `titleLinkOnlySummaryPolicyAudit.userVisibleSummaryItemCount` → 0
- [ ] `legalContentGuardrailDryRun.wouldStripFieldCount` düşer (dry-run)
- [ ] Aktif guard binding **bu PR'da yok**

---

## Hukuk Danışmanı Teyidi Gereken Noktalar

1. NTV/Habertürk RSS ToS: başlık + link dışında kısa özet gösterimi izinli mi?
2. `TITLE_LINK_ONLY` allowed field listesi yeterli mi?
3. RSS `contentSnippet` kullanımı üçüncü taraf uygulama için serbest mi?
4. Görsel (`imageUrl` / enclosure) gösterim politikası.
5. Smart digest (metadata LLM özeti) ayrı blok olarak izinli mi?

---

## Referanslar

- PR #32: `title-link-only-summary-policy-audit-v0.md`
- PR #31 / #34: AA/TRT runtime disable
- `apps/api/src/routes/smart-feed.ts` L91–105 (`aiSummary` mapping)
- `apps/api/src/services/rss-ingest.ts` L79–98 (`shortDescription` mapping)
