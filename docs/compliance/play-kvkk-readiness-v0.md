# Play / KVKK Readiness Checklist v0

> **Tür:** Yayın öncesi compliance blocker listesi (docs-only).  
> **Hukuki statü:** Bu belge hukuki tavsiye değildir; risk sınıflandırması ve operasyon checklist’idir.  
> **Son güncelleme:** 2026-06-29

---

## Executive Summary

Haber Radarı Google Play ve KVKK açısından yayına çıkmadan önce tamamlanması gereken maddeleri bu belgede toplar. Mevcut teknik durumda en kritik blocker’lar: **yayınlanabilir Privacy Policy URL eksikliği**, **KVKK aydınlatma metni**, **Data Safety formunun gerçek veri akışıyla hizalanması**, **News uygulaması self-declaration**, ve **production’da cleartext HTTP’nin kapatılması**.

Paralel ürün işleri:

| PR / iş | Durum |
|---------|--------|
| PR #36 Android `aiSummary` fallback | **Draft — merge edilmemeli**; cihaz smoke bekleniyor |
| Backend `aiSummary` cleanup | PR #36 cihaz smoke sonrası |
| Aktif legal guard binding | Cleanup + Play/KVKK hazırlığı sonrası |

Ürün dili çizgisi korunur: **kaynak sinyali**, **kaynak profili**, **kaynak sağlığı**, **orijinal kaynağa yönlendirme**, **yardımcı değerlendirme**.  
*“Bu sinyal haberin doğruluğunu tek başına garanti etmez.”*

---

## Current Blockers

| # | Blocker | Mevcut durum | Release gate |
|---|---------|--------------|--------------|
| B1 | Privacy Policy URL | Yok / doğrulanmamış | Play Console’da zorunlu |
| B2 | KVKK aydınlatma metni | Yok / doğrulanmamış | TR kullanıcı için gerekli |
| B3 | Data Safety beyanı | Yapılmadı | Play formu gerçek akışla uyumlu olmalı |
| B4 | News & Magazine declaration | Yapılmadı | Haber kategorisi beyanı |
| B5 | HTTPS / cleartext | `usesCleartextTraffic="true"` (debug) | Production release build’de kapalı |
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

**Blocker:** Yayın öncesi canlı URL + Play Console alanı doldurulmalı.

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

Hesap sistemi olmadığında bile cihaz/cache/analytics verisi KVKK kapsamına girebilir — **hukuk danışmanı teyidi gerekir**.

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
| Şifrelenmiş transit | Production HTTPS hedefi | Cleartext debug ≠ production |

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

| Ortam | Mevcut | Hedef |
|-------|--------|-------|
| Debug APK | `android:usesCleartextTraffic="true"` | Yerel `127.0.0.1:3001` + adb reverse |
| Production release | Henüz yapılandırılmamış | **HTTPS zorunlu**, cleartext kapalı |
| API base URL | `FeatureConfig.smartFeedBaseUrl` debug HTTP | Production HTTPS endpoint |

**Blocker:** Release build’de `usesCleartextTraffic=false` + network security config ile yalnızca HTTPS (veya pinning politikası — teyit gerekir).

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
- [ ] Release APK: cleartext kapalı, HTTPS endpoint
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
| Q6 | Production API hostname ve TLS sertifikası | DevOps |

---

## İlişkili belgeler

- [Source plan SSOT v1](../research/haber-radari-source-plan-update-v1.md) — Bölüm 6–8
- [TITLE_LINK_ONLY backend cleanup plan v0](../../evidence/source-registry/title-link-only-backend-cleanup-plan-v0.md)
- PR #36 — Android fallback (cihaz smoke bekliyor)
