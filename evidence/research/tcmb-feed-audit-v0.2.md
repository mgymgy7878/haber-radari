# TCMB Feed Audit v0.2

**Branch:** `docs/tcmb-feed-audit-v0.2`  
**Main baseline:** `210e945` (PR #60 merge)  
**Audit tarihi:** 2026-06-30  
**Play/KVKK/B5:** Dokunulmadı  
**Kod değişikliği:** Yok (evidence-only)

---

## Özet

TCMB resmi Atom feed kanalları, Kullanım Şartları, robots.txt ve mevcut Android `RssParser` uyumluluğu denetlendi. Tam metin/scrape yapılmadı; yalnızca URL erişimi, metadata alan yapısı ve parser davranışı kanıtlandı.

**Sonuç:** Audit **PASS vermedi** → **`NEEDS_REVIEW`**. Kod PR / Android seed binding **açılmamalı** (ToS ticari kullanım maddesi + Türkçe tarih parse boşluğu + feed kanalı ürün kararı + registry `feedUrl` eksik).

**v0.1 düzeltmesi:** `official-feeds-url-audit-v0.1` entry düzeyinde “boş title” notu **yanıltıcıydı**. Feed düzeyi `<title></title>` boş; **entry** düzeyinde `<title type="text"><![CDATA[...]]></title>` dolu (Basın Duyuruları, 20 entry örneklendi).

---

## Denetlenen kaynak

| Alan | Değer |
|------|--------|
| Kaynak | TCMB (Türkiye Cumhuriyet Merkez Bankası) |
| Registry `sourceId` | `tcmb` |
| Resmi domain | `tcmb.gov.tr` |
| Registry `feedUrl` | *(yok — seed adayı değil)* |
| Registry `legalMode` | `RSS_METADATA_ONLY` |
| Registry `reviewStatus` | `approved` *(registry; runtime audit PASS değil)* |

---

## Feed kanalları (RSS indeks)

İndeks: `https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Bottom+Menu/Diger/RSS` → 200 HTML (kategori listesi)

| Kanal | Feed URL | HTTP | Content-Type (header) | Gövde | Entry sayısı (örnek) |
|-------|----------|------|----------------------|-------|----------------------|
| Basın Duyuruları | `…/RSS/Basin+Duyurulari` | 200 | `text/html; charset=UTF-8` | Atom XML | 20 |
| PPK Kararları | `…/RSS/PPK+Kararlari` | 200 | `text/html; charset=UTF-8` | Atom XML | çoklu entry |
| Yayınlar | `…/RSS/Yayinlar` | 200 | `text/html` | Atom XML | *(sayım yapılmadı)* |
| Veriler | `…/RSS/Veriler` | 200 | `text/html` | Atom XML | *(sayım yapılmadı)* |
| Başkanın Konuşmaları | `…/RSS/Baskanin+Konusmalari` | 200 | `text/html` | Atom XML | *(sayım yapılmadı)* |

**Önerilen aday URL (ürün kararı gerekir):** Basın Duyuruları — haber/duyuru akışına en yakın kanal.

Tam URL (Basın Duyuruları):

```text
https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Bottom+Menu/Diger/RSS/Basin+Duyurulari
```

---

## Örnek metadata alanları (Basın Duyuruları)

Yalnızca alan yapısı; tam içerik kopyalanmadı.

```text
<feed xmlns="http://www.w3.org/2005/Atom">
  <title></title>                                    ← feed düzeyi boş
  <entry>
    <title type="text"><![CDATA[Para Politikası Kurulu Toplantı Özeti (2026-24)]]></title>
    <link rel="alternate" type="text/html" href="http://www.tcmb.gov.tr/wps/wcm/connect/tr/tcmb+tr/main+menu/duyurular/basin/2026/duy2026-24"/>
    <published>18 Haz 2026 14:00:00</published>     ← Türkçe ay adı
    <updated>18 Haz 2026 14:00:01</updated>
    <summary type="html"> </summary>                   ← pratikte boş
  </entry>
</feed>
```

| Alan | Durum | Seed için yeterli mi |
|------|--------|----------------------|
| `title` (entry) | CDATA dolu | Evet |
| `link` (alternate href) | Var | Evet |
| `published` / `updated` | Türkçe locale string | **Parser uyumsuz** (aşağıda) |
| `summary` | Boş/whitespace | Metadata-only OK (title+link yeterli) |
| `sourceName` | Uygulama türetir (`TCMB`) | Evet |

---

## URL erişim çıktıları (özet)

```text
GET …/RSS/Basin+Duyurulari
→ 200 OK
→ Content-Type: text/html; charset=UTF-8  (header yanlış; gövde Atom XML)

GET https://www.tcmb.gov.tr/rss
→ 404

GET https://www.tcmb.gov.tr/robots.txt
→ 200
  User-agent: *
  Disallow: */search+results

GET …/Bottom+Menu/Diger/Kullanim+Sartlari
→ 200 text/html
```

---

## ToS / robots notları

### robots.txt

- Genel erişim; yalnız `*/search+results` Disallow.
- Atom feed yolları için özel Disallow **yok**.

### Kullanım Şartları (`…/Kullanim+Sartlari`)

Sayfa erişilebilir (200). Özet maddeler *(tam metin kopyalanmadı)*:

| Madde | Audit notu |
|-------|------------|
| Site kullanımı koşulları kabul sayılır | Genel site koşulu |
| Bilgiler **kaynak gösterilmek suretiyle yayımlanabilir** | Metadata-only + attribution ile uyumlu olabilir |
| **Ticari amaçlarla kullanım TCMB yazılı iznine tabidir** | Play/bireysel APK ticari sınıfı → **hukuki teyit gerekir** |
| Doğruluk/güncellik taahhüdü yok | Ürün dili: sinyal/metadata; “kesin doğru” iddiası yasak |
| Telif hakları TCMB’ye ait | Tam metin/görsel çekme yasak çizgiyle uyumlu |
| RSS’e özel açık izin maddesi | **Yok** — RSS varlığı tek başına izin sayılmaz |

**ToS sonucu:** Metadata-only + link-out + kaynak attribution ** teorik olarak** desteklenebilir; **ticari kullanım** maddesi nedeniyle seed öncesi **NEEDS_REVIEW / hukuki teyit** zorunlu.

---

## Android `RssParser` uyumluluğu

Kaynak: `apps/android/app/src/main/java/com/haberradari/data/remote/RssParser.kt`  
Geçici unit probe (commit edilmedi): canlı Basın Duyuruları Atom XML örneği.

| Kontrol | Sonuç |
|---------|--------|
| Atom `<entry>` blokları | **20/20 parse** |
| `<title type="text"><![CDATA[...]]>` | **OK** — title çıkarılır |
| `<link rel="alternate" href="...">` | **OK** — canonical link çıkarılır |
| `<summary>` boş | `description` null/boş — **RSS_METADATA_ONLY için OK** |
| `parseDate("18 Haz 2026 14:00:00")` | **FAIL** — RFC2822/ISO8601 only; Türkçe ay parse edilmez |
| `toArticles` fallback | `publishedAt` → **`System.currentTimeMillis()`** (ingest zamanı) |

**Tarih etkisi:** Feed kartları yanlış kronolojik sırada görünebilir; duplicate/hash title+url ile çalışır ama **publishedAt güvenilmez**.

**Boş title davranışı:** `parseXml` satır 50 — `title ?: continue` → title yoksa entry **atlanır**. TCMB entry title dolu olduğu için pratikte sorun yok; feed düzeyi boş title entry sayılmaz.

**UI:** `ArticleCard` title'ı doğrudan gösterir; boş title ingest edilmez. `ClickbaitFilter` blank title'ı filtreler.

---

## Risk sınıflandırması

| Sınıf | TCMB durumu |
|-------|-------------|
| **`APPROVED_FEED_URL`** | **Hayır** — audit PASS yok |
| **`NEEDS_REVIEW`** | **Evet** — ToS ticari madde, tarih parse, kanal seçimi, registry feedUrl |
| **`NO_FEED_FOUND`** | Hayır — Atom feed mevcut |
| **`DISABLED`** | Hayır |
| **`LICENSE_REQUIRED`** | Hayır *(ajans değil; yazılı izin maddesi ToS review kapsamında)* |

---

## Seed güvenliği kararı

| Soru | Yanıt |
|------|--------|
| Atom feed kullanılabilir mi? | **Kısmen evet** — erişim + title/link var |
| ToS metadata-only engel mi? | **Belirsiz** — attribution OK; ticari kullanım yazılı izin |
| Title boş mu? | **Hayır** (entry CDATA dolu; v0.1 düzeltildi) |
| Parser Atom okuyor mu? | **Evet** (title/link); **tarih hayır** |
| Seed'e almak güvenli mi? | **Hayır** — `NEEDS_REVIEW` |

---

## Sonuç

### Sonraki Android seed PR'a alınabilir mi?

**Hayır.** PASS kriterleri karşılanmadı.

### PASS öncesi kapatılması gereken maddeler

1. **ToS/hukuki teyit** — bireysel APK / metadata-only aggregator ticari kullanım sınıfı
2. **Türkçe tarih parse** — `RssParser.parseDate` veya TCMB-specific normalizer (ayrı kod PR)
3. **Tek feed kanalı seçimi** — Basın Duyuruları vs PPK vs çoklu binding
4. **Registry `feedUrl` + `reviewStatus`** — SSOT güncellemesi evidence sonrası
5. **Content-Type header** — runtime risk düşük (XML parse çalışıyor) ama izleme notu

### Kod PR sırası (PASS sonrası)

1. `feat/rss-parser-tcmb-date-v0` — Türkçe ay tarih desteği
2. `feat/personal-apk-source-expansion-tcmb-v0` — yalnız Basın Duyuruları, default disabled veya controlled enable

### deprem.afad

Bu audit kapsamı **dışında**. JSON adapter ayrı mimari PR; RSS seed hattına karıştırılmamalı.

---

## Doğrulama

| Kontrol | Sonuç |
|---------|--------|
| Kod değişti mi | **Hayır** |
| Android seed binding | **Hayır** |
| Manifest/Gradle/XML | **Hayır** |
| Test çalıştırıldı mı | Geçici parser probe (commit edilmedi); `RssParserTest` Atom testi mevcut |
| Network doğrulama | **Evet** — curl özetleri yukarıda |
| Play/KVKK/B5 | Dokunulmadı |

**Not:** `Test çalıştırılmadı; docs/evidence-only audit PR` — kalıcı test dosyası eklenmedi. Parser bulguları geçici unit probe ile doğrulandı.
