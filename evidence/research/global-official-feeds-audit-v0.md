# Global Resmi/Kurumsal Feed Audit v0

**Branch:** `docs/global-official-feeds-audit-v0`  
**Main baseline:** `ea5856b` (PR #66 — global source expansion strategy v0)  
**Strateji referansı:** [global-source-expansion-strategy-v0.md](../../docs/research/global-source-expansion-strategy-v0.md)  
**Audit tarihi:** 2026-06-30  
**Tür:** Evidence-only — kod / seed / registry değişikliği yok  
**Play/KVKK/B5:** Dokunulmadı

---

## Özet

PR #66 sonrası **global resmi/kurumsal** kaynak adayları için feed/API URL, HTTP erişim, metadata alan yapısı, ToS/robots notu ve gate sınıflandırması denetlendi. Ağ üzerinden `curl -I -L` / `curl -sL` (max 15–20s) kullanıldı; **tam metin kopyalama, scrape, görsel ve caption çekimi yapılmadı.**

**Sonuç:** Bu audit PASS ile **hiçbir kaynak `APPROVED_METADATA_SOURCE` almadı.** Teknik feed erişimi olan kaynakların çoğu **ToS/lisans/yeniden dağıtım teyidi eksik** olduğu için `NEEDS_REVIEW`. IMF, World Bank, Eurostat, EMSC (RSS), CERT-EU, NIST (boş kanal) için doğrulanmış RSS ingest yolu bulunamadı veya otomatik erişim başarısız (`NO_FEED_FOUND` / `NEEDS_REVIEW`).

**Gate kuralı:** `APPROVED_METADATA_SOURCE` olmayan kaynak sonraki seed PR’a **alınmaz**.

**Güvenli içerik modeli (PR #66):** Feed’te `description` / `content` / HTML özet olsa bile ingest’te **yalnızca** title, link, publishedAt, kaynak adı, kategori sinyali kullanılır; makale özeti/parafraz üretilmez.

---

## Kapsam dışı (bu PR’da denetlenmedi)

Ajans ve ticari medya — ayrı “commercial/global media audit” hattına ertelendi:

```text
Reuters, AP, AFP, NYT, Guardian, BBC, DW, CNN, Bloomberg, FT
```

---

## Denetlenen kaynaklar — özet tablo

| Kaynak | `sourceId` adayı | Domain | Feed/API adayı | HTTP | Content-Type | Örnek metadata alanları | summary/body feed’te? | ToS notu | robots.txt | Gate sonucu | Önerilen legalMode | Seed önerisi |
|--------|------------------|--------|----------------|------|--------------|-------------------------|----------------------|----------|------------|-------------|-------------------|--------------|
| **Federal Reserve** | `fed_press` | federalreserve.gov | `…/feeds/press_all.xml` | 200 | `text/xml` | `title`, `link`, `pubDate`; `description` ≈ başlık tekrarı | Kısa `description` var — **ingest edilmeyecek** | ToS bu audit’te doğrulanmadı | `/robots.txt` → 404 HTML | **NEEDS_REVIEW** | `TITLE_LINK_ONLY` | ToS sonrası aday |
| **ECB** | `ecb_press` | ecb.europa.eu | `…/rss/press.html` | 200 | `application/rss+xml` | `title`, `link`, `pubDate` | Item düzeyinde uzun body yok | ToS doğrulanmadı | 200; çok sayıda `Disallow` dil yolu | **NEEDS_REVIEW** | `RSS_METADATA_ONLY` | ToS sonrası güçlü aday |
| **IMF** | `imf_news` | imf.org | `…/en/news/rss` | 200 | `text/html` (SPA) | — (XML RSS değil) | — | ToS doğrulanmadı | 200 (Vercel) | **NO_FEED_FOUND** | — | Otomatik RSS yok; API/legacy feed 403 |
| **World Bank** | `worldbank_news` | worldbank.org | `…/en/news/all/rss`, `…/press-release/rss` | 404 | `text/html` | — | — | ToS doğrulanmadı | 200 | **NO_FEED_FOUND** | — | Public RSS kanıtı yok |
| **OECD** | `oecd_news` | oecd.org | `…/newsroom/releasesandstatements/rss.xml` | 403 | `text/html` (CF challenge) | — | — | ToS doğrulanmadı | 200 | **NEEDS_REVIEW** | `RSS_METADATA_ONLY` | WAF otomatik erişimi engelledi; manuel teyit gerekir |
| **WHO** | `who_news` | who.int | `…/rss-feeds/news-english.xml` | 200 | `application/rss+xml` | `title`, `link`, `pubDate`, `description` | `description` + `a10:content` HTML — **ingest yasak** | ToS doğrulanmadı | 200 | **NEEDS_REVIEW** | `TITLE_LINK_ONLY` | title+link only; content alanı kullanılmaz |
| **CDC** | `cdc_media` | cdc.gov | `tools.cdc.gov/…/132608.rss` | 200 | `text/xml` | `title`, `link`, `pubDate` | Channel `description`; item düzeyi kontrol sınırlı | ToS doğrulanmadı | 200 | **NEEDS_REVIEW** | `TITLE_LINK_ONLY` | Feed eski (`lastBuildDate` 2023); canlılık teyidi gerekir |
| **FDA** | `fda_press` | fda.gov | `…/press-releases/rss.xml` | 200 | `application/rss+xml` | `title`, `link`, `pubDate`, `description` (kısa) | Kısa `description` — **ingest edilmeyecek** | ToS doğrulanmadı | 200 | **NEEDS_REVIEW** | `TITLE_LINK_ONLY` | ToS sonrası aday |
| **EMA** | `ema_news` | ema.europa.eu | `…/news/rss.xml`, `…/press-releases/rss.xml` | 429 / 404 | — / HTML | — | — | ToS doğrulanmadı | 200 | **NEEDS_REVIEW** | `RSS_METADATA_ONLY` | Rate limit (429); URL teyidi gerekir |
| **NHS England** | `nhs_england` | england.nhs.uk | `…/feed/` | 200 | `application/rss+xml` | `title`, `link`, `pubDate` | Item `description` boş görünüyor | ToS doğrulanmadı | *(denetlenmedi)* | **NEEDS_REVIEW** | `TITLE_LINK_ONLY` | ToS sonrası aday |
| **USGS** | `usgs_earthquakes` | earthquake.usgs.gov | `…/summary/all_day.atom` | 200 | Atom XML | `title`, `link`, `updated`; `summary` yapılandırılmış metadata | `summary` HTML (zaman/konum) — afet sinyali; tam metin değil | ToS/API kullanım doğrulanmadı | usgs.gov robots 200 | **NEEDS_REVIEW** | `RSS_METADATA_ONLY` | JSON/Atom adapter ayrı gate |
| **EMSC** | `emsc_events` | seismicportal.eu | `fdsnws/event/1/query?format=rss` | 400 | — | — | — | ToS/API doğrulanmadı | 200 | **NO_FEED_FOUND** (RSS) | — | `format=rss` desteklenmiyor; yalnızca xml/json/text |
| **EU Commission** | `eu_commission_press` | ec.europa.eu | `…/presscorner/api/rss` | 200 | `application/rss+xml` | `title`, `link`, `pubDate`, `category`, `description` | `description` paragraf — **ingest edilmeyecek** | ToS doğrulanmadı | 200 (boş gövde header) | **NEEDS_REVIEW** | `TITLE_LINK_ONLY` | ToS sonrası aday |
| **Eurostat** | `eurostat_news` | ec.europa.eu/eurostat | çeşitli `/rss` yolları | 404 | `text/html` | — | — | ToS doğrulanmadı | — | **NO_FEED_FOUND** | — | Doğrulanmış news RSS bulunamadı |
| **CISA (news)** | `cisa_news` | cisa.gov | `…/news.xml` | 200 | `application/rss+xml` | `title`, `link`, `pubDate` | Item yapısı ayrı doğrulanmalı | ToS doğrulanmadı | 200 | **NEEDS_REVIEW** | `TITLE_LINK_ONLY` | ToS sonrası aday |
| **CISA (advisories)** | `cisa_advisories` | cisa.gov | `…/cybersecurity-advisories.xml` | 200 | `application/rss+xml` | `title`, `link` | `description` içinde HTML — **ingest yasak** | ToS doğrulanmadı | 200 | **NEEDS_REVIEW** | `TITLE_LINK_ONLY` | title+link only |
| **NIST** | `nist_cybersecurity` | nist.gov | `…/cybersecurity/rss.xml` | 200 | `application/rss+xml` | channel boş | — | ToS doğrulanmadı | 200 | **NO_FEED_FOUND** | — | Kanal item içermiyor (boş feed) |
| **CERT-EU** | `cert_eu_advisories` | cert.europa.eu | `…/security-advisories/rss` | 404 | `text/html` | — | — | ToS doğrulanmadı | 200 | **NO_FEED_FOUND** | — | Public RSS kanıtı yok; HTML yayın sayfası 200 |

---

## Final sınıflandırma özeti

| Gate sonucu | Kaynaklar |
|-------------|-----------|
| **APPROVED_METADATA_SOURCE** | *(yok — ToS/lisans teyidi bu audit’te tamamlanmadı)* |
| **TITLE_LINK_ONLY** *(önerilen mod, seed değil)* | Fed, WHO, FDA, NHS, EU Commission, CISA (news/advisories) — feed’te özet/HTML olsa bile yalnızca title+link |
| **NEEDS_REVIEW** | Fed, ECB, OECD, WHO, CDC, FDA, EMA, NHS, USGS, EU Commission, CISA (×2) |
| **NO_FEED_FOUND** | IMF, World Bank, EMSC (RSS), Eurostat, NIST, CERT-EU |
| **DISABLED** | — |
| **LICENSE_REQUIRED** | — |

---

## Sonraki seed PR adayları (yalnızca ToS/legal PASS sonrası)

Teknik feed + metadata uygunluğu en güçlü adaylar (öncelik sırası önerisi):

1. **ECB** — `ecb_press` — `https://www.ecb.europa.eu/rss/press.html`
2. **Federal Reserve** — `fed_press` — `https://www.federalreserve.gov/feeds/press_all.xml`
3. **EU Commission Press** — `eu_commission_press` — `https://ec.europa.eu/commission/presscorner/api/rss`
4. **WHO** — `who_news` — title+link only; `a10:content` yasak
5. **USGS Earthquakes** — `usgs_earthquakes` — Atom adapter; afet sinyali kategorisi
6. **FDA Press** — `fda_press`
7. **NHS England** — `nhs_england`
8. **CISA** — `cisa_news` / `cisa_advisories` (title+link only)

**Seed’e alınmayacak veya teyit gerektiren:**

| Kaynak | Neden |
|--------|-------|
| IMF, World Bank, Eurostat, CERT-EU, NIST | Doğrulanmış RSS/ingest yolu yok |
| EMSC | RSS desteklenmiyor; JSON/XML API ayrı adapter + ToS gate |
| OECD | Otomatik audit 403 (Cloudflare); manuel/browser teyidi gerekir |
| EMA | 429 rate limit; URL ve ToS teyidi gerekir |
| CDC | Feed güncelliği şüpheli (lastBuild 2023) |

---

## URL erişim çıktıları (özet)

Komutlar: `curl -I -L --max-time 20 <url>`, `curl -sL --max-time 20 <url>` (yalnızca tag yapısı).

### Federal Reserve

```text
GET https://www.federalreserve.gov/feeds/press_all.xml
→ 200 text/xml
→ Örnek: <title>, <link>, <pubDate>, <description> (çoğunlukla başlık tekrarı)

GET https://www.federalreserve.gov/robots.txt → 404 HTML
```

### ECB

```text
GET https://www.ecb.europa.eu/rss/press.html
→ 200 application/rss+xml
→ Örnek item: <title>, <link>, <pubDate> (body/summary yok)

GET https://www.ecb.europa.eu/robots.txt → 200; çok sayıda Disallow dil yolu
```

### IMF

```text
GET https://www.imf.org/en/news/rss
→ 200 text/html (Next.js SPA; XML RSS değil)

GET https://www.imf.org/external/np/sec/pr/2013/pr/feed.aspx → 403 Forbidden (Akamai)
```

### World Bank

```text
GET https://www.worldbank.org/en/news/all/rss → 404
GET https://www.worldbank.org/en/news/press-release/rss → 404
GET https://www.worldbank.org/robots.txt → 200
```

### OECD

```text
GET https://www.oecd.org/newsroom/releasesandstatements/rss.xml → 403 (Cloudflare challenge)
GET https://www.oecd.org/robots.txt → 200
```

### WHO

```text
GET https://www.who.int/rss-feeds/news-english.xml
→ 200 application/rss+xml
→ <title>, <link>, <pubDate>, <description>, <a10:content> (HTML) — content ingest yasak

GET https://www.who.int/robots.txt → 200
```

### CDC

```text
GET https://tools.cdc.gov/api/v2/resources/media/132608.rss
→ 200 text/xml
→ channel title/link; lastBuildDate Thu, 03 Aug 2023

GET https://www.cdc.gov/robots.txt → 200
```

### FDA

```text
GET https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml
→ 200 application/rss+xml
→ <title>, <link>, <pubDate>, <description> (kısa snippet — ingest edilmeyecek)

GET https://www.fda.gov/robots.txt → 200
```

### EMA

```text
GET https://www.ema.europa.eu/en/news-events/news/rss.xml → 429 Too Many Requests
GET https://www.ema.europa.eu/en/news-events/press-releases/rss.xml → 404
```

### NHS England

```text
GET https://www.england.nhs.uk/feed/
→ 200 application/rss+xml
→ <title>, <link>, <pubDate>
```

### USGS

```text
GET https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.atom
→ 200 Atom XML
→ <title>, <updated>, <link rel="alternate">, <summary> (zaman/konum metadata)
```

### EMSC

```text
GET …/fdsnws/event/1/query?format=rss&limit=5
→ 400 — format=rss desteklenmiyor (xml|json|text…)

GET https://www.seismicportal.eu/feeds/rss.xml → 404
GET https://www.seismicportal.eu/robots.txt → 200
```

### EU Commission

```text
GET https://ec.europa.eu/commission/presscorner/api/rss
→ 200 application/rss+xml
→ <title>, <link>, <pubDate>, <category>, <description> (ingest edilmeyecek)

GET https://ec.europa.eu/robots.txt → 200 (Content-Length: 0 header)
```

### Eurostat

```text
GET https://ec.europa.eu/eurostat/api/dissemination/catalogue/rss → 404
GET https://ec.europa.eu/eurostat/web/products-eurostat-news/-/rss.xml → 404
GET https://ec.europa.eu/eurostat/cache/rss/en_news.xml → 404
```

### CISA

```text
GET https://www.cisa.gov/news.xml → 200 application/rss+xml
GET https://www.cisa.gov/cybersecurity-advisories/cybersecurity-advisories.xml → 200
→ description alanında HTML — ingest yasak

GET https://www.cisa.gov/robots.txt → 200
```

### NIST

```text
GET https://www.nist.gov/news-events/cybersecurity/rss.xml
→ 200 application/rss+xml; channel item yok (boş feed)

GET https://www.nist.gov/robots.txt → 200
```

### CERT-EU

```text
GET https://cert.europa.eu/publications/security-advisories/rss → 404
GET https://cert.europa.eu/publications → 301 → /publications/security-advisories/2026 (HTML)
GET https://cert.europa.eu/robots.txt → 200
```

---

## Metadata-only ingest politikası (bu audit)

| Feed alanı | Ingest |
|------------|--------|
| `title` | Evet |
| `link` / `guid` (canonical) | Evet |
| `pubDate` / `updated` | Evet |
| `category` / `dc:subject` | Evet (sinyal) |
| `description` / `summary` / `content` / `a10:content` | **Hayır** (TITLE_LINK_ONLY veya strip) |
| Görsel / `media:*` / enclosure | **Hayır** |
| Makale scrape / AI özet | **Hayır** |

---

## Riskler

| Risk | Seviye | Not |
|------|--------|-----|
| RSS varlığı = izin sanılması | Orta | Hiçbir kaynak APPROVED almadı |
| WHO/CISA HTML content alanları | Yüksek | title+link only zorunlu |
| OECD/IMF WAF/SPA | Orta | Otomatik ingest öncesi adapter teyidi |
| USGS/EMSC afet adapter farkı | Orta | RSS seed modelinden farklı olabilir |
| CDC eski feed | Orta | Canlılık doğrulanmalı |

---

## Doğrulama

| Kontrol | Sonuç |
|---------|-------|
| Kod değişti mi | **Hayır** |
| Android seed/binding değişti mi | **Hayır** (hâlâ 3 TR seed) |
| Registry/feedUrl değişti mi | **Hayır** |
| Manifest/Gradle/XML değişti mi | **Hayır** |
| Test çalıştırıldı mı | **Hayır** — docs/evidence-only audit PR |
| Play/B5 hattına dokunuldu mu | **Hayır** |
| Network komutları | Evet — `curl` özetleri yukarıda |
| Ajans/ticari medya | Kapsam dışı |

---

## Sonraki adımlar

1. Seçili `NEEDS_REVIEW` kaynaklar için ToS/yeniden dağıtım incelemesi (ayrı compliance notu)
2. `feat/global-official-seed-v0` — yalnızca legal PASS + operatör onayı sonrası
3. OECD/EMA manuel feed teyidi (WAF/rate limit)
4. EMSC JSON/XML adapter tasarımı (afet hattı)
5. `docs/global-commercial-media-audit-v0` — ticari medya (ayrı PR)

---

## Revizyon

| Sürüm | Tarih | Not |
|-------|-------|-----|
| v0 | 2026-06-30 | İlk global resmi/kurumsal feed audit; 18 kaynak |
