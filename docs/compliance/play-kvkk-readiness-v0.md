# Play / KVKK Readiness Checklist v0

> **Tür:** Yayın öncesi compliance blocker listesi (docs-only).  
> **Hukuki statü:** Bu belge hukuki tavsiye değildir; risk sınıflandırması ve operasyon checklist’idir.  
> **Son güncelleme:** 2026-06-29 (PR #51 sonrası B5 refresh)

---

## Executive Summary

Haber Radarı Google Play ve KVKK açısından yayına çıkmadan önce tamamlanması gereken maddeleri bu belgede toplar. Mevcut teknik durumda en kritik blocker’lar: **yayınlanabilir Privacy Policy URL eksikliği**, **KVKK aydınlatma metni**, **Data Safety formunun gerçek veri akışıyla hizalanması**, **News uygulaması self-declaration**, ve **prod HTTPS/TLS + hostname kanıtı (B5)**.

**B5 notu (PR #47 / #50 / #51 sonrası):** Android release cleartext hardening **tamamlandı** (PR #47). B5 formal kapanışı için **prod API hostname + TLS termination + HTTPS smoke evidence** hâlâ eksik — `B5_STATUS=PROD_HTTPS_PENDING`. Sahte PASS yazılmaz.

Paralel ürün işleri:

| PR / iş | Durum |
|---------|--------|
| PR #47 Android release cleartext hardening | **Merged** — release NSC deny; debug localhost istisnası |
| PR #49 Android Room seed legalMode refresh | **Merged** |
| PR #50 B5 audit evidence | **Merged** — `evidence/play/prod-https-tls-readiness-b5-v0.md` |
| PR #51 Prod HTTPS/TLS ops plan | **Merged** — `evidence/play/ops-prod-https-tls-plan-v0.md` |
| PR #36 Android `aiSummary` fallback | **Draft — merge edilmemeli**; cihaz smoke bekleniyor |
| Backend `aiSummary` cleanup | PR #36 cihaz smoke sonrası |
| Aktif legal guard binding | Cleanup + Play/KVKK hazırlığı sonrası |
| `ops/prod-https-tls-implementation-v0` | **Bekliyor** — canlı etki; açık onay gerekir |

Ürün dili çizgisi korunur: **kaynak sinyali**, **kaynak profili**, **kaynak sağlığı**, **orijinal kaynağa yönlendirme**, **yardımcı değerlendirme**.  
*“Bu sinyal haberin doğruluğunu tek başına garanti etmez.”*

---

## Current Blockers

| # | Blocker | Mevcut durum | Release gate |
|---|---------|--------------|--------------|
| B1 | Privacy Policy URL | Taslak v0 oluşturuldu (`privacy-policy-draft-v0.md`); **canlı URL yok** | Play Console’da zorunlu |
| B2 | KVKK aydınlatma metni | Taslak v0 oluşturuldu (`kvkk-aydinlatma-draft-v0.md`); **hukuk teyidi yok** | TR kullanıcı için gerekli |
| B3 | Data Safety beyanı | Taslak v0 (`data-safety-draft-v0.md`); **Play Console submission pending** | Play formu gerçek akışla uyumlu olmalı |
| B4 | News & Magazine declaration | Taslak v0 (`news-declaration-draft-v0.md`); **Play Console submission pending** | Haber kategorisi beyanı |
| B5 | HTTPS / cleartext / prod TLS | **`PROD_HTTPS_PENDING`** — release cleartext **DONE** (PR #47); prod hostname/TLS/smoke **eksik** (PR #50 audit, PR #51 ops plan). Evidence: [prod-https-tls-readiness-b5-v0.md](../../evidence/play/prod-https-tls-readiness-b5-v0.md), [ops-prod-https-tls-plan-v0.md](../../evidence/play/ops-prod-https-tls-plan-v0.md) | Prod HTTPS endpoint + TLS kanıtı + release `-PprodSmartFeedBaseUrl=https://...` |
| B6 | Mobil API/LLM key | Şu an uyumlu görünüyor | Sürekli denetim |
| B7 | Yanıltıcı ürün dili | Çoğunlukla uyumlu; denetim gerekli | Store + in-app metin review |
| B8 | PR #36 cihaz smoke | Beklemede | Fallback merge gate |

---

## Privacy Policy requirements

Play Console ve kullanıcı verisi toplayan uygulamalar için **erişilebilir Privacy Policy URL** zorunludur.

Dokümanda açıkça yer alması gereken konular (hukuk danışmanı teyidi gerekir):

- Hangi veriler toplanır (cihaz tanımlayıcıları, kullanım telemetrisi, crash logları vb.)
- Veri toplama amacı ve hukuki dayanak (KVKK m.5 / m.6)
- Üçüncü taraf paylaşımları (analytics, hosting, LLM sağlayıcı — varsa)
- Veri saklama süreleri
- Kullanıcı hakları ve başvuru kanalı (e-posta / web form)
- Çocuklara yönelik politika (hedef kitle 13+ ise)
- RSS/metadata ve harici haber linklerine yönlendirme politikası

**Blocker:** Yayın öncesi canlı URL + Play Console alanı doldurulmalı. Taslak: [privacy-policy-draft-v0.md](./privacy-policy-draft-v0.md) — **B1 hâlâ OPEN**.

---

## KVKK aydınlatma requirements

Türkiye’deki kullanıcılar için KVKK kapsamında **aydınlatma metni** gerekir.

| Kural | Not |
|-------|-----|
| Aydınlatma ≠ açık rıza | Ayrı metinler; tek checkbox altında birleştirilmemeli |
| Veri sorumlusu kimliği | Şirket/şahıs unvanı, iletişim |
| İşleme amaçları | Feed, cache, opsiyonel özellikler |
| Aktarım | Yurt içi / yurt dışı (hosting, analytics) |
| m.11 hakları | Silme, düzeltme, itiraz — süreç tanımı |

Hesap sistemi olmadığında bile cihaz/cache/analytics verisi KVKK kapsamına girebilir — **hukuk danışmanı teyidi gerekir**. Taslak: [kvkk-aydinlatma-draft-v0.md](./kvkk-aydinlatma-draft-v0.md) — **B2 hâlâ OPEN**.

---

## Data Safety draft checklist

Google Play Data Safety formu, uygulamanın **gerçek** veri pratiğiyle birebir uyumlu olmalıdır.

### Mevcut teknik gözlem (v0.6.7-debug)

| Veri kategorisi | Muhtemel durum | Form etkisi |
|-----------------|----------------|-------------|
| Kişisel bilgi (ad, e-posta) | Hesap yok → muhtemelen toplanmıyor | “Toplanmıyor” veya N/A — teyit gerekir |
| Uygulama etkileşimleri | Room cache, feed fetch logları | “Collected” / “Not shared” — teyit |
| Cihaz veya diğer tanımlayıcılar | Crash/analytics eklenirse değişir | Şimdilik minimal varsayım |
| Konum | **Toplanmıyor** (v0) | Formda konum yok |
| Şifrelenmiş transit | Release cleartext kapalı (PR #47); prod HTTPS hostname **TBD** | Debug HTTP ≠ production; B5 prod TLS pending |

**Checklist:**

- [ ] Toplanan / toplanmayan her kategori için engineering + legal review
- [ ] Veri silme talebi süreci (hesap yoksa alternatif kanal)
- [ ] Üçüncü taraf SDK envanteri (OkHttp, Room, WorkManager, analytics varsa)
- [ ] Smart digest / LLM metadata işleme açıklaması (backend-only)

---

## News app declaration checklist

Haber uygulaması olarak Play self-declaration gerektirir.

- [ ] Uygulama kategorisi: News & Magazines
- [ ] Kaynak gösterimi ve orijinal link politikası açıklanmış
- [ ] Telif / RSS ToS uyumu (source registry `legalMode` ile uyumlu)
- [ ] Kullanıcıya tam makale scrape etmeden metadata + link-out sunumu
- [ ] Editöryal içerik iddiası yok (aggregator/radar konumlandırması)
- [ ] AA / lisanslı kaynaklar runtime’da kapalı veya lisanslı olana kadar disabled

---

## Network security / HTTPS / cleartext

**Resmi etiket:** `B5_STATUS=PROD_HTTPS_PENDING`

| Ortam | Mevcut (main, PR #47 sonrası) | Hedef |
|-------|----------------------------------|-------|
| **Debug APK** | `networkSecurityConfig`: base deny + `127.0.0.1` / `localhost` / `10.0.2.2` cleartext istisnası; `SMART_FEED_BASE_URL=http://127.0.0.1:3001` | Yerel geliştirme + adb reverse |
| **Production release** | Main manifest **`usesCleartextTraffic` yok**; main NSC global `cleartextTrafficPermitted=false`; release `SMART_FEED_BASE_URL=""` (veya build-time `-PprodSmartFeedBaseUrl=https://...`) | **HTTPS zorunlu**; cleartext kapalı |
| **API base URL** | Debug: HTTP localhost; Release: boş veya HTTPS Gradle property | Onaylı prod hostname + TLS |

### B5 alt durumu

| B5 bileşeni | Durum |
|-------------|--------|
| Android release cleartext hardening | **DONE** — PR #47 |
| Debug cleartext prod’a sızıyor mu? | **Hayır** — debug source set only |
| Prod API hostname | **PENDING** — `PROD_HOSTNAME=TBD` (TEYİT GEREKİR) |
| TLS / reverse proxy ops | **PENDING** |
| `/health` HTTPS smoke evidence | **PENDING** |
| Release build gerçek HTTPS URL evidence | **PENDING** |
| Play formal B5 PASS | **PENDING** |

**Blocker (kalan):** Prod hostname kararı, DNS, TLS termination, HTTPS smoke (`curl`/`openssl`), release build `-PprodSmartFeedBaseUrl=https://<prod-host>`. Implementation: `ops/prod-https-tls-implementation-v0` (açık onay). Plan: [ops-prod-https-tls-plan-v0.md](../../evidence/play/ops-prod-https-tls-plan-v0.md). Audit: [prod-https-tls-readiness-b5-v0.md](../../evidence/play/prod-https-tls-readiness-b5-v0.md). Eski hardening planı (pre-#47): [release-https-cleartext-hardening-plan-v0.md](./release-https-cleartext-hardening-plan-v0.md) — implementation kanıtı: [release-https-cleartext-hardening-v0.md](../../evidence/compliance/release-https-cleartext-hardening-v0.md).

---

## API key / LLM key policy

| Katman | Kural | Mevcut durum |
|--------|-------|--------------|
| Android APK | API key / LLM key **gömülmez** | Uyumlu — key yok |
| Backend | `LLM_DIGEST_API_KEY` env | Server-side only |
| Status endpoint | `apiKeyExposed: false` kontrolü | Mevcut |
| Mobil istemci | Doğrudan LLM çağrısı yok | Uyumlu |
| Smart digest | Varsayılan kapalı / operatör onayı | `LLM_DIGEST_EXTERNAL_ENABLED=0` hedefi |

**Release gate:** APK reverse-engineering taraması + env secret yönetimi dokümante.

---

## Account deletion N/A decision

| Soru | Karar (v0) |
|------|------------|
| Kullanıcı hesabı var mı? | **Hayır** — kayıt/giriş yok |
| Play “account deletion” URL | Hesap yoksa **N/A** veya “hesap oluşturulmuyor” açıklaması — **hukuk danışmanı + Play policy teyidi gerekir** |
| Yerel veri silme | Kullanıcı uygulama verisini OS ayarlarından silebilir; in-app “tüm cache’i temizle” opsiyonel iyileştirme |

Hesap özelliği eklenirse bu karar **yeniden açılır**.

---

## Location / weather future impact

Şu an konum toplanmıyor. İleride hava durumu veya konum bazlı feed eklenirse:

| Etki | Aksiyon |
|------|---------|
| Android `ACCESS_FINE_LOCATION` / `COARSE` | Runtime izin + rationale UI |
| Play Data Safety | “Location” collected işaretlenmeli |
| KVKK aydınlatma | Konum işleme amacı eklenmeli |
| Privacy Policy | Konum bölümü |
| Source registry | Konum sağlayıcı ToS |

**Şimdilik:** Feature eklenmeden release blocker değil; roadmap notu.

---

## Push notification future impact

Push eklenirse:

| Etki | Aksiyon |
|------|---------|
| `POST_NOTIFICATIONS` (Android 13+) | Runtime izin |
| FCM / token | Data Safety “Device ID” / token kategorisi |
| KVKK | Bildirim tercihi ve veri işleme |
| Privacy Policy | Push ve opt-out |
| Yanıltıcı dil | “Acil doğrulandı” tarzı push yasak |

**Şimdilik:** Push yok → blocker değil.

---

## Store listing forbidden language

Play Store açıklama, ekran görüntüsü ve kısa açıklamada **kullanılmamalı**:

| Yasak / riskli | Önerilen alternatif |
|----------------|---------------------|
| Doğrulandı / kanıtlandı | Kaynak sinyali / çoklu kaynak notu |
| Kesin doğru haber | Metadata tabanlı özet |
| Yalan haber yakalar | Gürültü / düşük kalite sinyali |
| %100 güvenilir | Güven skoru / kaynak profili (idempotent değil iddia) |
| Fact-check servisi | Haber radarı / kaynak şeffaflığı |

---

## Onboarding / Trust UX forbidden language

In-app metinler (Feed, detay, trust chip, smart digest):

- ✅ “Bu sinyal haberin doğruluğunu tek başına garanti etmez.”
- ✅ “Tek kaynak — orijinal haberi kontrol edin.”
- ✅ “Kaynak sağlığı / kaynak profili”
- ❌ “Doğrulandı”, “kesin doğru”, “yalan haber”, “kanıtlandı”

Mevcut `TrustTransparencyUiLogic` ve source signal disclaimer’ları bu çizgiye yakın — release öncesi tam metin taraması önerilir.

---

## Release gate acceptance criteria

Yayın (internal / closed / production) öncesi:

- [ ] Privacy Policy URL canlı ve Play Console’da girilmiş
- [ ] KVKK aydınlatma metni erişilebilir
- [ ] Data Safety formu engineering review ile imzalanmış
- [ ] News self-declaration tamamlanmış
- [ ] Release APK: cleartext kapalı (PR #47 **DONE**), prod HTTPS endpoint kanıtı (B5 **PENDING**)
- [ ] Mobil APK’da API/LLM key yok (doğrulama)
- [ ] Store + in-app yasak dil taraması PASS
- [ ] PR #36 cihaz smoke PASS (ayrı gate)
- [ ] Backend `aiSummary` cleanup (ayrı gate, PR #36 sonrası)
- [ ] Aktif legal guard binding (en son gate)

---

## Hukuk danışmanı teyidi gerekir alanları

1. Privacy Policy ve KVKK aydınlatma metni nihai metinleri
2. Hesap olmayan uygulama için Play account deletion beyanı
3. RSS/metadata + link-out modelinin FSEK / basın / kaynak ToS uyumu
4. Smart digest (LLM metadata özeti) için ayrı açıklama gerekir mi?
5. Yurt dışı hosting / analytics kullanımında KVKK aktarım bildirimi
6. Çocuk kullanıcı hedef kitlesi ve yaş sınırı
7. News category self-declaration ifadesinin hukuki uygunluğu

---

## Open questions

| # | Soru | Sahip |
|---|------|-------|
| Q1 | Privacy Policy hangi domain’de host edilecek? | Ürün / hukuk |
| Q2 | Analytics / crash (Firebase, Sentry) v0’da var mı? | Engineering |
| Q3 | Closed testing önce mi, production sonra mı? | Ürün |
| Q4 | TR-only mi, global mi? Data Safety farkları | Ürün / hukuk |
| Q5 | In-app KVKK linki Settings’te mi, onboarding’de mi? | UX / hukuk |
| Q6 | Production API hostname ve TLS sertifikası | DevOps — [ops-prod-https-tls-plan-v0.md](../../evidence/play/ops-prod-https-tls-plan-v0.md); hostname **TBD** |

---

## İlişkili belgeler

- [Source plan SSOT v1](../research/haber-radari-source-plan-update-v1.md) — Bölüm 6–8
- [TITLE_LINK_ONLY backend cleanup plan v0](../../evidence/source-registry/title-link-only-backend-cleanup-plan-v0.md)
- [B5 audit evidence v0](../../evidence/play/prod-https-tls-readiness-b5-v0.md) — PR #50
- [Ops prod HTTPS/TLS plan v0](../../evidence/play/ops-prod-https-tls-plan-v0.md) — PR #51
- [Release cleartext hardening evidence v0](../../evidence/compliance/release-https-cleartext-hardening-v0.md) — PR #47
- PR #36 — Android fallback (cihaz smoke bekliyor)
