# Haber Radarı — Global Kaynak Genişleme Stratejisi v0

**Belge türü:** Ürün + kaynak stratejisi (evidence-first plan)  
**Proje:** Haber Radarı  
**Sürüm:** v0  
**Tarih:** 2026-06-30  
**Durum:** **TASLAK — ONAY BEKLİYOR** (kod/seed değişikliği yok)

> **Aktif legal SSOT:** [haber-radari-source-plan-update-v1.md](./haber-radari-source-plan-update-v1.md)  
> Bu belge çelişki durumunda SSOT v1’e tabidir. Hukuki kesin hüküm verilmez; risk sınıflandırması yapılır.

---

## 1. Ürün yönü (güncel)

Haber Radarı **yalnızca Türkiye kaynaklı değildir**. Hedef:

> Küresel önemli gelişmeleri seçen, ülkeler ve kategoriler bazlı, **şimdilik Türkçe arayüzlü** ama ileride çok dilli çalışabilecek **kişisel haber radarı**.

| Boyut | v0 kararı |
|-------|-----------|
| Coğrafya | Türkiye + seçili küresel resmi/public kaynaklar |
| Kategori | Dünya gündemi, ekonomi, sağlık, teknoloji, afet/doğa |
| Arayüz dili | **Türkçe** (i18n altyapısı sonraki faz) |
| Kaynak dili | İngilizce, Almanca, Japonca vb. olabilir |
| Kart içeriği | Kaynak adı, başlık (orijinal dil), tarih, link-out, kaynak profili |
| Çeviri / LLM özet | **v0 dışı** — maliyet, legal risk, Play/KVKK bağımlılığı |

Uygulama **haber doğrulama** veya **kesin doğru** iddiası taşımaz. İzin verilen dil: **kaynak sinyali**, **kaynak profili**, **metadata özeti**, **orijinal kaynağa yönlendirme**.

---

## 2. Mutlak sınırlar (SSOT v1 ile uyumlu)

| Kural | Durum |
|-------|-------|
| Tam metin, `rawHtml`, `articleText`, `scrapedText` | **Yasak** |
| Görsel, video, audio, caption çekme/yeniden sunma | **Yasak** |
| Web scraping | **Varsayılan kapalı** |
| RSS varlığı | **Tek başına izin sayılmaz** — ToS / robots / lisans gerekir |
| Mobil LLM / API key | **Yasak** — backend proxy zorunlu |
| Ajans içeriği lisanssız | **DISABLED** — ingest açılmaz |

---

## 3. Kaynak grupları ve ilk karar

### 3.1 Global ajanslar

**Örnekler:** Reuters, AP, AFP, AA, DHA, İHA, ANKA (TR ajansları aynı gate’e tabi).

| Durum | Gate sonucu |
|-------|-------------|
| Yazılı lisans / kurumsal sözleşme **yok** | **DISABLED** — seed’e **eklenmez** |
| Yazılı lisans **var** | **LICENSE_REQUIRED** → yalnızca **LICENSED** modu; sözleşme kapsamı dışına çıkılmaz |

**Net hüküm:** Reuters / AP / AFP **doğrudan seed’e eklenmez**. RSS veya public API görünse bile lisans audit PASS olmadan registry ingest açılmaz.

### 3.2 Büyük ticari medya

**Örnekler:** New York Times, Guardian, BBC (global), DW, NHK, CNN, Financial Times, Habertürk, NTV vb.

| Varsayılan | Açıklama |
|------------|----------|
| **NEEDS_REVIEW** | Feed + ToS/robots audit tamamlanana kadar ingest kapalı |
| **TITLE_LINK_ONLY** | Audit sonrası en güvenli varsayılan — başlık + link-out |
| **RSS_METADATA_ONLY** | Yalnızca ToS/lisans incelemesi **açıkça olumlu** ise |

**Özel not — New York Times:** Haber içeriği, özet veya tam metin **doğrudan alınmaz**. Önce ToS / RSS / feed audit zorunlu. Büyük olasılıkla **TITLE_LINK_ONLY** veya **NEEDS_REVIEW**; otomatik metadata ingest varsayılan **kapalı**.

**Özel not — BBC / DW / NHK / Guardian:** Global yayıncı feed’i bulunsa bile kullanım koşulu audit **PASS olmadan** seed açılmaz. Mevcut `bbc-turkce` Android seed’i **NEEDS_REVIEW** örneğidir.

### 3.3 Resmi / kurumsal kaynaklar (birinci global omurga)

**Örnekler:** WHO, CDC, ECB, IMF, World Bank, OECD, USGS, NASA, EU kurumları, Fed, EMA, FDA, NHS.

| Kural | Değer |
|-------|-------|
| Rol | Küresel genişlemenin **en güvenli ilk havuzu** |
| İçerik modeli | **Metadata-only** + link-out + source attribution |
| Gate | Feed/API audit PASS → **APPROVED_METADATA_SOURCE** adayı |

