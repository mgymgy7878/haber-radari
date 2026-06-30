# Global Resmi/Kurumsal Kaynak ToS/Legal Review v0

**Branch:** `docs/global-official-tos-review-v0`  
**Main baseline:** `a327342` (PR #67 — global official feeds audit v0)  
**Strateji referansı:** [global-source-expansion-strategy-v0.md](../../docs/research/global-source-expansion-strategy-v0.md) (PR #66)  
**Feed audit referansı:** [global-official-feeds-audit-v0.md](./global-official-feeds-audit-v0.md) (PR #67)  
**Review tarihi:** 2026-06-30  
**Tür:** Evidence-only — kod / seed / registry değişikliği yok  
**Play/KVKK/B5:** Dokunulmadı

> **Hukuki kesin hüküm verilmez.** Bu belge risk sınıflandırmasıdır. Operatör/hukuk teyidi olmadan seed açılmaz.

---

## Özet

PR #67’de teknik aday görünen **6 öncelikli** resmi/kurumsal kaynağın ToS, copyright, attribution, ticari kullanım ve yeniden kullanım riskleri incelendi. Kaynak web sayfaları ve yayımlanmış kullanım koşulları `curl` / web fetch ile okundu; **tam metin, scrape, görsel veya caption indirilmedi.**

**Sonuç:** `TOS_PASS_METADATA_ONLY` alan kaynak sayısı: **3** (Fed, EU Commission, USGS). Bunlar dahi seed PR öncesi operatör onayı ve dar ingest modu (title+link/metadata sinyali) ile sınırlıdır. **WHO** ve **ECB** için ticari/paketleme veya NC/çerçeveleme riskleri nedeniyle dar gate. **CISA** federal .gov hattında dar mod önerilir.

**Gate kuralı:** `TOS_PASS_METADATA_ONLY` olmayan kaynak sonraki seed PR’a **alınmaz**.

---

## Kapsam dışı

```text
Reuters, AP, AFP, NYT, Guardian, BBC, DW, CNN, Bloomberg, FT
```

Ajans ve ticari medya bu PR’da yok.

---

## Güvenli içerik modeli (PR #66 — tekrar)

| İzin verilen | Yasak |
|--------------|-------|
| Başlık, kaynak adı, tarih, kategori/ülke sinyali, orijinal link | article summary, parafraz, scrape |
| Metadata-only olay etiketi (çoklu kaynak) | fullText, body, rawHtml, görsel, caption |
| Kaynak atfı / link-out | AI makale özeti |

Feed’te `description` / HTML content olsa bile **ingest edilmez** (PR #67).

---

## Kaynak bazlı ToS/legal-risk tablosu

| Öncelik | Kaynak | Domain | ToS / copyright URL | RSS/feed özel madde | Kaynak gösterme | Ticari kullanım | Yeniden dağıtım / republication | Rate-limit / API | robots.txt (PR #67) | Full text / görsel risk | title+link metadata risk | Önerilen legalMode | Final ToS gate |
|--------:|--------|--------|---------------------|---------------------|-----------------|-----------------|-----------------------------------|------------------|---------------------|-------------------------|--------------------------|-------------------|----------------|
| 1 | **ECB** | ecb.europa.eu | [Disclaimer & copyright](https://www.ecb.europa.eu/services/using-our-site/disclaimer/html/index.en.html) | RSS için ayrı madde yok; genel site copyright koşulları geçerli | **Zorunlu:** “ECB must be cited as the source”; doğru ve eksiksiz gösterim | Ücretsiz kullanım; **satılan belgelerde** alıcıya ücretsiz kaynak bilgisi verilmeli | Serbest kullanım + atıf; **çerçeveleme (iframe) yasak**; yazarlı working paper’lar için yazılı izin | PR #67: RSS 200; özel limit belirtilmedi | 200; çok `Disallow` | Görsel/logo ayrı kurallar | Düşük (title+link+date); ürün gelecekte ücretli olursa madde 2 riski | `TITLE_LINK_ONLY` | **TITLE_LINK_ONLY_ONLY** |
| 2 | **Federal Reserve** | federalreserve.gov | [Disclaimer](https://www.federalreserve.gov/disclaimer.htm) | RSS için ayrı madde yok | **Zorunlu:** “cite to the Board as the source” | Kamu malı; ticari ürün onayı metninde ayrıca yok | **Public domain** — kopya/dağıtım izinli; hyperlink OK, **framing yasak** | PR #67: `press_all.xml` 200 | robots 404 | Non-Board görseller ayrı izin | Düşük | `TITLE_LINK_ONLY` | **TOS_PASS_METADATA_ONLY** |
| 3 | **EU Commission** | ec.europa.eu | [Legal notice](https://commission.europa.eu/legal-notice_en) | Press RSS API ayrı ToS yok; genel EU copyright/reuse | **CC BY 4.0:** atıf + değişiklik belirtilmeli | CC BY 4.0 non-commercial şartı yok; genel reuse | EU içeriği **CC BY 4.0** — reuse izinli; üçüncü taraf içerik ayrı | PR #67: presscorner RSS 200 | 200 (boş header) | Üçüncü taraf görseller ayrı | Düşük (description ingest edilmez) | `TITLE_LINK_ONLY` | **TOS_PASS_METADATA_ONLY** |
| 4 | **WHO** | who.int | [Terms of use](https://www.who.int/about/policies/terms-of-use); [Copyright](https://www.who.int/about/policies/publishing/copyright) | RSS için ayrı madde yok | **Zorunlu:** WHO kaynak + URL atfı | Website ToU: **“not for sale or for use in conjunction with commercial purposes”**; CC BY-NC-SA yayınlar için NC | Özet/çeviri araştırma-özel çalışma için; **ticari veya kapsamlı çoğaltma için yazılı izin** | PR #67: RSS 200 | 200 | `a10:content` HTML — ingest yasak | Orta-yüksek (ticari sınır + NC lisans) | `TITLE_LINK_ONLY` | **NEEDS_REVIEW** |
| 5 | **USGS** | usgs.gov / earthquake.usgs.gov | [Copyrights and credits](https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits) | [GeoJSON feed docs](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php): programmatic interface; [Feed Lifecycle Policy](https://earthquake.usgs.gov/earthquakes/feed/v1.0/policy.php) *(PR #67 erişim)* | **İstenen:** USGS citation / credit | **US Public Domain** (USGS-authored data) | Yeniden kullanım serbest; üçüncü taraf görseller hariç | Feeds “updated every minute”; lifecycle policy geçerli | usgs.gov robots 200 | Atom `summary` yapılandırılmış metadata — tam metin değil | Düşük (title, link, time, place, mag) | `RSS_METADATA_ONLY` *(dar)* | **TOS_PASS_METADATA_ONLY** |
| 6 | **CISA** | cisa.gov | [Terms of use](https://www.cisa.gov/terms-use) | RSS için ayrı madde yok | Terms’te açık copyright maddesi yok; **US federal .gov** — Fed/USGS ile aynı hat varsayımı **teyit gerekir** | Terms ticari republication’ı açıkça tanımlamaz; DHS/CISA federal sistem | Kullanıcı gönderileri serbestçe kullanılabilir (bizim kapsam dışı); **RSS republication metni belirsiz** | PR #67: news.xml + advisories 200 | robots 200 | Advisory `description` HTML — ingest yasak | Orta (açık PD ifadesi yok) | `TITLE_LINK_ONLY` | **TITLE_LINK_ONLY_ONLY** |

---

## Kaynak gösterme / ticari kullanım / yeniden dağıtım notları

### ECB

- Site bilgisi ücretsiz kullanılabilir; **ECB kaynak gösterilmeli**, değişiklik açıkça belirtilmeli.
- Bilginin **satılan belgelere** gömülmesi halinde alıcılara ücretsiz kaynak bilgisi verilmeli — gelecekte ücretli/abonelikli ürün riski.
- Promosyonel/business linklerde **tam pencere**; iframe/framing yasak.
- **Risk:** Bireysel ücretsiz APK için title+link+atıf makul görünür; Play monetization / premium paket öncesi operatör teyidi önerilir.

### Federal Reserve

- Kamu malı: “may be copied and distributed without permission” + Board atfı.
- Hyperlink izinli; framing yasak.
- **Risk:** Düşük — metadata-only title+link+date için en güçlü ABD resmi kaynak profillerinden biri.

### EU Commission

- EU içeriği varsayılan **CC BY 4.0** — reuse + atıf + değişiklik bildirimi.
- Press RSS `description` paragraf içerir — **ingest edilmez**; title+link+date yeterli.
- **Risk:** Düşük-orta — üçüncü taraf içerik/görsel karışımı olasılığı; dar mod korunmalı.

### WHO

- Website ToU: ticari amaçla kullanım ve satışla bağlantılı kullanım **yasak** ifadesi.
- Yayınlar için **CC BY-NC-SA 3.0 IGO** — non-commercial.
- RSS’te `description` ve `a10:content` HTML — **kesinlikle ingest edilmez**.
- **Risk:** Orta-yüksek — kişisel ücretsiz APK bile “commercial purposes” yorumuna tabi; yazılı izin veya hukuk teyidi önerilir.

### USGS

- USGS-authored data **US Public Domain**; credit önerilir.
- Earthquake feeds programmatic kullanım için tasarlanmış; lifecycle policy bağlı.
- **Risk:** Düşük — afet sinyali metadata (zaman, yer, büyüklük) ürün omurgasına uygun; görsel/trademark ayrı.

### CISA

- Terms: güvenlik, kullanıcı gönderisi, yargı; **açık public-domain/republication maddesi yok**.
- Federal .gov standardı Fed ile uyumlu olabilir — **bu audit’te kesin teyit yok**.
- Advisory feed HTML description — title+link only.
- **Risk:** Orta — dar mod; explicit PD teyidi sonrası TOS_PASS yükseltilebilir.

---

## robots.txt notları (PR #67 özet)

| Kaynak | Not |
|--------|-----|
| ECB | 200; çok sayıda dil yolu `Disallow` — RSS yolu özel engel görülmedi |
| Fed | `/robots.txt` → 404 HTML |
| EU Commission | `ec.europa.eu/robots.txt` → 200 |
| WHO | 200 |
| USGS | usgs.gov robots 200 |
| CISA | 200 |

Robots tek başına RSS ingest izni sayılmaz.

---

## Final ToS gate sınıflandırması

| Gate | Kaynaklar |
|------|-----------|
| **TOS_PASS_METADATA_ONLY** | **Fed**, **EU Commission**, **USGS** |
| **TITLE_LINK_ONLY_ONLY** | **ECB**, **CISA** |
| **NEEDS_REVIEW** | **WHO** |
| **LICENSE_REQUIRED** | — |
| **DISABLED** | — |

---

## Sonraki seed PR adayları (`TOS_PASS` + PR #67 teknik uyum)

İlk `feat/global-official-feed-seed-v0` için önerilen **maksimum 1–3 kaynak** (operatör onayı + dar ingest):

| Sıra | `sourceId` | Kaynak | Feed (PR #67) | Önerilen mod |
|-----:|------------|--------|---------------|--------------|
| 1 | `fed_press` | Federal Reserve | `…/feeds/press_all.xml` | `TITLE_LINK_ONLY` |
| 2 | `eu_commission_press` | EU Commission | `…/presscorner/api/rss` | `TITLE_LINK_ONLY` |
| 3 | `usgs_earthquakes` | USGS | `…/summary/all_day.atom` | `RSS_METADATA_ONLY` *(yapılandırılmış afet metadata)* |

**Not:** `TOS_PASS` = metadata-only title/link/date (+ USGS structured fields) ingest için risk sınıfı yeterli görüldü; **hukuki kesin onay değildir**.

---

## Teyit / yazılı izin gerektiren kaynaklar

| Kaynak | Gerekçe |
|--------|---------|
| **WHO** | Ticari amaç yasağı + NC lisans; RSS content alanları |
| **ECB** | Gelecekte ücretli ürün / “sold documents” maddesi; framing kısıtı |
| **CISA** | Terms’te açık republication/Public Domain ifadesi yok |

---

## Seed’e alınmayacak (bu review sonrası)

| Kaynak | Gate | Neden |
|--------|------|-------|
| **WHO** | NEEDS_REVIEW | Ticari/NC risk — PASS yok |
| **ECB** | TITLE_LINK_ONLY_ONLY | TOS_PASS yok; dar mod teyidi sonrası yeniden değerlendir |
| **CISA** | TITLE_LINK_ONLY_ONLY | TOS_PASS yok; federal PD teyidi sonrası yeniden değerlendir |

---

## İncelenen URL’ler (kısa log)

```text
GET https://www.ecb.europa.eu/services/using-our-site/disclaimer/html/index.en.html → 200
GET https://www.federalreserve.gov/disclaimer.htm → 200
GET https://commission.europa.eu/legal-notice_en → 200
GET https://www.who.int/about/policies/terms-of-use → 200
GET https://www.who.int/about/policies/publishing/copyright → 200
GET https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits → 200
GET https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php → 200
GET https://www.cisa.gov/terms-use → 200
```

---

## Doğrulama

| Kontrol | Sonuç |
|---------|-------|
| Kod değişti mi | **Hayır** |
| Android seed/binding | **Değişmedi** (3 TR seed) |
| Registry/feedUrl | **Değişmedi** |
| Manifest/Gradle/XML | **Değişmedi** |
| Test | **Çalıştırılmadı** — docs/evidence-only ToS review PR |
| Play/B5 | **Dokunulmadı** |
| Belirsiz maddeler PASS yapıldı mı | **Hayır** — WHO NEEDS_REVIEW; ECB/CISA TITLE_LINK_ONLY_ONLY |

---

## Sonraki adımlar

1. Operatör/hukuk teyidi: Fed + EU Commission + USGS üçlüsü için bireysel APK metadata-only ingest
2. `feat/global-official-feed-seed-v0` — **max 1–3 kaynak**, yalnızca `TOS_PASS` listesi
3. WHO için ayrı permissions / commercial-use review
4. ECB “sold documents” maddesi — Play/monetization dondurulmuş olsa da belgeye not
5. CISA explicit federal PD/policy teyidi (opsiyonel uplift)

---

## Revizyon

| Sürüm | Tarih | Not |
|-------|-------|-----|
| v0 | 2026-06-30 | İlk global resmi ToS review; 6 kaynak |
