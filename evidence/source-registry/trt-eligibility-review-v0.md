# TRT Eligibility Review v0

## Amaç

TRT Haber (`trt_haber`) kaynağının `NEEDS_REVIEW` durumunu evidence ile netleştirmek. Bu belge hukuk/uygunluk inceleme çıktısıdır; runtime davranışı değiştirmez.

**Önemli:** Bu belge hukuki kesin hüküm vermez. RSS feed varlığı kullanım izni sayılmaz. ToS/robots/lisans ve hukuk danışmanı teyidi gerekir.

## Referanslar

- PR #31: AA runtime disable (`717da72`)
- PR #32: TITLE_LINK_ONLY summary policy audit (`ecb3e0b`)
- Registry SSOT: `docs/research/source-registry-ssot-v0-preimplementation.md`
- Summary audit: `evidence/source-registry/title-link-only-summary-policy-audit-v0.md`

---

## 1. Current Runtime Status

| Alan | Değer |
|------|-------|
| `sourceId` | `trt_haber` |
| `name` | TRT Haber |
| `feedUrl` | `https://www.trthaber.com/manset_articles.rss` |
| `enabled` | **true** |
| `trustTier` | HIGH |
| Ingest | `rss-ingest.ts` enabled kaynaklar listesinde |
| Publish gate | Genel algoritma; registry `publishEligible` kontrol etmez |

**Drift:** Runtime TRT’yi ingest ediyor; registry `publishEligible=false` diyor.

---

## 2. Current Registry Status

| Alan | Değer |
|------|-------|
| `legalMode` | **NEEDS_REVIEW** |
| `reviewStatus` | pending |
| `publishEligible` | **false** |
| `summaryPolicy` | forbidden |
| `authorityTier` | PRIMARY_WIRE_OR_AGENCY |
| Hedef (not) | ToS/review tamamlanana kadar NEEDS_REVIEW; hedef TITLE_LINK_ONLY |

### Allowed fields (registry)

`title`, `canonicalUrl`, `sourceName`, `publishedAt`, `category`

### Forbidden fields (registry)

`description`, `summary`, `body`, `fullText`, `contentHtml`, `rawHtml`, `articleText`, `scrapedText`, `image`, `video`, `audio`, `caption`

**Taşınmaması gerekenler:** full text, raw HTML, görsel, video, caption, transkript.

---

## 3. Feed / User-Visible Impact

### TRT item feed’e giriyor mu?

- Publish gate koşulları sağlandığında TRT kaynaklı cluster’lar `PUBLISH_MAIN` olabilir.
- Post-PR #31 smoke: `publishedCount=0` (snapshot’ta yalnızca AA vardı; AA kapatıldı).
- TRT ingest aktif; item yayını publish gate ve cluster içeriğine bağlı.

### Summary/description riski (PR #32 unit test)

| Alan | Kaynak | User-visible? |
|------|--------|---------------|
| `aiSummary` | RSS `shortDescription` → `smart-feed` mapping | **Evet** (Android `FeedScreen`, `AiCuratedDetailScreen`) |
| `summary` / `description` | Audit alias / RSS metadata | Evet (`aiSummary` üzerinden) |

TRT `NEEDS_REVIEW` + `summaryPolicy=forbidden` iken `aiSummary` taşınması **legal drift** oluşturur (AA öncesi duruma benzer risk profili, farklı legalMode).

---

## 4. Legal Risk Classification

| Risk | Seviye | Not |
|------|--------|-----|
| Registry `NEEDS_REVIEW` iken runtime enabled | **Yüksek drift** | Production eligibility net değil |
| `aiSummary` / RSS description user-visible | **Yüksek** | `summaryPolicy=forbidden` ile çelişir |
| RSS varlığı = izin | **Yanıltıcı** | Feed URL tek başına ToS/lisans kanıtı değil |
| Full text / medya scrape | **Kontrollü** | Mevcut pipeline metadata-only; yine de policy ihlali taşımamalı |

---

