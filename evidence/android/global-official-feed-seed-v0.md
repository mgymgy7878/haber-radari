# Android Global Official Feed Seed v0

**Branch:** `feat/global-official-feed-seed-v0`  
**Main baseline:** `16b2c38` (PR #68 — global official ToS review)  
**Gate referansları:**
- PR #67 — [global-official-feeds-audit-v0.md](../research/global-official-feeds-audit-v0.md)
- PR #68 — [global-official-tos-review-v0.md](../research/global-official-tos-review-v0.md)

**Kod değişti mi:** Evet  
**Manifest/Gradle/XML değişti mi:** Hayır  
**Schema migration var mı:** Hayır  
**API/backend değişti mi:** Hayır (`apps/api/src/source-registry/source-registry-v0.json` dokunulmadı)  
**Play/B5 hattına dokunuldu mu:** Hayır

---

## Değişen dosyalar

```text
apps/android/app/src/main/assets/source-registry-v0.json
apps/android/app/src/main/java/com/haberradari/data/registry/AndroidSeedRegistryDeriver.kt
apps/android/app/src/main/java/com/haberradari/data/remote/RssParser.kt
apps/android/app/src/test/java/com/haberradari/AndroidSeedRegistryDeriverTest.kt
apps/android/app/src/test/java/com/haberradari/SourceSeedRefreshPolicyTest.kt
apps/android/app/src/test/java/com/haberradari/GlobalOfficialFeedSeedV0Test.kt
evidence/android/global-official-feed-seed-v0.md
```

Android registry: **21 → 24** kayıt (yalnızca 3 global eklendi).  
Android seed runtime binding: **3 → 6** (3 TR + 3 global).

---

## Eklenen kaynaklar

### 1. Federal Reserve (`fed-press` / `fed_press`)

| Alan | Değer |
|------|-------|
| Feed URL | `https://www.federalreserve.gov/feeds/press_all.xml` |
| Feed evidence | PR #67 satır 38, 77 |
| ToS gate | PR #68 — **TOS_PASS_METADATA_ONLY** |
| legalMode | `TITLE_LINK_ONLY` |
| default enabled | **false** (muhafazakâr; kullanıcı Kaynak Yönetimi’nden açar) |
| authority | `OFFICIAL_PRIMARY` |
| category | ekonomi |

**Allowed fields:** title, sourceName, publishedAt, original/canonical link, category  
**Forbidden fields:** description, summary, body, fullText, contentHtml, rawHtml, articleText, scrapedText, image, video, audio, caption, articleSummary, aiSummary

### 2. EU Commission Press (`eu-commission-press` / `eu_commission_press`)

| Alan | Değer |
|------|-------|
| Feed URL | `https://ec.europa.eu/commission/presscorner/api/rss` |
| Feed evidence | PR #67 satır 50, 78 |
| ToS gate | PR #68 — **TOS_PASS_METADATA_ONLY** |
| legalMode | `TITLE_LINK_ONLY` |
| default enabled | **false** (muhafazakâr) |
| authority | `OFFICIAL_PRIMARY` |
| category | dünya |

**Allowed fields:** title, sourceName, publishedAt, original/canonical link, category  
**Forbidden fields:** description, summary, body, fullText, contentHtml, rawHtml, articleText, scrapedText, image, video, audio, caption, articleSummary

### 3. USGS Earthquakes (`usgs-earthquakes` / `usgs_earthquakes`)

| Alan | Değer |
|------|-------|
| Feed URL | `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.atom` |
| Feed evidence | PR #67 satır 48, 80 |
| ToS gate | PR #68 — **TOS_PASS_METADATA_ONLY** (dar afet metadata) |
| legalMode | `RSS_METADATA_ONLY` |
| default enabled | **true** (resmi afet metadata sinyali) |
| authority | `OFFICIAL_PRIMARY` |
| category | afet |

**Allowed fields:** title, link, publishedAt/updated, sourceName, category/region/severity (metadata)  
**Forbidden fields:** body, fullText, contentHtml, rawHtml, articleText, scrapedText, image, video, audio, caption, articleSummary

**RssParser notu:** `RSS_METADATA_ONLY` modunda HTML içeren description (`<`) null bırakılır; USGS Atom summary güvenliği. ISO-8601 fractional seconds (`Instant.parse`) desteklenir.

---

## Eklenmeyen kaynaklar

| Kaynak | Neden |
|--------|-------|
| ECB | PR #68 — `TITLE_LINK_ONLY_ONLY` (ToS gate geçmedi) |
| CISA | PR #68 — `TITLE_LINK_ONLY_ONLY` |
| WHO | PR #68 — `NEEDS_REVIEW` |
| Reuters, AP, AFP, NYT, BBC, DW, Guardian, CNN, Bloomberg, FT | Kapsam dışı — ticari/ajans |

---

## Mevcut TR seed korunumu

| Kaynak | legalMode | default enabled | Durum |
|--------|-----------|-----------------|-------|
| NTV Türkiye | `TITLE_LINK_ONLY` | true | Korundu |
| Habertürk | `TITLE_LINK_ONLY` | true | Korundu |
| BBC Türkçe | `NEEDS_REVIEW` | true (görünür) | Ingest kapalı — `blocksProductionIngest()` |

`SourceSeedRefreshPolicy`: kullanıcı `enabled=false` tercihi refresh sonrası ezilmez (mevcut testler PASS).

---

## Legal-safe metadata-only çizgi

- Makale özeti / parafraz / scrape yok
- AI özet / çeviri yok
- Tam metin, görsel, caption, scraped body yok
- Ürün dili: kaynak sinyali, kaynak profili, orijinal kaynağa yönlendirme
- “Haber doğrulama” iddiası yok

---

## Test sonuçları

```text
./gradlew :app:testDebugUnitTest  → BUILD SUCCESSFUL (199 tests)
./gradlew :app:assembleDebug      → BUILD SUCCESSFUL
```

Yeni/güncellenen testler:
- `GlobalOfficialFeedSeedV0Test` — 3 global kaynak, legalMode, default enabled, excluded sources, forbidden fields, RssParser TITLE_LINK_ONLY / USGS ISO date
- `AndroidSeedRegistryDeriverTest` — 6 seed / 24 registry
- `SourceSeedRefreshPolicyTest` — 6 refreshable seed, fresh install 6 kaynak

---

## Device / manual smoke

**Atlandı** — `adb` PATH’te yok (`where.exe adb` → bulunamadı).

Manuel doğrulama checklist (sonraki cihaz oturumunda):
- Kaynak Yönetimi’nde Fed / EU Commission / USGS görünür
- LegalMode chip’leri: Fed/EU `TITLE_LINK_ONLY`, USGS `RSS_METADATA_ONLY`
- BBC hâlâ NEEDS_REVIEW / ingest kapalı
- Feed kartında title/date/source/link dışında body yok
- Orijinal kaynağa git aksiyonu mevcut