Resmi kurum olmak otomatik lisans sayılmaz; yine de ToS, robots ve alan uygunluğu denetlenir.

### 3.4 Teknoloji

**Örnekler:** Resmi şirket blogları (Google, Microsoft, OpenAI, GitHub), güvenlik advisories (CISA, vendor bulletins).

| Varsayılan | Audit sonrası metadata-only; tam metin yok |
|------------|-----------------------------------------------|

### 3.5 Sağlık

**Örnekler:** WHO, CDC, EMA, FDA, NHS.

Resmi sağlık kurumları **öncelikli**; ticari sağlık medyası ticari medya gate’ine tabidir.

### 3.6 Ülke gündemi (resmi/public)

**Örnekler:** ABD (whitehouse.gov, state.gov), Almanya (bundesregierung.de), İngiltere (gov.uk), AB (ec.europa.eu), Japonya resmi portal, Çin resmi/public duyuru kanalları.

İlk adım: **resmi/public feed audit**; ulusal ticari medya ikinci dalga.

---

## 4. Kaynak ekleme gate’i

Her aday kaynak için audit sonunda **tek** birincil gate sonucu atanır:

| Gate sonucu | Anlam | Seed / ingest |
|-------------|-------|---------------|
| **APPROVED_METADATA_SOURCE** | Resmi/public; feed doğrulandı; metadata-only uygun | Audit PR + operatör onayı sonrası seed adayı |
| **TITLE_LINK_ONLY** | Ticari veya belirsiz ToS; yalnızca başlık + link | Review approved sonrası dar mod seed |
| **NEEDS_REVIEW** | Feed bulundu veya aday var; ToS/lisans/alan uygunluğu eksik | **Seed açılmaz** |
| **LICENSE_REQUIRED** | Ajans veya lisanslı içerik; sözleşme gerekli | Sözleşme yoksa **DISABLED** |
| **DISABLED** | Lisans yok, yasak veya yüksek risk | Registry’de kapalı |
| **NO_FEED_FOUND** | Doğrulanmış RSS/Atom/API yok | Seed adayı değil |

**Gate kuralı:** Audit **PASS olmayan** kaynak Android/API seed’e **alınmaz**. Teknik feed erişimi (HTTP 200) tek başına **APPROVED** sayılmaz (TCMB v0.3 dersi).

---

## 5. v0 hedef paket (ilk global genişleme)

Aşağıdaki paket **audit sırası**dır; otomatik seed listesi değildir.

### 5.1 Dünya gündemi — ülke önceliği

| Öncelik | Bölge / ülke | Kaynak tipi |
|--------:|--------------|-------------|
| 1 | ABD | Resmi duyuru / devlet portal RSS |
| 2 | Almanya | Bundesregierung, Bundestag public feeds |
| 3 | İngiltere | gov.uk, resmi kurum |
| 4 | Avrupa Birliği | EC, EEAS, Europarl public |
| 5 | Çin | Resmi/public duyuru (dil + erişim riski ayrı değerlendirme) |
| 6 | Japonya | Resmi portal / kabine public |

### 5.2 Kategori önceliği

| Kategori | Öncelikli kurumlar (audit adayı) |
|----------|----------------------------------|
| **Ekonomi** | Fed, ECB, IMF, World Bank, OECD |
| **Sağlık** | WHO, CDC, EMA, FDA |
| **Teknoloji** | Resmi vendor blogları, CISA advisories |
| **Afet / doğa** | USGS, EMSC, resmi afet API/RSS (JSON adapter ayrı gate) |

### 5.3 Bilinçli v0 dışı (ikinci dalga)

| Grup | Neden ertelendi |
|------|-----------------|
| Reuters, AP, AFP | Lisans gate — **DISABLED** |
| NYT, FT, CNN, Guardian (global ticari) | ToS audit — çoğu **NEEDS_REVIEW** |
| Çeviri / çok dilli UI | i18n + LLM maliyet/legal — sonraki faz |
| Play / KVKK / B5 | Dondurulmuş — bireysel APK hattı öncelikli |

---

## 6. Dil ve sunum politikası (v0)

| Alan | Politika |
|------|----------|
| Uygulama UI | Türkçe |
| Kaynak başlığı | Orijinal dilde gösterilir |
| Kaynak adı / profili | Türkçe etiket + orijinal kurum adı |
| Tarih | Yerel format (tr-TR) |
| Özet / aiSummary | Kaynak `legalMode`’a göre; LLM digest **kapalı** |
| Link-out | Zorunlu — orijinal kaynağa yönlendirme |

**Çeviri:** Kullanıcıya otomatik çeviri **v0 kapsamı dışı**. İleride ayrı legal + maliyet + Play incelemesi gerekir.

---

