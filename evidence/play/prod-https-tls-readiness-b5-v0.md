# Prod HTTPS / TLS Readiness — B5 Audit (v0)

**Branch:** `docs/prod-https-tls-readiness-b5-v0`  
**PR title:** `docs: prod HTTPS TLS readiness B5 audit evidence`  
**Base commit (audit):** `a87ec4b` (PR #49 merged)  
**Date:** 2026-06-29  
**Tür:** Salt okunur repo audit + evidence — **canlı deploy/DNS/TLS değişikliği yok**

---

## Executive summary

| Alan | Sonuç |
|------|--------|
| **`B5_STATUS`** | **`PROD_HTTPS_PENDING`** |
| Prod host repoda tanımlı mı? | **Hayır** |
| Prod HTTPS/TLS erişilebilir mi? | **Doğrulanamadı** — hostname yok |
| Android release cleartext | **Kapalı** (PR #47 — config tarafı DONE) |
| Debug cleartext istisnası prod’a sızıyor mu? | **Hayır** — debug source set only |
| Mobil API/LLM key | **Yok** |
| Kod değişti mi (bu PR)? | **Hayır** |
| Play publish blocker | **Aktif** — prod host + TLS kanıtı gerekli |

**Net hüküm:** Android APK/network config tarafında cleartext hardening tamamlandı (PR #47). B5 formal kapanışı için **prod API hostname + TLS termination + HTTPS smoke evidence** hâlâ eksik. Sahte PASS yazılmaz.

**İlgili önceki evidence:** PR #47 `evidence/compliance/release-https-cleartext-hardening-v0.md`, PR #48 `evidence/compliance/prod-https-tls-ops-readiness-v0.md`

---

## Play B5 kararı

```
B5_STATUS=PROD_HTTPS_PENDING
```

| B5 alt bileşeni | Durum |
|-----------------|--------|
| Release cleartext hardening (Android) | **DONE** — PR #47 |
| Prod HTTPS API hostname | **PENDING** |
| TLS sertifika / reverse proxy ops | **PENDING** |
| `GET https://<PROD_HOST>/health` evidence | **PENDING** |
| `GET https://<PROD_HOST>/api/v1/smart-feed` evidence | **PENDING** |
| Release build gerçek `-PprodSmartFeedBaseUrl=https://...` evidence | **PENDING** |
| Play formal B5 PASS | **PENDING** |

---

## İncelenen dosyalar

| Dosya | Bulgu |
|-------|--------|
| `apps/android/app/src/main/AndroidManifest.xml` | `usesCleartextTraffic` yok; `networkSecurityConfig="@xml/network_security_config"` |
| `apps/android/app/src/main/res/xml/network_security_config.xml` | Global `cleartextTrafficPermitted="false"` |
| `apps/android/app/src/debug/res/xml/network_security_config.xml` | Base deny + `domain-config` yalnızca `127.0.0.1`, `localhost`, `10.0.2.2` |
| `apps/android/app/build.gradle.kts` | Debug: `http://127.0.0.1:3001`; Release: `prodSmartFeedBaseUrl` Gradle property (repoda değer yok → `""`) |
| `apps/android/app/src/main/java/com/haberradari/config/FeatureConfig.kt` | Release: yalnızca HTTPS veya boş URL; `assertReleaseSmartFeedUrlPolicy()` |
| `apps/android/app/src/main/java/com/haberradari/HaberRadariApp.kt` | Startup’ta release URL policy guard |
| `apps/android/app/src/test/java/com/haberradari/config/ReleaseNetworkSecurityHardeningTest.kt` | Manifest/NSC/Gradle policy unit testleri |
| `apps/api/src/server.ts` | HTTP `0.0.0.0:3001` (dev); native TLS yok — TLS ops katmanında beklenir |
| `docs/compliance/play-kvkk-readiness-v0.md` | B5 maddesi **eski** (`usesCleartextTraffic=true` — PR #47 öncesi); ayrı docs güncelleme PR önerilir |

---

## 1. Prod host durumu

### Repo / config taraması (2026-06-29)

| Arama | Sonuç |
|-------|--------|
| `prodSmartFeedBaseUrl` | Yalnızca `build.gradle.kts` + test/error string — **değer repoda kayıtlı değil** |
| `SMART_FEED_BASE_URL` (release varsayılan) | `""` (boş) |
| `PUBLIC_API` / `API_HOST` / prod domain env | **Tanımlı değil** |
| nginx / Caddy / reverse proxy config | **Repo’da yok** |
| `.env` prod HTTPS host | **Yok** |
| `play-kvkk-readiness-v0.md` Q6 | Açık: “Production API hostname ve TLS sertifikası — DevOps” |

### Sonuç

| Soru | Cevap |
|------|--------|
| **Gerçek prod HTTPS API hostname var mı?** | **HAYIR** |
| Prod host biliniyor mu? | **HAYIR** — DevOps/ürün kararı bekleniyor |
| Sahte prod URL kullanıldı mı? | **HAYIR** — `api.example.com` yalnızca Gradle yorum/test guard |

---

## 2. HTTPS / TLS durumu

### Prod HTTPS terminal kontrolleri

| Kontrol | Sonuç |
|---------|--------|
| `curl -I https://<prod-host>/health` | **YAPILAMADI** — prod host bilinmiyor |
| `openssl s_client -connect <prod-host>:443 -servername <prod-host>` | **YAPILAMADI** — prod host bilinmiyor |
| TLS sertifika issuer / expiry | **BELGELENMEDİ** |
| Sertifika domain eşleşmesi (SAN/CN) | **BELGELENMEDİ** |
| Reverse proxy / TLS termination config | **YOK** (repo + ops) |

### Dev HTTP (prod evidence DEĞİL)

| Kontrol | Sonuç | Not |
|---------|--------|-----|
| `curl http://127.0.0.1:3001/health` | **200** (audit anında API çalışıyordu) | Dev-only HTTP cleartext; **B5 kapanış sayılmaz** |

**Browser/terminal HTTPS check:** Prod host bilinmediği için **yapılamadı**.

---

## 3. Cleartext prod / debug ayrımı

| Build | `usesCleartextTraffic` | NSC | Smart Feed URL | Remote feed |
|-------|------------------------|-----|----------------|-------------|
| **Release / main** | Yok (manifest) | Global deny | `""` veya build-time `-PprodSmartFeedBaseUrl=https://...` | Yalnızca HTTPS URL varsa |
| **Debug** | Yok (manifest) | Base deny + localhost domain-config | `http://127.0.0.1:3001` | Açık (local dev) |

### Prod cleartext sonucu

| Kontrol | Sonuç |
|---------|--------|
| Main manifest `usesCleartextTraffic="true"` | **Yok** |
| Main NSC global cleartext | **Kapalı** (`cleartextTrafficPermitted="false"`) |
| Release Gradle `http://` hardcode | **Yok** |
| Debug istisnası release APK’ya sızıyor mu? | **Hayır** — `src/debug/res/xml/` overlay yalnızca debug variant |

**Cleartext prod:** **Kapalı** (Android config — PR #47)  
**Cleartext debug:** **Sınırlı localhost istisnası** (geliştirme)

---

## 4. Prod API / base URL kaynağı

| Katman | Kaynak | Release davranışı |
|--------|--------|-------------------|
| Android Smart Feed | `BuildConfig.SMART_FEED_BASE_URL` ← `build.gradle.kts` `-PprodSmartFeedBaseUrl` | Boş → `aiRemoteFeedEnabled=false` |
| Android RSS (yerel) | Room seed + doğrudan HTTPS RSS URL’leri | Cleartext API değil; feed URL’leri HTTPS |
| API backend | `apps/api` Fastify HTTP `:3001` | Prod’da reverse proxy TLS beklenir |

Release remote Smart Feed **prod hostname olmadan kapalı** kalır — bilinçli güvenli varsayılan.

---

## 5. Mobil secret / API key denetimi

| Kontrol | Sonuç |
|---------|--------|
| Android `app/src/main` API key / LLM key / token | **Bulunamadı** |
| `BuildConfig` secret alanı | **Yok** |
| Backend-only env (`LLM_DIGEST_API_KEY` vb.) | Server-side; APK’ya gömülmez |
| Bu PR’da secret eklendi mi? | **Hayır** |

---

## 6. Unit test / build (audit PR)

| Suite | Çalıştırıldı mı? | Sonuç |
|-------|------------------|--------|
| `:app:testDebugUnitTest` | **Hayır** | Docs/evidence-only PR — kod değişmedi |
| `:app:assembleDebug` | **Hayır** | Kod değişmedi — zorunlu değil |
| Room migration test | **Yok** | — |
| `ReleaseNetworkSecurityHardeningTest` (main’de mevcut) | Referans | PR #47’de PASS |

---

## Riskler

| Risk | Seviye | Not |
|------|--------|-----|
| Canlı altyapıya yanlış müdahale | Orta/Yüksek | Bu PR’da yapılmadı |
| Prod host hazır değilken B5 PASS yazmak | Yüksek | **Kaçınıldı** — `PROD_HTTPS_PENDING` |
| `play-kvkk-readiness-v0.md` B5 maddesi eski | Orta | PR #47 sonrası güncellenmeli (ayrı docs PR) |
| SSOT ertelenmesi | Düşük/Orta | Bilinçli sıra — B5 sonrası |
| Release imzalı APK prod smoke eksik | Orta | Host + TLS sonrası |

---

## B5 kapanışı için next actions (sıralı)

1. **Prod API hostname kararı** — DevOps / ürün (ör. `api.haberradari...`)
2. **TLS termination** — reverse proxy (Caddy/nginx/Cloud LB) + geçerli sertifika
3. **HTTPS smoke evidence:**
   - `curl -Iv https://<PROD_HOST>/health` → 200
   - `curl -Iv https://<PROD_HOST>/api/v1/smart-feed?...` → 200
   - `openssl s_client` — issuer, expiry, SAN/CN eşleşmesi
4. **Release build:** `./gradlew :app:assembleRelease -PprodSmartFeedBaseUrl=https://<PROD_HOST>`
5. **Release cihaz smoke** — imzalı APK + prod HTTPS feed
6. **`play-kvkk-readiness-v0.md` B5 güncelleme** — cleartext DONE + prod TLS evidence
7. **Sonraki mimari PR:** Source Registry SSOT v0 (B5 kapandıktan sonra)

Önerilen implementasyon PR: `ops/prod-https-tls-implementation-v0` (canlı etki — ayrı onay)

---

## Doğrulama (prod host hazır olunca)

```bash
# TLS + health (GERÇEK_HOST değiştir)
curl -Iv https://GERÇEK_HOST/health
openssl s_client -connect GERÇEK_HOST:443 -servername GERÇEK_HOST </dev/null

# Smart feed
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://GERÇEK_HOST/api/v1/smart-feed?includeWatchlist=1&includeLatest=1"

# Android release BuildConfig
cd apps/android
./gradlew :app:assembleRelease -PprodSmartFeedBaseUrl=https://GERÇEK_HOST
rg "SMART_FEED_BASE_URL" app/build/generated/source/buildConfig/release/
```

---

## Değişiklik sınırı teyidi

| Alan | Değişti mi? |
|------|-------------|
| Android runtime kodu | **Hayır** |
| Manifest / Gradle / NSC XML | **Hayır** |
| API runtime | **Hayır** |
| Source Registry | **Hayır** |
| Publish gate | **Açılmadı** |
| Bu PR dosyaları | Yalnızca `evidence/play/prod-https-tls-readiness-b5-v0.md` |

---

## Merge önerisi

**Ready for review** — salt okunur B5 audit; canlı etki yok; B5’i kapatmaz, blocker’ı kanıtlar.
