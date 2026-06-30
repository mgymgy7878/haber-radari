# TCMB ToS / Legal Review v0

**Branch:** `docs/tcmb-tos-legal-review-v0`  
**Main baseline:** `ca935cb` (PR #62 merge — Türkçe tarih parse)  
**Review tarihi:** 2026-06-30  
**Play/KVKK/B5:** Dokunulmadı  
**Kod değişikliği:** Yok (evidence-only)

> **Uyarı:** Bu belge hukuki kesin hüküm değildir; proje risk sınıflandırmasıdır (`DISABLED`, `NEEDS_REVIEW`, `LICENSED`/`LICENSE_REQUIRED`, `APPROVED`).

---

## Özet

TCMB **Kullanım Şartları** sayfası incelendi. Metadata-only + kaynak gösterimi + link-out modeli **kaynak göstererek yayımlama** maddesiyle kısmen uyumlu görünür; ancak **ticari amaçlarla kullanımın yazılı izne tabi** olması seed gate için belirsizlik üretir.

**Sonuç sınıflandırması:**

| Kullanım bağlamı | Sınıf |
|------------------|--------|
| **Genel (seed gate)** | **`NEEDS_REVIEW`** |
| Bireysel APK (sideload / kişisel) | **`NEEDS_REVIEW`** |
| Play / public store yayını | **`LICENSE_REQUIRED`** |
| Tam metin/scrape/republish | **`DISABLED`** |

**Net hüküm:** ToS review **PASS vermedi**. `docs/tcmb-feed-audit-v0.3` teknik PASS verse bile seed gate **açılmamalı** — yazılı izin veya açık hukuki teyit gerekir.

---

## İncelenen kaynaklar

| Kaynak | URL | HTTP | Not |
|--------|-----|------|-----|
| Kullanım Şartları | `https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Bottom+Menu/Diger/Kullanim+Sartlari` | 200 | Ana ToS metni |
| RSS indeks | `…/Bottom+Menu/Diger/RSS` | 200 | Feed listesi; **ayrı lisans metni yok** |
| Telif Hakları (footer aday) | `…/Telif+Haklari` | 404 | Ayrı sayfa bulunamadı |
| Yasal Uyarı (footer aday) | `…/Yasal+Uyari` | 404 | Ayrı sayfa bulunamadı |
| robots.txt | `https://www.tcmb.gov.tr/robots.txt` | 200 | `Disallow: */search+results` only |

Tam HTML/scrape arşivlenmedi; yalnızca madde özeti alındı.

---

## ToS maddeleri (özet)

Kaynak: Kullanım Şartları sayfası (`Kullanim+Sartlari`, 2026-06-30 erişim).

| # | Madde özeti | Haber Radarı etkisi |
|---|-------------|---------------------|
| 1 | Siteyi kullananlar koşulları kabul sayılır | Uygulama feed tüketimi site kullanımı kapsamında değerlendirilebilir |
| 2 | Site herhangi bir taahhüt içermez | Doğruluk/güncellik iddiası yapılmamalı (ürün dili uyumlu) |
| 3 | **Bilgiler kaynak gösterilmek suretiyle yayımlanabilir** | Metadata-only + attribution + link-out ile **uyumlu olabilir** |
| 4 | **Ticari amaçlarla kullanım TCMB yazılı iznine tabidir** | Store/ ticari sınıf → **LICENSE_REQUIRED** riski |
| 5 | Güncellik/doğruluk/tamlık taahhüdü yok; sorumluluk reddi | “Kesin doğru” iddiası yasak; sinyal/metadata dili uygun |
| 6 | İçerik önceden bildirimsiz değiştirilebilir | Feed URL/availability drift riski (operasyonel) |
| 7 | **Telif ve diğer haklar TCMB’ye ait** | Tam metin/görsel çekme **DISABLED**; metadata+link sınırı korunmalı |
| 8 | Bağlantılı üçüncü taraf siteler TCMB’yi bağlamaz | Link-out davranışı uygun |
| 9 | Site görüşleri yazarlarına ait | Doğrulama iddiası yapılmamalı |
| 10 | Sistem izlenir; yetkili makamlara bilgi aktarımı mümkün | Standart kurumsal site maddesi |
| 11 | Dış müdahale yasak | Scraping/automation abuse yasağı; RSS metadata-only sınırı |

**RSS’e özel izin maddesi:** Bulunamadı. RSS varlığı tek başına izin sayılmaz.

---

## “Kaynak göstererek yayımlama” vs “ticari kullanım yazılı izin”

| Boyut | Kaynak göstererek yayımlanabilir | Ticari kullanım yazılı izin |
|-------|----------------------------------|-----------------------------|
| **Ne izin veriyor?** | Atıflı yeniden yayımlama (metin kapsamı belirsiz) | Ticari kullanım için **yazılı onay** |
| **Haber Radarı metadata-only** | Title + sourceName + originalUrl + tarih; tam metin yok | Uygulamanın “ticari” sayılıp sayılmadığı **teyit gerekir** |
| **Attribution** | Zorunlu görünüm | Yazılı izin sürecinde de gerekli olur |
| **Risk** | Düşük-Orta (non-commercial varsayım) | Yüksek (store / gelir / ticari sınıf) |

**Ayrıştırma:** İki madde **çelişkili değil**, **katmanlı**:

1. Non-commercial + kaynak gösterimi → olası izin yolu  
2. Commercial → ayrı yazılı izin kapısı  

Proje SSOT: reklamsız metadata radar; Play hattı dondurulmuş. Bireysel APK bile “ticari” sınıfına girip girmeyeceği **net değil** → `NEEDS_REVIEW`.

---

## Kullanım bağlamı risk notları

### Bireysel APK (mevcut hatt)

| Faktör | Not |
|--------|-----|
| Dağıtım | Sideload / kişisel kullanım; Play dışı |
| Gelir | Reklamsız (SSOT) |
| İçerik | RSS metadata-only; link-out |
| Attribution | Kaynak adı + orijinal link zorunlu |
| **Risk sınıfı** | **`NEEDS_REVIEW`** — ticari sınıf belirsiz; yazılı izin alınmadı |

**Önerilen kontroller (seed öncesi):**

- UI’da TCMB attribution görünür mü?
- Tam metin/görsel/cache body yok mu?
- Kullanıcıyı orijinal duyuruya link-out yönlendirmesi var mı?

### Play / public store (dondurulmuş hat)

| Faktör | Not |
|--------|-----|
| Dağıtım | Ticari store yayını |
| ToS maddesi | “Ticari amaçlarla kullanım yazılı izin” |
| **Risk sınıfı** | **`LICENSE_REQUIRED`** — TCMB yazılı izni olmadan seed **önerilmez** |

Play/KVKK/B5 bu PR’da **dokunulmadı**; risk notu gelecek karar içindir.

---

## Yasak / korunan sınırlar (legal-safe)

| Alan | Durum |
|------|--------|
| Tam metin / body / scrapedText | **Yasak** — ToS telif maddesi |
| Görsel / video / audio / caption | **Yasak** |
| RSS varlığı = izin | **Hayır** |
| Metadata-only + link-out | Hedef model; ToS katman 1 ile uyumlu **olabilir** |
| Haber doğrulama iddiası | **Yasak** (ürün dili) |

---

## Risk sınıflandırması (TCMB seed gate)

| Sınıf | Uygulanır mı? | Gerekçe |
|-------|---------------|---------|
| **`APPROVED`** | Hayır | Ticari kullanım yazılı izin maddesi açık |
| **`NEEDS_REVIEW`** | **Evet (genel)** | Attribution yolu var; ticari sınıf + yazılı izin belirsiz |
| **`LICENSE_REQUIRED`** | Play/public bağlam | Ticari kullanım açıkça yazılı izin istiyor |
| **`DISABLED`** | Tam metin/scrape | Telif + metadata-only ihlali |

---

## Sonuç ve gate kararı

### Seed’e alınabilir mi?

**Hayır.** ToS/legal review **PASS vermedi**.

### Teknik audit v0.3 ile ilişki

| Gate | Durum |
|------|--------|
| Parser (Türkçe tarih) | ✅ PR #62 — kapandı |
| ToS/legal v0 | ❌ **NEEDS_REVIEW** — bu belge |
| Feed audit v0.3 | Sonraki — teknik yeniden doğrulama |
| Seed PR | **Her iki PASS olmadan açılmaz** |

### PASS öncesi kapanması gerekenler

1. **Ticari sınıf teyidi** — bireysel APK ToS kapsamında nasıl değerlendirilir?
2. **Yazılı izin** — Play veya ticari sınıf için TCMB resmi onay
3. **Attribution UX** — seed PR’da görünür kaynak/atıf kanıtı
4. **`docs/tcmb-feed-audit-v0.3`** — teknik PASS (feedUrl, parser, alanlar)

---

## Doğrulama

| Kontrol | Sonuç |
|---------|--------|
| Kod değişti mi | **Hayır** |
| TCMB seed eklendi mi | **Hayır** |
| Registry/feedUrl değişti mi | **Hayır** |
| Android binding değişti mi | **Hayır** |
| Parser değişikliği | **Hayır** |
| Manifest/Gradle/XML | **Hayır** |
| Test çalıştırıldı mı | **Hayır** — docs/evidence-only legal review PR |
| Play/KVKK/B5 | Dokunulmadı |

---

## Sonraki adım

1. **`docs/tcmb-feed-audit-v0.3`** — parser fix sonrası teknik yeniden audit
2. İnsan/hukuk teyidi veya TCMB yazılı izin (Play/ticari yol için)
3. Her iki gate PASS → `feat/tcmb-official-feed-seed-v0` (Basın Duyuruları only, controlled enable)