## 7. Mevcut durum (baseline)

| Alan | Durum (main @ PR #65 sonrası) |
|------|-------------------------------|
| Android seed | 3 kaynak: NTV, BBC Türkçe (`NEEDS_REVIEW`), Habertürk |
| TR resmi audit | TCMB teknik PASS; seed gate **NEEDS_REVIEW** (ToS) |
| AFAD | Runtime seed’den çıkarıldı; registry kaydı korunuyor |
| Kaynak sağlığı UI | PR #65 — Kaynak Yönetimi detayları |
| Play/KVKK/B5 | Dondurulmuş |

Global genişleme **mevcut 3 seed’i değiştirmez**; yeni kaynaklar yalnızca audit PASS + ayrı seed PR ile eklenir.

---

## 8. Önerilen PR / audit sırası

| Sıra | Branch / iş | Tür | Çıktı |
|-----:|-------------|-----|-------|
| 1 | `docs/global-source-expansion-strategy-v0` | Strateji belgesi | **Bu belge** |
| 2 | `docs/global-official-feeds-audit-v0` | Evidence-only audit | Fed, ECB, IMF, WHO, CDC, USGS, EU… gate tablosu |
| 3 | `feat/global-official-seed-v0` *(veya benzeri)* | Kod PR | Yalnızca **APPROVED_METADATA_SOURCE** PASS kaynaklar |
| 4 | `docs/global-tech-health-feeds-audit-v0` | Evidence-only | Teknoloji + sağlık resmi kaynaklar |
| 5 | `docs/global-commercial-media-audit-v0` | Evidence-only | NYT, BBC global, DW, Guardian, NHK… |
| 6 | `test/personal-apk-post-health-device-smoke-v0` | Evidence-only | PR #65 sonrası cihaz smoke |
| 7 | Play/KVKK/B5 | Compliance | **En son** — bireysel APK hattı tamamlanınca |

---

## 9. Audit şablonu (sonraki PR’lar için)

Her kaynak satırında minimum alanlar:

| Alan | Açıklama |
|------|----------|
| `sourceId` | Registry adayı (seed PR’da kullanılır) |
| `domain` | Resmi domain |
| `feedUrl` / API | Doğrulanmış uç nokta |
| `httpStatus` | Erişim kanıtı |
| `contentType` | RSS / Atom / JSON |
| `sampleFields` | title, link, published — **tam metin yok** |
| `tosNote` | Kullanım koşulu özeti / incelenmedi |
| `robotsNote` | robots.txt özeti |
| `gateResult` | Bölüm 4 enum |
| `recommendedLegalMode` | SSOT v1 legalMode |
| `seedRecommendation` | Alınır / alınmaz / ertelenir |

---

## 10. Riskler ve kontroller

| Risk | Seviye | Kontrol |
|------|--------|---------|
| Ajans/ticari medyanın lisanssız eklenmesi | Yüksek | Ajans → DISABLED; ticari → audit gate |
| NYT/Reuters içerik çekme | Yüksek | TITLE_LINK_ONLY / DISABLED varsayılan |
| RSS varlığı = izin sanılması | Orta | Evidence-first; teknik PASS ≠ legal PASS |
| Çeviri/LLM maliyet patlaması | Orta | v0 dışı; backend proxy + kill switch |
| Ürün dili kayması (“doğrulandı”) | Orta | SSOT v1 Bölüm 8; UI disclaimer |
| Registry çift borç | Orta | Her seed PR API + Android senkron planı |

---

## 11. Kabul kriterleri (bu belge için)

- [x] Global ürün yönü tanımlandı
- [x] Ajans / ticari / resmi kaynak grupları ayrıldı
- [x] Gate enum’ları netleştirildi
- [x] v0 hedef paket (ülke + kategori) listelendi
- [x] Kod / seed / registry değişikliği **yok**
- [x] SSOT v1 ile uyum teyit edildi
- [x] Sonraki audit PR sırası yazıldı

---

## 12. İlişkili belgeler

| Belge | Rol |
|-------|-----|
| [haber-radari-source-plan-update-v1.md](./haber-radari-source-plan-update-v1.md) | Aktif legal / kaynak SSOT |
| [source-registry-ssot-v0-plan.md](../architecture/source-registry-ssot-v0-plan.md) | Registry tek SSOT planı |
| [official-feeds-url-audit-v0.1.md](../../evidence/research/official-feeds-url-audit-v0.1.md) | TR resmi feed audit örneği |
| [tcmb-feed-audit-v0.3.md](../../evidence/research/tcmb-feed-audit-v0.3.md) | Teknik PASS / legal gate ayrımı |

---

## 13. Revizyon geçmişi

| Sürüm | Tarih | Not |
|-------|-------|-----|
| v0 | 2026-06-30 | İlk global genişleme stratejisi; evidence-first; kod yok |