## 5. Karar Seçenekleri (bu PR’da uygulanmaz)

### Öneri A — `NEEDS_REVIEW` kalsın (kısa vade öneri)

- Registry değişmez; `publishEligible=false`, `reviewStatus=pending`.
- Runtime ingest **ayrı onaylı PR** ile registry ile hizalanana kadar gözden geçirilmeli.
- **Ne zaman:** Hukuk danışmanı / ToS incelemesi tamamlanana kadar.

### Öneri B — `TITLE_LINK_ONLY` (ayrı PR, review sonrası)

- Onay + `reviewStatus=approved` sonrası registry güncellemesi.
- Runtime: yalnızca title + link + metadata; **summary/description taşınmamalı**.
- Backend DTO cleanup + (gelecekte) Android fallback ayrı PR’lar.
- **Ne zaman:** Hukuk danışmanı TITLE_LINK_ONLY metadata sınırını onayladıktan sonra.

### Öneri C — Runtime disable (ayrı onaylı PR, AA modeli)

- `trt_haber.enabled=false` + `disabledReason` (ör. `registry_needs_review_pending`).
- Publish davranışı bilinçli değişir (`legalBlockApplied`).
- **Ne zaman:** Review tamamlanmadan drift kabul edilemiyorsa (AA #31 benzeri).

---

## 6. Bu Review Sonrası Önerilen Sıra (APK-free)

1. **Hukuk danışmanı / ürün:** TRT ToS, RSS kullanım koşulu, metadata sınırı teyidi.
2. Drift kabul edilemiyorsa → **Öneri C** (runtime disable, onaylı küçük PR).
3. Review olumlu + TITLE_LINK_ONLY onayı → **Öneri B** (registry + dar runtime policy).
4. NTV/Habertürk TITLE_LINK_ONLY backend cleanup planı (TRT kararından sonra).
5. Android fallback → APK güncellemesi yapılabilecek zamana ertelenir.

**Bu review’ın operasyonel önerisi:** Kısa vadede **Öneri A + drift azaltma için Öneri C değerlendirmesi** (AA ile paralel mantık). Kesin “TRT kullanılabilir” demeden, review tamamlanana kadar yayın hattında summary taşımamak en güvenli çizgi.

---

## 7. Hukuk Danışmanı Teyidi Gereken Noktalar

| # | Konu | Soru |
|---|------|------|
| 1 | RSS kullanımı | `manset_articles.rss` üçüncü taraf uygulama için kullanılabilir mi? |
| 2 | ToS / robots | Başlık + link dışında kısa özet/description gösterimine izin var mı? |
| 3 | Kamu yayıncı statüsü | TRT için farklı metadata sınırı geçerli mi? |
| 4 | `TITLE_LINK_ONLY` hedefi | Onaylanırsa allowed field listesi yeterli mi? |
| 5 | Görsel / video | RSS enclosure veya medya hint’leri kullanılabilir mi? |
| 6 | Atıf / kaynak gösterimi | `sourceName` + `canonicalUrl` yeterli mi? |
| 7 | Geçici yayın | Review süresince runtime disable gerekli mi? |

---

## 8. Test / Smoke

| Kontrol | Sonuç |
|---------|-------|
| Runtime kod değişikliği | Yok |
| Android/APK | Değişmedi |
| `pnpm vitest run src` | PASS (merge öncesi doğrulama) |

Smoke: `evidence/source-registry/trt-eligibility-review-smoke-v0.json`

---

## 9. Sonuç Özeti

| Soru | Cevap |
|------|-------|
| Runtime TRT enabled? | Evet |
| Registry legalMode? | NEEDS_REVIEW |
| publishEligible? | false |
| aiSummary user-visible (item yayınlanırsa)? | Evet |
| Güvenli hedef (review öncesi)? | NEEDS_REVIEW kalsın; drift için runtime disable ayrı PR değerlendir |
| Kesin kullanılabilirlik? | **Belirlenmedi** — hukuk danışmanı teyidi gerekir |
