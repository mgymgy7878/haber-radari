# Haber Radarı — Ops Prod HTTPS/TLS Plan v0

**Branch:** `docs/ops-prod-https-tls-plan-v0`  
**PR title:** `docs: add prod HTTPS TLS ops plan v0`  
**Base commit:** `52e73f1` (PR #50 merged)  
**Date:** 2026-06-29  
**Tür:** Operasyon planı / checklist — **canlı DNS, TLS, deploy veya kod değişikliği yok**

---

## Durum

```
B5_STATUS=PROD_HTTPS_PENDING
```

| Alan | Değer |
|------|--------|
| Bu PR B5’i kapatır mı? | **HAYIR** |
| Canlı etki | **YOK** |
| Kod / Manifest / Gradle / XML değişir mi? | **HAYIR** (bu PR) |
| Play publish | **Bekler** — prod hostname + TLS + HTTPS smoke gerekli |

**Arka plan (main):**

- PR #47: Android release cleartext hardening **DONE**
- PR #49: Android Room seed `legalMode` refresh **DONE**
- PR #50: B5 audit evidence — prod hostname **yok**, TLS **doğrulanamadı**, mobil key **yok**

**İlgili evidence:** [prod-https-tls-readiness-b5-v0.md](./prod-https-tls-readiness-b5-v0.md)

---

## 1. Hostname karar şablonu

Prod API hostname **henüz belirlenmedi**. Aşağıdaki şablon DevOps / ürün kararı için kullanılır. **Sahte hostname yazılmaz.**

| Alan | Değer |
|------|--------|
| `PROD_HOSTNAME` | **`TBD`** |
| `PROD_HOSTNAME_STATUS` | **`TEYİT GEREKİR`** |
| `PROD_BASE_URL` | `https://<PROD_HOSTNAME>` (hostname seçildikten sonra) |
| Android Gradle property | `-PprodSmartFeedBaseUrl=https://<PROD_HOSTNAME>` |

### Önerilen adlandırma seçenekleri

| Seçenek | Örnek | Not |
|---------|--------|-----|
| API subdomain | `api.<domain>` | Yaygın; Smart Feed + health tek host |
| News API subdomain | `news-api.<domain>` | Ürün adı vurgusu |
| Mevcut domain altı | `<mevcut-domain>` altında API path veya subdomain | DNS/Play Privacy URL ile hizalanmalı |

### Karar checklist (hostname seçimi)

- [ ] Play Privacy Policy URL ile aynı kök domain veya açık alt domain ilişkisi net
- [ ] KVKK / Data Safety’de belirtilen hosting bölgesi ile uyum (teyit gerekir)
- [ ] Türkiye / AB kullanıcı trafiği için latency kabul edilebilir
- [ ] Sertifika SAN/CN hostname’i kapsıyor
- [ ] Staging hostname ayrı mı? (`staging-api.<domain>` — opsiyonel, ayrı karar)

**Onay sahibi:** DevOps + ürün — **TEYİT GEREKİR**

---

## 2. Reverse proxy / TLS termination — karar tablosu

API (`apps/api`) geliştirmede HTTP `:3001` dinler; prod’da TLS **reverse proxy veya managed LB** katmanında sonlandırılır.

| Seçenek | Artı | Eksi | Operasyon riski | Yenileme | Rollback |
|---------|------|------|-----------------|----------|----------|
| **Caddy** | Otomatik Let’s Encrypt; config sade | Ek servis yönetimi | Orta — tek sunucu SPOF | Caddy auto-renew | Önceki `Caddyfile` geri yükle |
| **nginx + certbot** | Olgun; yaygın bilgi tabanı | Certbot cron/manuel takip | Orta — config hatası TLS kırar | certbot renew + nginx reload | `nginx.conf` snapshot geri |
| **Cloudflare (proxy)** | DDoS/WAF; kolay DNS | Origin TLS ayrı; vendor lock-in | Orta — yanlış SSL mode | CF dashboard / API | DNS proxy kapat / eski kayıt |
| **Cloud LB (GCP/AWS/Azure)** | Managed cert; ölçeklenebilir | Maliyet; cloud bağımlılığı | Düşük/Orta — provider SLA | Provider managed renewal | LB listener / cert geri al |
| **Hosting provider managed TLS** | PaaS basitliği (Railway, Render, Fly vb.) | Vendor limitleri; custom domain kuralları | Orta — plan limitleri | Provider panel | Deploy önceki revision |

### Minimum önerilen ops hedefi (implementation PR)

| Hedef | Açıklama |
|-------|----------|
| HTTPS-only prod endpoint | HTTP istekleri redirect veya reject |
| `/health` | `apps/api` mevcut route — proxy üzerinden erişilebilir |
| Geçerli TLS sertifikası | Süresi dolmamış; domain eşleşmesi |
| HTTP→HTTPS | Varsa redirect politikası evidence’da belgelenir |
| Android release Smart Feed URL | Yalnızca `https://` — `FeatureConfig` guard (PR #47) |
| Prod cleartext | **Kapalı kalır** — Android main NSC deny değişmez |

**Plan PR tercihi:** Karar tablosu doldurulana kadar **seçim yapılmaz** — implementation PR’da onaylı seçenek işaretlenir.

---

## 3. Mimari hedef (referans)

```
[Android Release APK]  --HTTPS-->  [PROD_HOSTNAME:443]
                                        |
                                   [TLS termination]
                                   Caddy / nginx / LB
                                        |
                                   [API :3001 HTTP loopback]
                                   apps/api Fastify
```

- API process prod’da genelde `127.0.0.1:3001` veya internal network’te HTTP dinler.
- Dış dünya yalnızca **443/TLS** görür.
- Smart Feed path: `GET /api/v1/smart-feed?includeWatchlist=1&includeLatest=1`

---

## 4. TLS / HTTPS smoke komutları

`<prod-host>` yerine **onaylı gerçek hostname** kullanılır. Hostname `TBD` iken komutlar **çalıştırılmaz** — yalnızca implementation evidence şablonu.

### 4.1 Temel erişim

```bash
# HEAD/verbose — sertifika ve status
curl -Iv "https://<prod-host>/health"

# Body
curl -sS "https://<prod-host>/health"

# Smart feed (metadata-only response; prod evidence)
curl -sS -o /tmp/smart-feed.json -w "http_code=%{http_code}\n" \
  "https://<prod-host>/api/v1/smart-feed?includeWatchlist=1&includeLatest=1"
```

### 4.2 TLS sertifika detayı

```bash
openssl s_client -connect <prod-host>:443 -servername <prod-host> </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
```

Kontrol listesi:

- [ ] Issuer güvenilir CA (Let’s Encrypt / commercial CA / cloud managed)
- [ ] `notAfter` gelecekte (≥ 30 gün buffer önerilir)
- [ ] SAN/CN `<prod-host>` ile eşleşiyor

### 4.3 HTTP davranışı (cleartext prod)

```bash
curl -Iv "http://<prod-host>/health"
```

Beklenen (implementation evidence):

- **301/308** → HTTPS redirect **veya**
- **Connection refused / 4xx** — plain HTTP kabul edilmiyor

Dev-only HTTP (`http://127.0.0.1:3001/health`) B5 kapanış **sayılmaz**.

### 4.4 DNS

```bash
# Windows
nslookup <prod-host>

# Linux/macOS
dig +short <prod-host>
```

- [ ] A/AAAA kaydı doğru origin’e işaret ediyor

---

## 5. Release build evidence adımları

Hostname onaylandıktan **sonra**, implementation PR veya release pipeline’da:

```bash
cd apps/android
./gradlew :app:assembleRelease -PprodSmartFeedBaseUrl=https://<prod-host>
```

Doğrulama:

```bash
# BuildConfig release SMART_FEED_BASE_URL
rg "SMART_FEED_BASE_URL" app/build/generated/source/buildConfig/release/

# Beklenen: https://<prod-host> (http:// olmamalı)
```

| Adım | Evidence |
|------|----------|
| Release APK/AAB üretildi | Build log + artifact path |
| Base URL HTTPS | BuildConfig dump veya merged manifest yok — BuildConfig yeterli |
| Mobil API/LLM key yok | `rg -i "api_key|openai|sk-" apps/android/app/src/main` → boş |
| `FeatureConfig.assertReleaseSmartFeedUrlPolicy()` | Release startup crash yok |

Release remote feed: URL boş değilse ve HTTPS ise `aiRemoteFeedEnabled=true` — **prod Smart Feed etkinleştirme ayrı onay** (aşağıda).

---

## 6. Android smoke adımları

### 6.1 Debug (geliştirme — prod evidence değil)

```bash
adb devices
adb reverse tcp:3001 tcp:3001   # local API
./gradlew :app:installDebug
adb logcat -c
adb shell am start -n com.haberradari/.MainActivity
adb logcat -d | rg -i "FATAL|AndroidRuntime"
```

### 6.2 Release + prod endpoint (implementation PR — açık onay)

- [ ] İmzalı release APK cihaza kuruldu
- [ ] Smart Feed prod HTTPS endpoint’e bağlandı
- [ ] Logcat FATAL yok
- [ ] Feed ekranı açılıyor (remote kapalıysa local RSS fallback davranışı belgelenir)

**Not:** Plan PR’da cihaz smoke **yapılmaz** — hostname yok.

---

## 7. B5 PASS kriterleri

B5 **yalnızca** aşağıdaki maddelerin tamamı gerçek evidence ile karşılandığında kapanır:

| # | Kriter | Mevcut (PR #50 sonrası) |
|---|--------|-------------------------|
| 1 | Gerçek prod hostname belirlenmiş | **PENDING** — `TBD` |
| 2 | DNS resolve oluyor | **PENDING** |
| 3 | TLS aktif (443) | **PENDING** |
| 4 | Sertifika domain ile eşleşiyor | **PENDING** |
| 5 | Sertifika süresi geçerli | **PENDING** |
| 6 | `GET /health` HTTPS 200 | **PENDING** |
| 7 | `GET /api/v1/smart-feed` HTTPS 200 (ops kararı) | **PENDING** |
| 8 | Android release build HTTPS base URL ile üretilebiliyor | **PENDING** |
| 9 | Prod cleartext kapalı (Android) | **PASS** — PR #47 |
| 10 | Mobil secret / API / LLM key yok | **PASS** — audit |
| 11 | Evidence dosyası gerçek terminal çıktılarıyla güncellenmiş | **PENDING** |

**Resmi etiket (şu an):** `B5_STATUS=PROD_HTTPS_PENDING`  
**`B5_STATUS=PASS_READY` bu PR’da yazılmaz.**

---

## 8. Rollback planı

Implementation sırasında veya sonrasında sorun çıkarsa:

| Adım | Aksiyon |
|------|---------|
| DNS | A/AAAA kaydını eski hedefe döndür veya kaydı kaldır (TTL bekle) |
| Reverse proxy | Önceki config snapshot’ına dön (`Caddyfile`, `nginx.conf`, LB listener) |
| TLS | Eski sertifika / önceki cert pair’e geri (kısa süreli) |
| API deploy | Önceki container/image revision |
| Android release URL | `-PprodSmartFeedBaseUrl=` boş bırak → remote feed kapalı (güvenli varsayılan) |
| Smart Feed kill | Backend feature flag veya proxy route disable (ops kararı) |
| Play | Submission durdur; hotfix track’e alınmadan önce B5 evidence yeniden doğrula |

Rollback sonrası evidence: `curl -Iv https://<prod-host>/health` tekrar + incident notu.

---

## 9. Açık onay gerektiren işler

Aşağıdakiler **bu plan PR’da yapılmaz**; implementation PR veya operasyon ticket’ında **açık onay** gerekir:

| # | İş | Onay |
|---|-----|------|
| 1 | DNS kaydı oluşturma / değiştirme | DevOps + ürün |
| 2 | TLS / reverse proxy config değiştirme | DevOps |
| 3 | Prod API deploy / scaling | DevOps |
| 4 | Release build’i gerçek prod host ile üretme | Release manager |
| 5 | Smart Feed’i prod’da etkinleştirme (remote feed açık) | Ürün + legal teyit |
| 6 | Play Console submission | Ürün + compliance |
| 7 | HSTS / certificate pinning (opsiyonel) | Güvenlik teyit |

---

## 10. Sertifika yenileme stratejisi (implementation seçimine göre)

| Yöntem | Yenileme | Monitoring |
|--------|----------|------------|
| Caddy | Otomatik ACME | Log + 30 gün öncesi alert |
| certbot + nginx | Cron `certbot renew` + reload | Cron success mail / uptime check |
| Cloud managed | Provider auto-renew | Cloud console expiry alert |
| Cloudflare | Edge cert auto | CF dashboard |

**Minimum:** Sertifika bitişinden **≥ 14 gün önce** uyarı; renewal failure runbook.

---

## 11. Sonraki PR

| PR | Kapsam | Canlı etki |
|----|--------|------------|
| **`ops/prod-https-tls-implementation-v0`** | DNS, TLS termination, deploy, HTTPS smoke evidence, release `-PprodSmartFeedBaseUrl` | **EVET — açık onay zorunlu** |

Implementation PR çıktıları:

- `evidence/play/prod-https-tls-implementation-v0.md` (gerçek `curl` / `openssl` çıktıları)
- Onaylı `PROD_HOSTNAME` değeri
- B5 PASS kriterleri tablosunun güncellenmesi (yalnızca kanıt varsa)

**Paralel (ops’tan bağımsız, düşük risk):**

- `docs/play-kvkk-readiness-b5-refresh-v0` — `play-kvkk-readiness-v0.md` B5 maddesi PR #47 sonrası gerçeğe çekme

**B5 kapandıktan sonra:**

- Source Registry SSOT v0

---

## 12. Doğrulama (bu plan PR)

| Kontrol | Sonuç |
|---------|--------|
| Canlı DNS/TLS/deploy | **Yapılmadı** |
| Kod değişti mi | **Hayır** |
| Manifest/Gradle/XML değişti mi | **Hayır** |
| Test çalıştırıldı mı | **Hayır** — docs/evidence-only plan PR, runtime değişikliği yok |
| Browser/device smoke | **Yapılmadı** — canlı hostname yok; bu PR canlı değişiklik içermiyor |
| Sahte prod URL | **Kullanılmadı** |
| `B5_STATUS` | **`PROD_HTTPS_PENDING`** |

---

## Riskler (plan PR)

| Risk | Seviye | Kontrol |
|------|--------|---------|
| Plan PR’ında yanlışlıkla prod değişikliği | Orta | DNS/deploy/config yasak — bu PR uyumlu |
| Sahte hostname | Orta | `TBD` / `TEYİT GEREKİR` |
| B5 yanlış PASS | Orta/Yüksek | `PROD_HTTPS_PENDING` korundu |
| Play/KVKK scope karışması | Düşük | Yalnız ops plan |

---

## Merge önerisi

**Ready for review** — operasyon sözleşmesi; canlı etki yok; B5 kapatmaz.
