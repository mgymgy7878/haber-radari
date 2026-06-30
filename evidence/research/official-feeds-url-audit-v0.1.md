# Resmi Kaynak Feed URL Audit v0.1

**Branch:** `docs/official-feeds-url-audit-v0.1`  
**Main baseline:** `b4616cb` (PR #58 merge — AFAD Android seed)  
**Audit tarihi:** 2026-06-30  
**Play/KVKK/B5:** Dokunulmadı  
**Kod değişikliği:** Yok (evidence-only)

---

## Özet

PR #58 sonrası Android seed’e alınmadan önce **TCMB, KAP, TÜİK, deprem.afad, SPK** için feed URL + ToS/robots + metadata alan uygunluğu denetlendi. Ağ üzerinden `curl -I` / `curl -L` ile erişim doğrulandı; tam metin/görsel/scrape yapılmadı.

**Sonuç:** Bu audit PASS ile **hiçbir kaynak `APPROVED_FEED_URL` almadı.** TCMB ve deprem.afad için aday URL/API bulundu ancak ToS/alan kalitesi/adapter kapsamı nedeniyle `NEEDS_REVIEW`. KAP, TÜİK, SPK için doğrulanmış RSS feed bulunamadı (`NO_FEED_FOUND`).

**Regresyon notu (kapsam dışı ama kritik):** Mevcut Android seed’deki AFAD `feedUrl` (`https://www.afad.gov.tr/rss`) audit anında **302 → `/Hata/Page404`** döndü; ayrı feed doğrulama/fix PR’ı gerekir.

---

## Denetlenen kaynaklar

|Gate: audit PASS olmayan kaynak Android seed’e **alınmaz**.

| Kaynak | Registry `sourceId` | Registry `feedUrl` | Audit sonucu |
|--------|---------------------|--------------------|--------------|
| TCMB | `tcmb` | *(yok)* | `NEEDS_REVIEW` |
| KAP | `kap` | *(yok)* | `NO_FEED_FOUND` |
| TÜİK | `tuik` | *(yok)* | `NO_FEED_FOUND` |
| deprem.afad | `deprem_afad` | *(yok)* | `NO_FEED_FOUND` (RSS); JSON API → `NEEDS_REVIEW` |
| SPK | `spk` | *(yok)* | `NO_FEED_FOUND` |

---

## Kaynak bazlı tablo

| Kaynak | Resmi domain | Feed/API adayı | Erişim | HTTP | Content-Type (header) | Örnek alanlar | ToS notu | robots.txt | Lisans/risk | Önerilen legalMode | Önerilen reviewStatus | Seed önerisi |
|--------|--------------|----------------|--------|------|----------------------|---------------|----------|------------|-------------|-------------------|----------------------|--------------|
| **TCMB** | `tcmb.gov.tr` | Atom: `…/RSS/Basin+Duyurulari` (ve PPK/Yayınlar/Veriler alt yolları) | Evet (GET) | 200 | `text/html; charset=UTF-8` *(gövde Atom XML)* | `link`, `published`, `updated`; `title` çoğu entry’de boş | Kullanım koşulu sayfası bu audit’te doğrulanmadı | 200; `Disallow: */search+results` | Resmi kurum; yeniden dağıtım ToS teyidi gerekir | `RSS_METADATA_ONLY` | `needs_review` | **`NEEDS_REVIEW`** |
| **KAP** | `kap.org.tr` | `/tr/rss`, `/tr/api/disclosure/rss`, `/tr/api/disclosure/list` | Hayır (404) | 404 | `text/html` | — | ToS incelenmedi; public RSS kanıtı yok | WAF: `HTTP/1.0 666`, HTML hata | MKK/KAP verisi; lisans/API koşulu belirsiz | `RSS_METADATA_ONLY` | `needs_review` | **`NO_FEED_FOUND`** |
| **TÜİK** | `tuik.gov.tr` | `/rss`, `veriportali.tuik.gov.tr/rss`, `data.tuik.gov.tr/rss` | Kısmen (HTML) | 404 / 200 HTML | `text/html` | — | ToS incelenmedi | `tuik.gov.tr/robots.txt` → 404 | Resmi istatistik kurumu; feed yok | `RSS_METADATA_ONLY` | `needs_review` | **`NO_FEED_FOUND`** |
| **deprem.afad** | `deprem.afad.gov.tr` | `/rss` → SPA HTML; JSON: `servisnet.afad.gov.tr/…/deprem/apiv2/event/filter` | RSS hayır; API evet | 200 HTML / 200 JSON (GET) | `text/html` / JSON array | API: `eventID`, `location`, `date`, `magnitude`, `latitude`, `longitude` *(title/link RSS alanı yok)* | ToS/API kullanım koşulu incelenmedi | AFAD robots: genel Allow; `/rss` yolu robots’ta özel kural yok | JSON adapter RSS seed modelinden farklı; metadata-only sınırı ayrı değerlendirme | `RSS_METADATA_ONLY` *(adapter ayrı)* | `needs_review` | **`NO_FEED_FOUND`** (RSS); API → **`NEEDS_REVIEW`** |
| **SPK** | `spk.gov.tr` | `/rss`, `/SitePages/RSS.aspx` | Hayır | 302→404 | `text/html` | — | ToS incelenmedi | `/robots.txt` → 404 HTML sayfası | Regülatör; public RSS kanıtı yok | `RSS_METADATA_ONLY` | `needs_review` | **`NO_FEED_FOUND`** |

---

## URL erişim çıktıları (özet)

Komutlar: `curl -I -L --max-time 15 <url>`, `curl -sL --max-time 15 <url>` (yalnızca başlık/link/date alan yapısı).

### TCMB

```text
GET https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Bottom+Menu/Diger/RSS
→ 200 text/html (RSS indeks sayfası; alt kategoriler listelenir)

GET …/RSS/Basin+Duyurulari
→ 200; header Content-Type: text/html; gövde: Atom XML
→ Örnek: <published>18 Haz 2026 14:00:00</published>
         <link rel="alternate" href="http://www.tcmb.gov.tr/wps/wcm/connect/tr/tcmb+tr/main+menu/duyurular/basin/2026/duy2026-24"/>
→ <title> feed/entry düzeyinde çoğunlukla boş

GET https://www.tcmb.gov.tr/rss → 404
GET https://www.tcmb.gov.tr/robots.txt → 200
  User-agent: *
  Disallow: */search+results
```

**TCMB RSS alt kanalları (indeks sayfasından):** Yayınlar, Veriler, Başkanın Konuşmaları, Basın Duyuruları, PPK Kararları.

### KAP

```text
GET https://www.kap.org.tr/tr/rss → 404 text/html (Next.js)
GET https://www.kap.org.tr/tr/api/disclosure/rss → 404
GET https://www.kap.org.tr/tr/api/disclosure/list → 404
GET https://www.kap.org.tr/robots.txt → HTTP/1.0 666, HTML (WAF; robots okunamadı)
```

### TÜİK

```text
GET https://www.tuik.gov.tr/rss → 404
GET https://veriportali.tuik.gov.tr/rss → 200 text/html (SPA/shell, XML değil)
GET https://data.tuik.gov.tr/rss → 302 → veriportali.tuik.gov.tr/rss
GET https://www.tuik.gov.tr/robots.txt → 404
```

### deprem.afad

```text
GET https://deprem.afad.gov.tr/rss → 200 text/html (SPA; RSS/XML değil)
GET https://servisnet.afad.gov.tr/apigateway/deprem/apiv2/event/filter?start=2026-06-29&end=2026-06-30
→ 200 JSON array
→ Örnek alanlar: eventID, location, date, magnitude, latitude, longitude
→ title/link RSS alanı yok; canonicalUrl türetimi ayrı tasarım gerekir
HEAD aynı URL → 405 Method Not Allowed (GET gerekli)
```

### SPK

```text
GET https://www.spk.gov.tr/rss → 302 → /404.html?aspxerrorpath=/rss
GET https://www.spk.gov.tr/SitePages/RSS.aspx → 302 → 404
GET https://www.spk.gov.tr/robots.txt → 404 HTML
GET https://www.spk.gov.tr/ → 200 (site erişilebilir; RSS linki bulunamadı)
```

### Referans — mevcut AFAD seed (PR #58 regresyon)

```text
GET https://www.afad.gov.tr/rss
→ 302 Location: /Hata/Page404
→ Son durum: 404 HTML

GET https://www.afad.gov.tr/robots.txt → 200 text/plain
  Disallow: /kullanicilar, /ortak_icerik, /kurumlar (genel /rss yasağı yok)
```

---

## ToS / robots notları

| Kaynak | ToS | robots.txt |
|--------|-----|------------|
| TCMB | Bu audit’te kullanım koşulu metni okunmadı; resmi kurum metadata-only varsayımı **ToS teyidi olmadan seed’e alınmaz** | Genel erişim; yalnız arama sonuçları Disallow |
| KAP | İncelenmedi; public RSS/API kanıtı yok | WAF nedeniyle doğrulanamadı |
| TÜİK | İncelenmedi | Ana domain robots 404 |
| deprem.afad | JSON API kullanım şartları incelenmedi | AFAD parent domain robots okundu; API subdomain ayrı |
| SPK | İncelenmedi | robots.txt yok (404) |
| AFAD *(seed)* | Registry `approved` ama feedUrl audit’te kırık | `/rss` için özel Disallow yok |

**Legal-safe sınır korundu:** Tam metin, görsel, scrape, OCR yok. RSS varlığı tek başına izin sayılmadı.

---

## Risk sınıflandırması

| Sınıf | Kaynaklar |
|-------|-----------|
| **`APPROVED_FEED_URL`** | *(yok — bu audit PASS vermedi)* |
| **`NEEDS_REVIEW`** | **TCMB** (Atom feed var; ToS + boş title + kanal seçimi); **deprem.afad JSON API** (RSS değil; adapter + ToS); **AFAD mevcut seed** (feedUrl 404 — fix audit) |
| **`NO_FEED_FOUND`** | **KAP**, **TÜİK**, **SPK**; **deprem.afad** (RSS yolu) |
| **`DISABLED`** | *(yok)* |
| **`LICENSE_REQUIRED`** | *(yok — ajans/ticari kaynak kapsam dışı)* |

---

## Sonuç

### Sonraki Android seed PR’a alınabilecek kaynaklar

**Yok.** Audit PASS kriteri (doğrulanmış feed URL + ToS/robots + izinli alan evidence) karşılanmadı.

**En yakın aday (önce NEEDS_REVIEW kapatılmalı):**

- **TCMB — Basın Duyuruları Atom feed:**  
  `https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Bottom+Menu/Diger/RSS/Basin+Duyurulari`  
  Önkoşul: ToS/kullanım koşulu teyidi, boş `title` alanı için türetme/link-only stratejisi, tek kanal mı çoklu kanal mı ürün kararı.

### Alınmayacak kaynaklar (NO_FEED_FOUND)

- KAP
- TÜİK
- SPK
- deprem.afad (RSS yolu)

### Teyit gerektiren kaynaklar

- **TCMB** — ToS + metadata alan kalitesi + feed kanalı seçimi
- **deprem.afad** — JSON API adapter kapsamı, rate limit, ToS, canonical link üretimi
- **AFAD (mevcut seed)** — `https://www.afad.gov.tr/rss` 404; alternatif resmi feed URL araştırması ve registry/seed güncellemesi

---

## Doğrulama

| Kontrol | Sonuç |
|---------|--------|
| Kod değişti mi | **Hayır** |
| Android seed binding eklendi mi | **Hayır** |
| Manifest / Gradle / XML değişti mi | **Hayır** |
| Test çalıştırıldı mı | **Hayır** — `Test çalıştırılmadı; docs/evidence-only audit PR.` |
| Network doğrulama | **Evet** — curl çıktıları yukarıda özetlendi |
| Play/KVKK/B5 | Dokunulmadı |

---

## Sonraki adım önerisi

1. **`docs/official-feeds-url-audit-v0.2`** veya **`fix/afad-feed-url-regression-v0`** — AFAD feedUrl 404 düzeltmesi + alternatif URL evidence
2. **TCMB ToS + title stratejisi** — PASS sonrası `feat/personal-apk-source-expansion-official-feeds-v0.2` (TCMB Basın Duyuruları only)
3. **deprem.afad** — RSS yerine resmi JSON adapter için ayrı mimari/audit PR (seed değil)
4. KAP/TÜİK/SPK — resmi RSS/API duyurusu veya MKK/KAP geliştirici dokümantasyonu bulunana kadar seed dışı
