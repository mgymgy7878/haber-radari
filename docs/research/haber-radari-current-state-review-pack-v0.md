# Haber Radarı — Mevcut Yapı, Son Durum ve Plan Değerlendirme Paketi v0

**Belge türü:** Dış değerlendirme paketi (Claude / Gemini)  
**Tarih:** 2026-06-30  
**Hazırlayan bağlam:** Cursor Auto — repo okuma + evidence sentezi  
**Aktif legal SSOT:** [haber-radari-source-plan-update-v1.md](./haber-radari-source-plan-update-v1.md)

> **Uyarı:** Bu belge hukuki kesin hüküm vermez; risk sınıflandırması ve teknik/ürün durum özetidir. Bilinmeyen veya teyit gerektiren noktalar açıkça işaretlenmiştir.

---

## Belge meta

| Alan | Değer |
|------|-------|
| **Main HEAD (rapor anı)** | `16b2c38` — PR #68 merge (`docs: review global official source tos v0`) |
| **Açık PR** | [#69](https://github.com/mgymgy7878/haber-radari/pull/69) — `feat/global-official-feed-seed-v0` — **OPEN, merge edilmedi** |
| **PR #69 commit** | `5785a23` — `feat: add global official feed seed v0` |
| **Play/KVKK/B5** | Dondurulmuş — bu rapor hattına dokunulmadı |
| **Kod değişikliği (bu PR)** | Hayır — yalnızca bu belge |

### Birincil referanslar

| Belge | Rol |
|-------|-----|
| [haber-radari-source-plan-update-v1.md](./haber-radari-source-plan-update-v1.md) | Aktif legal/kaynak SSOT |
| [global-source-expansion-strategy-v0.md](./global-source-expansion-strategy-v0.md) | Global genişleme stratejisi (PR #66) |
| [evidence/research/global-official-feeds-audit-v0.md](../../evidence/research/global-official-feeds-audit-v0.md) | PR #67 teknik feed audit |
| [evidence/research/global-official-tos-review-v0.md](../../evidence/research/global-official-tos-review-v0.md) | PR #68 ToS gate |
| [evidence/android/global-official-feed-seed-v0.md](../../evidence/android/global-official-feed-seed-v0.md) | PR #69 evidence (branch’te; main’de henüz yok) |
| [evidence/android/personal-apk-device-smoke-v0.md](../../evidence/android/personal-apk-device-smoke-v0.md) | Son bilinen cihaz smoke (PR #56) |
| [evidence/android/personal-apk-source-health-details-v0.md](../../evidence/android/personal-apk-source-health-details-v0.md) | Kaynak sağlığı detayları (PR #65) |

---

## 1. Executive Summary

### Projenin şu anki hedefi

Haber Radarı, **reklamsız, metadata tabanlı, kişisel önemli gelişme radarı**dır. Aktif ürün hattı **bireysel kullanım APK** önceliklidir. **Play / KVKK / B5** yayın hazırlığı bilinçli olarak **dondurulmuştur**. PR #66 ile **küresel resmi/kurumsal kaynak genişlemesi** stratejik hedef olarak eklendi; ancak ticari medya ve ajanslar doğrudan seed’e alınmaz.

### Mevcut main state (`16b2c38`)

| Boyut | Durum |
|-------|--------|
| Android seed (runtime binding) | **3 kaynak:** NTV Türkiye, BBC Türkçe, Habertürk |
| BBC Türkçe | `NEEDS_REVIEW` — ingest kapalı, toggle disabled çizgisi |
| AFAD | Registry’de kalır; runtime seed’den çıkarıldı (PR #60) — feed URL 302→404 |
| TCMB | Registry’de; teknik feed PASS (PR #64) ama ToS gate **PASS değil** (PR #63) — seed kapalı |
| Global resmi kaynaklar | Audit (#67) + ToS (#68) tamamlandı; **henüz main’de seed yok** |
| Backend smart-feed | Ayrı hattır; bireysel APK RSS + opsiyonel backend cache kullanır |
| CI | **Yok** — `.github/workflows` bulunamadı; doğrulama yerel Gradle + manuel smoke |
| Source Registry SSOT borcu | **Açık** — Android assets ve API registry ayrı kopyalar; senkron garantisi yok |

### Açık PR #69 state

| Alan | Değer |
|------|-------|
| Durum | **OPEN**, `MERGEABLE` (GitHub, 2026-06-30) |
| CI checks | **Yok** (`statusCheckRollup` boş) |
| Kapsam | Android’e 3 global resmi kaynak seed + RssParser sıkılaştırma + unit testler |
| Cihaz smoke | **Atlandı** — adb PATH’te yok (PR evidence) |
| Unit test | PR evidence: 199 test PASS, assembleDebug PASS — **bu rapor oturumunda yeniden çalıştırılmadı** |

### En önemli açık kararlar

1. **PR #69 merge edilsin mi?** — Unit testler yeşil; cihaz smoke ve registry SSOT ayrışması açık sorular.
2. **Fed/EU default disabled, USGS default enabled** — Operatör onayı / dış review ile sabitlenmeli mi?
3. **Source Registry SSOT** — PR #69 Android registry’yi 24’e çıkarır; API registry main’de 21 kalır.
4. **TCMB seed** — Teknik hazır; legal gate `NEEDS_REVIEW` / Play için `LICENSE_REQUIRED` riski.
5. **Play/KVKK/B5** — Bilinçli erteleme; prod HTTPS/cleartext hazırlık evidence var (#47–#52) ama store hattı kapalı.

---

## 2. Ürün Yönü

### Haber Radarı nedir?

Kişisel haber radarı: kullanıcının seçtiği kaynaklardan **metadata sinyali** toplar, önemli gelişmeleri listeler ve **orijinal kaynağa yönlendirir**. Reklamsız; şimdilik **Türkçe arayüz**. Kaynak başlıkları orijinal dilde kalabilir (ör. İngilizce Fed başlığı).

### Coğrafya ve dil

| Boyut | v0 kararı |
|-------|-----------|
| Coğrafya | Türkiye omurgası + seçili küresel resmi/kurumsal kaynaklar (strateji) |
| UI dili | Türkçe |
| Kaynak dili | TR + EN (+ diğer) olabilir |
| Çok dilli UI / çeviri | **v0 dışı** — maliyet, legal, Play bağımlılığı |
| LLM mobil istemci | **Yasak** — kalıcı backend proxy zorunlu (SSOT v1) |

### Yasak ürün iddiaları

Aşağıdaki ifadeler **ürün dilinde kullanılmaz:**

- “Haber doğrulama”
- “Kesin doğru haber”
- “Yalan haber tespiti / yakalar”
- “Kanıtlandı”

### İzin verilen ürün dili

- Kaynak sinyali
- Kaynak profili
- Kaynak sağlığı
- Metadata özeti (makale özeti / parafraz **değil**)
- Orijinal kaynağa yönlendirme
- **“Bu sinyal haberin doğruluğunu tek başına garanti etmez.”** (PR #65 disclaimer örneği)

### Bireysel APK vs Play

| Hat | Durum |
|-----|--------|
| Bireysel APK (sideload / kişisel) | **Aktif geliştirme önceliği** |
| Play Store / KVKK / Data Safety / B5 | **Dondurulmuş** — checklist ve draft’lar mevcut, aktif sprint değil |

---

## 3. Legal-safe İçerik Modeli

> Hukuki kesin hüküm değildir. Operasyonel risk sınıflandırmasıdır.

### Metadata-only model (özet)

Uygulama, kaynakların RSS/Atom feed’inden **dar metadata** alır; makale gövdesini, görseli veya scrape edilmiş metni **taşımaz ve üretmez**.

### İzinli alanlar (ingest / UI)

| Alan | Not |
|------|-----|
| `title` | Orijinal dil |
| `sourceName` | Kaynak adı |
| `publishedAt` / tarih | Parse edilebilir formatlar |
| `canonicalUrl` / `originalLink` | Link-out zorunlu |
| `category` / section / ülke sinyali | Varsa metadata |
| Afet metadata (USGS) | Zaman, yer, büyüklük — yapılandırılmış sinyal; tam metin değil |

### Yasak alanlar

```text
body, fullText, contentHtml, rawHtml, articleText, scrapedText,
articleSummary, image, video, audio, caption,
ocrText, videoTranscript, aiSummary (ticari/ajans için özellikle)
```

Scraping **varsayılan kapalı**. RSS varlığı **tek başına izin sayılmaz** — ToS / robots / lisans ayrı gate.

### Kaynak sınıfları (SSOT v1 özeti)

| Sınıf | Varsayılan |
|-------|------------|
| Ajans (AA, Reuters, AP, AFP…) | Lisans yoksa **DISABLED** |
| Ticari medya | **TITLE_LINK_ONLY** veya **NEEDS_REVIEW** |
| Resmi/kurumsal | Metadata-only + link-out + attribution |

### Lisanssız ticari/ajans güvenli model

Makale scrape + AI özet/parafraz + link **yapılmaz**. Güvenli model: **metadata-only kaynak sinyali + orijinal link**. Olay “özü” çoklu kaynak metadata cluster’ından türetilebilir; makale metninden özet **üretilmez** (PR #66).

### Gate enum’ları (strateji + audit hattı)

```text
TOS_PASS_METADATA_ONLY    — seed adayı (dar mod ile)
TITLE_LINK_ONLY_ONLY      — dar mod mümkün; tam metadata gate geçmedi
NEEDS_REVIEW              — operatör/hukuk teyidi gerekir
LICENSE_REQUIRED          — yazılı lisans / izin
DISABLED                  — ingest kapalı
NO_FEED_FOUND             — doğrulanmış feed yok
APPROVED_METADATA_SOURCE  — PR #67’de hiçbir kaynak almadı (ToS teyidi eksik)
```

---

## 4. Mevcut Android APK Yapısı

### Mimari özet (main)

| Katman | Bileşen | Rol |
|--------|---------|-----|
| UI | `FeedScreen`, `SourceManagementScreen` | Feed + kaynak yönetimi |
| ViewModel | `FeedViewModel` | RSS refresh + smart-feed cache |
| Data | `NewsRepository` | RSS fetch, `RssParser`, Room cache |
| Seed | `AndroidSeedRegistryDeriver` | Registry JSON → frozen runtime binding |
| Policy | `SourceSeedRefreshPolicy` | Mevcut kurulumda metadata refresh; kullanıcı `enabled` korunur |

### Feed UX (PR #53–#57 hattı)

- **Status bar:** tarama / ana akış / izleme istatistikleri
- **Empty / error state:** kullanıcı geri bildirimi
- **Son güncelleme** göstergesi
- **Son Haberler** RSS fallback listesi (backend/smart-feed yanında)
- **Trust / kaynak sinyali** dili — doğrulama iddiası yok
- **Cache banner soften (PR #57):** “Son kayıtlı haberler gösteriliyor” — daha az alarmist

### Kaynak Yönetimi (PR #54)

- Kaynak aç/kapat toggle
- `legalMode` chip (TITLE_LINK_ONLY, NEEDS_REVIEW, vb.)
- BBC `NEEDS_REVIEW`: toggle **disabled**, ingest kapalı mesajı
- Kaynak profili ipuçları

### Kaynak sağlığı detayları (PR #65)

Kartlarda ek panel:

- Durum mesajı (sağlıklı / kapalı / NEEDS_REVIEW / 0 haber / ardışık hata)
- Kayıtlı haber sayısı, son başarılı yenileme, son hata özeti (sanitize)
- Disclaimer: kaynak sağlığı doğruluğu garanti etmez

### Offline / cache / refresh (PR #55)

- Backend kapalıyken **smart-feed disk cache** korunur
- `RemoteAiCuratedFeedRepository`: fetch fail → cache fallback
- RSS tarafı Room’da makale cache — yenileme hatalarında son kayıtlar korunur

### Device smoke evidence

| Oturum | Sonuç | Not |
|--------|-------|-----|
| PR #56 (`personal-apk-device-smoke-v0`) | **PASS** | Xiaomi Redmi Note 10 Pro, Android 13, adb mevcut |
| PR #69 global seed smoke | **Yapılmadı** | adb PATH yok (geliştirici ortamı) |
| Global kaynaklar post-#69 | **Bilinmiyor** | Merge sonrası manuel smoke gerekir |

**Açık borç:** CI yok + adb her ortamda yok → cihaz smoke periyodik manuel checklist ile sürdürülmeli.

---

## 5. Kaynak / Seed Durumu

### Main’de Android runtime seed (3)

| Android ID | Registry ID | legalMode | default enabled | Ingest |
|------------|-------------|-----------|-----------------|--------|
| `ntv-turkiye` | `ntv_turkiye` | `TITLE_LINK_ONLY` | true | Açık |
| `haberturk` | `haberturk` | `TITLE_LINK_ONLY` | true | Açık |
| `bbc-turkce` | `bbc_turkce` | `NEEDS_REVIEW` | true (görünür) | **Kapalı** (`blocksProductionIngest()`) |

Registry JSON (Android assets): **21 kayıt** — çoğu otomatik seed edilmez.

### BBC `NEEDS_REVIEW` çizgisi

- Kaynak listede görünür (şeffaflık)
- Toggle disabled — kullanıcı açamaz
- Fetch/parser/DAO ingest bloklar
- Ürün dili: inceleme bekliyor; üretim akışına alınmaz

### AFAD — neden çıkarıldı? (PR #58 → #59 → #60)

| Aşama | Olay |
|-------|------|
| PR #58 | AFAD `https://www.afad.gov.tr/rss` seed’e eklendi |
| PR #59 audit | URL **302 → 404** — kullanılabilirlik regresyonu |
| PR #60 fix | Runtime binding kaldırıldı; `ANDROID_SEED_RETIRED_RUNTIME_IDS_V0`; mevcut kurulumda `enabled=false` |
| Registry | `afad_official` kaydı **kaldı** — sahte URL tahmin edilmedi |

### TCMB durumu

| Katman | Sonuç | Kaynak |
|--------|-------|--------|
| Teknik feed | **PASS** — Atom, 20 entry, title/link/date dolu | PR #64 (`tcmb-feed-audit-v0.3`) |
| Türkçe tarih parse | **PASS** (PR #62 sonrası) | `RssParser` |
| ToS / legal | **PASS değil** — `NEEDS_REVIEW`; Play için `LICENSE_REQUIRED` riski | PR #63 |
| Seed gate | **Kapalı** | SSOT + evidence gate kuralı |

**Teyit gerekir:** Bireysel ücretsiz APK “ticari kullanım” sayılır mı? — TCMB ToS madde 4 belirsizliği.

### Global kaynak durumu (main — seed öncesi)

#### PR #67 — Teknik feed audit

- 18 resmi kaynak denetlendi
- **Hiçbir kaynak `APPROVED_METADATA_SOURCE` almadı** (ToS teyidi audit kapsamında tamamlanmadı)
- Teknik erişimi güçlü adaylar: Fed, ECB, EU Commission, USGS, WHO, CISA…

#### PR #68 — ToS gate

| Gate | Kaynaklar |
|------|-----------|
| **TOS_PASS_METADATA_ONLY** | **Fed**, **EU Commission**, **USGS** |
| TITLE_LINK_ONLY_ONLY | ECB, CISA |
| NEEDS_REVIEW | WHO |

#### ECB / CISA / WHO — seed dışı nedenleri

| Kaynak | PR #68 gate | Seed dışı gerekçe |
|--------|-------------|-------------------|
| **ECB** | TITLE_LINK_ONLY_ONLY | Çerçeveleme yasağı; satılan belge / gelecek monetization riski; tam TOS_PASS değil |
| **CISA** | TITLE_LINK_ONLY_ONLY | Açık PD/republication maddesi yok; federal .gov Fed ile uyum **kesin teyit edilmedi** |
| **WHO** | NEEDS_REVIEW | Ticari amaç yasağı; CC BY-NC-SA; RSS’te `a10:content` HTML — ingest yasak |

### Ticari medya / ajans

Reuters, AP, AFP, NYT, Guardian, BBC global, DW, CNN, Bloomberg, FT — **ayrı audit hattı**; doğrudan seed yok.

---

## 6. PR #69 Değerlendirmesi

> PR **merge edilmedi**. Değerlendirme branch `feat/global-official-feed-seed-v0` + GitHub PR metadata + evidence dosyasına dayanır.

### Özet

| Alan | Değer |
|------|-------|
| Branch | `feat/global-official-feed-seed-v0` |
| Commit | `5785a23` |
| Base | `main` @ `16b2c38` |
| Değişen dosya | 7 (5 kod + 1 test dosyası yeni + 1 evidence) |

### Eklenen kaynaklar

| Kaynak | Android ID | legalMode | default enabled |
|--------|------------|-----------|-----------------|
| Federal Reserve | `fed-press` | `TITLE_LINK_ONLY` | **false** |
| EU Commission Press | `eu-commission-press` | `TITLE_LINK_ONLY` | **false** |
| USGS Earthquakes | `usgs-earthquakes` | `RSS_METADATA_ONLY` | **true** |

Feed URL’ler yalnızca PR #67 evidence’dan; ToS gate PR #68.

### Fed — muhafazakâr default disabled

- **Gerekçe:** İlk global seed adımı; operatör kullanıcı bilinçli açsın; ToS PASS olsa da ürün riski kontrollü genişleme.
- **Risk azaltma:** `TITLE_LINK_ONLY` — description ingest edilmez.

### EU Commission — muhafazakâr default disabled

- **Gerekçe:** CC BY 4.0 reuse + üçüncü taraf içerik karışımı olasılığı; press RSS `description` paragraf içerir — ingest yasak.
- **Risk azaltma:** Aynı TITLE_LINK_ONLY çizgisi.

### USGS — default enabled

- **Gerekçe:** US Public Domain veri; programmatic feed; afet omurga sinyali; dar yapılandırılmış metadata (zaman/yer/mag) ürün hedefiyle uyumlu.
- **Risk:** Atom `summary` HTML — PR #69 `RssParser` ile HTML description null.

### `RssParser` değişiklikleri

| Davranış | Amaç |
|----------|------|
| `TITLE_LINK_ONLY` → `description = null` | Mevcut; sıkılaştırıldı |
| `RSS_METADATA_ONLY` + description içinde `<` → `null` | USGS Atom summary HTML sızıntısını engeller |
| `Instant.parse` ile ISO-8601 fractional seconds | USGS `2026-06-30T09:31:12.865Z` |

**Riskler:**

- HTML içermeyen düz metin description `RSS_METADATA_ONLY` modunda hâlâ geçebilir — ticari kaynaklarda risk; USGS için dar metadata yeterli mi **teyit gerekir**.
- Atom vs RSS ayrımı — yalnızca USGS için test var; diğer Atom feed’ler **bilinmiyor**.
- `Instant.parse` başarısız fallback davranışı — unit test kapsamı sınırlı.

### TR seed korunumu

PR evidence ve testler: NTV/Habertürk davranışı, BBC `NEEDS_REVIEW` — değişmediği iddia edilir. **Cihaz smoke ile teyit edilmedi.**

### Registry SSOT ayrışması (önemli)

| Registry | Main | PR #69 sonrası (Android) | API (`apps/api/...`) |
|----------|------|--------------------------|----------------------|
| Kayıt sayısı | 21 | **24** | **21** (dokunulmadı) |

Bu bilinçli kapsam daraltması olabilir; ancak **çift registry borcu derinleşir**. API smart-feed bu 3 kaynağı bilmez — bireysel APK RSS hattı için kabul edilebilir; uzun vadede SSOT birleşimi gerekir.

### Merge için objektif değerlendirme

#### Güçlü yanlar

- Dar kapsam: tam 3 kaynak; ECB/CISA/WHO/ticari medya yok
- PR #67 + #68 gate zinciri dokümante
- 199 unit test PASS (PR evidence)
- Forbidden field eklenmedi; manifest/gradle/schema/API dokunulmadı
- Fed/EU muhafazakâr default kapalı
- Yeni `GlobalOfficialFeedSeedV0Test` — legalMode, excluded sources, parser davranışı

#### Riskler

- **Cihaz smoke yok** — Kaynak Yönetimi UI, gerçek feed fetch, link-out
- **Registry ayrışması** — Android 24 vs API 21
- **USGS default enabled** — kullanıcı ilk kurulumda otomatik fetch; feed lifecycle/policy drift
- **Operatör onayı** — PR #68 “TOS_PASS dahi operatör onayı” notu
- **Attribution UI** — Fed “cite Board”, EU “CC BY 4.0” atıfı UI’da yeterli mi? **Teyit gerekir**

#### Merge öncesi sorulacak sorular

1. Fed/EU default disabled yeterince muhafazakâr mı, yoksa tüm global kaynaklar default kapalı mı olmalı?
2. USGS default enabled kabul edilebilir mi?
3. Android-only registry artışı geçici kabul mü, yoksa API senkronu merge blocker mı?
4. Cihaz smoke merge blocker mı, yoksa merge sonrası hemen mi yapılır?
5. Attribution / kaynak gösterme UI’sı bu 3 kaynak için yeterli mi?
6. `RSS_METADATA_ONLY` HTML strip yeterli mi, yoksa USGS için description her zaman null mı olmalı?

---

## 7. Test / Evidence Durumu

### Son bilinen otomatik testler

| PR / oturum | Komut | Sonuç |
|-------------|-------|-------|
| PR #65 | `:app:testDebugUnitTest`, `:app:assembleDebug` | PASS |
| PR #69 (branch) | Aynı | PASS — 199 tests (evidence) |
| **Bu rapor PR** | Test çalıştırılmadı | Docs-only |

### CI

- GitHub Actions workflow **bulunamadı**
- Merge gate otomasyonu **yok** — insan review + yerel Gradle

### adb / manual smoke

| Durum | Detay |
|-------|--------|
| PR #56 smoke | PASS — adb `120d06e1`, Xiaomi, Android 13 |
| PR #69 ortamı | adb PATH **yok** |
| Açık borç | Global seed sonrası smoke checklist |

### PR #69 için önerilen cihaz smoke maddeleri

1. Fresh install veya seed refresh sonrası Kaynak Yönetimi’nde 6 kaynak görünür
2. Fed / EU / USGS legalMode chip doğru
3. Fed / EU default **kapalı**; USGS default **açık**
4. BBC toggle hâlâ disabled
5. USGS enable + yenile → title/date/source/link; kartta body/özet yok
6. Fed/EU enable + yenile → yalnızca title/link/date
7. Orijinal kaynağa git aksiyonu çalışır
8. İngilizce başlık — çeviri yok

---

## 8. Açık Riskler

| Risk | Seviye | Not |
|------|--------|-----|
| Legal/ToS yorumu | Orta | TOS_PASS risk sınıflandırması; kesin hukuk teyidi yok |
| Global feed URL drift | Orta | PR #67 anlık snapshot; periyodik audit gerekir |
| TITLE_LINK_ONLY enforcement | Orta-Yüksek | Parser + DAO; yeni feed formatları bypass edebilir |
| RSS/Atom parser çeşitliliği | Orta | USGS Atom test var; genel Atom/RSS2 edge case’leri açık |
| Device smoke eksikliği | Orta | PR #69 merge güveni sınırlar |
| Play/KVKK/B5 dondurulmuş borç | Orta | Store açılınca TCMB, WHO, monetization yeniden değerlendirilir |
| Source Registry SSOT borcu | **Yüksek** (teknik borç) | Android/API ayrışması PR #69 ile artar |
| API/Android registry ayrışması | Orta-Yüksek | Smart-feed vs local RSS tutarsızlığı |
| TCMB ticari sınıf belirsizliği | Orta | Yazılı izin kapısı |
| AFAD feed URL bilinmiyor | Orta | Valid URL + ToS sonrası geri eklenebilir |
| Çift registry manuel senkron | Orta | İnsan hatası riski |

---

## 9. Önerilen Yol Haritası

### PR #69 — merge öncesi kontrol listesi

- [ ] İnsan review: 3 kaynak, legalMode, default enabled matrisi
- [ ] Karar: cihaz smoke merge blocker mı?
- [ ] Karar: API registry senkronu bu PR’da mı, sonraki PR’da mı?
- [ ] USGS `description` politikası — HTML strip vs her zaman null
- [ ] Attribution UI yeterliliği (Fed Board, EU CC BY)

### Kısa vade (0–2 hafta)

1. PR #69 review + karar (merge / revise / smoke-first)
2. adb ile global seed cihaz smoke evidence
3. Kaynak Yönetimi manuel test (6 kaynak)
4. Feed URL canlılık spot-check (Fed, EU, USGS)

### Orta vade

1. **Source Registry SSOT** — tek JSON, Android + API türetim (PR #42–#45 borcu kapatma)
2. Official feed monitoring / audit refresh periyodu
3. `global-official-feed-seed-v0.1` — ECB/CISA ancak gate PASS sonrası
4. TCMB — yazılı izin veya hukuk teyidi olmadan seed açılmaz

### Uzun vade

1. Play / KVKK / B5 hattı (dondurma kalkınca)
2. LLM / çeviri — yalnızca backend proxy + cache/quota + legal model hazır olunca
3. Ticari medya global audit (Reuters, NYT, BBC global…)
4. Aktif publish gate (şu an dry-run only — SSOT v1)

### Önerilen PR sırası (PR #66 evidence ile uyumlu)

```text
1. PR #69 kararı + smoke
2. Registry SSOT birleşimi
3. Official feed audit refresh
4. Gate PASS sonraki resmi kaynaklar (ECB/CISA teyit sonrası)
5. Ticari medya audit
6. Play/KVKK/B5 (en son)
```

---

## 10. PR #49–#69 Kronolojisi (ana kararlar)

| PR | Tür | Özet karar |
|----|-----|------------|
| **#49** | fix(android) | Mevcut kurulumlarda seed metadata registry’den refresh |
| **#50** | docs | Prod HTTPS TLS readiness B5 audit evidence |
| **#51** | docs | Prod HTTPS TLS ops plan v0 |
| **#52** | docs | Play KVKK B5 status refresh (#47/#50/#51 sonrası) |
| **#53** | feat(android) | Personal APK feed usability — status, empty/error, lastUpdated |
| **#54** | feat(android) | Kaynak Yönetimi — toggle, legalMode chip |
| **#55** | feat(android) | Offline cache refresh — backend down’da cache korunumu |
| **#56** | docs | Personal APK device smoke v0 evidence — **PASS** |
| **#57** | feat(android) | Cache banner soften |
| **#58** | feat(android) | Official feed expansion — **yalnızca AFAD** |
| **#59** | docs | Official feeds URL audit — AFAD 302→404 |
| **#60** | fix(android) | AFAD runtime seed kaldır; retired id disable |
| **#61** | docs | TCMB feed audit v0.2 |
| **#62** | fix(android) | Türkçe RSS tarih parse (`Europe/Istanbul`) |
| **#63** | docs | TCMB ToS review — seed gate **NEEDS_REVIEW** |
| **#64** | docs | TCMB feed audit v0.3 — teknik **PASS**, seed hâlâ kapalı |
| **#65** | feat(android) | Kaynak sağlığı detayları UI |
| **#66** | docs | Global kaynak genişleme stratejisi — metadata-only olay sinyali |
| **#67** | docs | 18 resmi kaynak feed audit — APPROVED yok |
| **#68** | docs | 6 kaynak ToS review — **TOS_PASS: Fed, EU, USGS** |
| **#69** | feat(android) — **OPEN** | İlk 3 global resmi seed + RssParser + testler |

**Önceki hat (PR #45–#48, bağlam):** Source Registry SSOT planı (#42–#43), API/Android registry derivation (#44–#45), cleartext hardening (#47), trust UX dili (#46).

---

## 11. Claude / Gemini’ye Sorulacak Sorular

Aşağıdaki sorular dış değerlendirme için bilinçli olarak açık bırakılmıştır:

1. **Legal-safe metadata-only model** proje genelinde yeterince net ve uygulanabilir mi? Eksik tanımlanan alan veya gri bölge var mı?
2. **PR #69’daki 3 global kaynak** (Fed, EU Commission, USGS) mevcut evidence zinciri (#67 + #68) ile merge için makul mü?
3. **Fed/EU default disabled, USGS default enabled** kararı bireysel APK için doğru risk dengesi mi?
4. **`TITLE_LINK_ONLY` enforcement** (parser + DAO + UI) yeterli mi? Bypass senaryoları neler?
5. **`RssParser` description null davranışı** (`<` kontrolü + TITLE_LINK_ONLY) USGS ve gelecekteki feed’ler için yeterli mi?
6. **Source Registry SSOT önceliği** PR #69’dan önce mi sonra mı olmalıydı? Android-only registry artışı kabul edilebilir geçici borç mu?
7. **Bireysel APK için öncelik:** cihaz smoke mu, global seed merge mi önce gelmeli?
8. **Hangi riskler** bu raporda eksik veya hafife alınmış görünüyor? (ToS, attribution, ticari sınıf, feed drift, parser, UX)
9. **TCMB** teknik PASS + legal NEEDS_REVIEW ayrımı doğru işletiliyor mu?
10. **ECB/CISA/WHO** dışı bırakma kararı PR #68 gate ile tutarlı mı?

---

## 12. Final Summary (bu belge PR’ı için)

| Soru | Yanıt |
|------|-------|
| Kod değişti mi? | **Hayır** (yalnızca bu rapor dosyası eklendi) |
| Rapor dışında dosya değişti mi? | **Hayır** |
| PR #69 merge edildi mi? | **Hayır** — OPEN |
| Seed/registry değişti mi? | **Hayır** (main `16b2c38` hâlâ 3 seed) |
| Manifest/Gradle/XML değişti mi? | **Hayır** |
| Test çalıştı mı? | **Hayır** — `Test çalıştırılmadı; docs-only review pack PR.` |
| Play/B5 değişti mi? | **Hayır** |
| PR #69 değerlendirildi mi? | **Evet** — Bölüm 6 |
| Sonraki önerilen karar noktası | **PR #69 merge / revise / smoke-first** + registry SSOT zamanlaması |

---

## Ek: Bilinmiyor / Teyit Gerekir

| Konu | Durum |
|------|--------|
| PR #69 branch’inin main’e merge conflict durumu gelecekte | Şu an MERGEABLE; main ilerledikçe değişebilir |
| Production smart-feed’in bireysel APK’daki kullanım oranı | Kullanıcı / build flag bağlı — **tam metrik bilinmiyor** |
| Fed/EU attribution UI metinleri | Registry `notes` var; ekranda özel atıf **teyit gerekir** |
| USGS feed lifecycle policy operasyonel uyum | Dokümante; otomatik izleme **yok** |
| Hukuki kesin uygunluk (tüm kaynaklar) | **Operatör/hukuk teyidi gerekir** |

---

*Belge sonu — `docs/current-state-review-pack-v0` branch.*
