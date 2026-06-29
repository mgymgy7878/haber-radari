# Prod HTTPS / TLS Ops Readiness (v0)

**Branch:** `docs/prod-https-tls-ops-readiness-v0`  
**PR title:** `docs: add prod HTTPS TLS ops readiness evidence`  
**Date:** 2026-06-29  
**Önceki adım:** PR #47 merged (`c495582`) — Android release cleartext hardening

---

## Amaç

B5 formal kapanışı için kalan **prod HTTPS URL + TLS ops** boşluğunu kanıtlı şekilde görünür kılmak. Bu belge **canlı deploy yapmaz**; DNS/reverse proxy değiştirmez; sahte prod URL uydurmaz.

---

## PR #47 sonrası current state (Android)

| Kontrol | Durum | Kaynak |
|---------|--------|--------|
| Release `usesCleartextTraffic=true` | **Yok** | `release-https-cleartext-hardening-v0.md` |
| Release `networkSecurityConfig` | **Var** | Main manifest + NSC |
| Release NSC global cleartext | **Deny** | `network_security_config.xml` |
| Release `BuildConfig.SMART_FEED_BASE_URL` (varsayılan) | `""` | `build.gradle.kts` release |
| Release config `http://` hardcode | **Yok** | Gradle + FeatureConfig guard |
| Debug local HTTP | **Debug-only** | `127.0.0.1` / `localhost` / `10.0.2.2` NSC |
| Mobil API/LLM key APK içinde | **Yok** | Repo taraması |

**B5 cleartext hardening:** `DONE` (Android APK/config tarafı)

---

## Prod HTTPS URL — repo taraması

**Tarih:** 2026-06-29

| Arama | Sonuç |
|-------|--------|
| `prodSmartFeedBaseUrl` | Yalnızca `apps/android/app/build.gradle.kts` (Gradle property; değer repoda yok) |
| `SMART_FEED_BASE_URL` | Debug: `http://127.0.0.1:3001`; Release: boş veya build-time `-P` |
| `PUBLIC_API` / `API_HOST` / prod domain | **Tanımlı değil** |
| `.env` / secrets prod HTTPS host | **Yok** (yalnızca dev `EXPO_PUBLIC_API_URL` örnekleri) |
| nginx / Caddy / reverse proxy config | **Repo'da yok** |
| `play-kvkk-readiness-v0.md` Q6 | **Açık:** "Production API hostname ve TLS sertifikası — DevOps" |

### Sonuç

| Soru | Cevap |
|------|--------|
| **Gerçek prod HTTPS API URL var mı?** | **HAYIR** — repoda kayıtlı prod hostname yok |
| Sahte URL kullanıldı mı? | **HAYIR** — `https://example.com` yalnızca PR #47 HTTPS guard doğrulamasında kullanıldı; prod evidence sayılmaz |

---

## TLS / reverse proxy evidence

| Kontrol | Durum |
|---------|--------|
| TLS sertifika provisioning (ops) | **YOK** |
| Reverse proxy config (Caddy/nginx/Cloud LB) | **YOK** (repo + bu audit) |
| `curl -Iv https://<prod-host>/health` | **ÇALIŞTIRILMADI** — prod host bilinmiyor |
| API native TLS (`server.ts`) | **YOK** — `HOST=0.0.0.0`, HTTP port 3001 (dev); TLS ops katmanında beklenir |

---

## Endpoint doğrulama

### Prod HTTPS (hedef)

| Endpoint | Sonuç |
|----------|--------|
| `GET https://<PROD_HOST>/health` | **PENDING** — prod host yok |
| `GET https://<PROD_HOST>/api/v1/smart-feed?...` | **PENDING** — prod host yok |

### Dev HTTP (karşılaştırma — prod evidence DEĞİL)

Yerel geliştirme API çalışıyorsa HTTP üzerinden smoke alınabilir; Play/B5 prod kapanışı için **sayılmaz**.

| Endpoint | Protokol | Sonuç (2026-06-29) | Not |
|----------|----------|-------------------|-----|
| `/health` | `http://127.0.0.1:3001` | **200** | Dev-only; cleartext |
| `/api/v1/smart-feed` | `http://127.0.0.1:3001` | **Doğrulanmadı** (bu PR'da zorunlu değil) | Prod HTTPS pending |

---

## Release build — gerçek HTTPS URL

| Adım | Durum |
|------|--------|
| `./gradlew :app:assembleRelease -PprodSmartFeedBaseUrl=https://<GERÇEK_HOST>` | **ÇALIŞTIRILMADI** — gerçek host yok |
| Release APK + gerçek prod URL cihaz smoke | **PENDING** |
| Release imza / Play track | **PENDING** (ops) |

Gradle mekanizması hazır (PR #47); prod hostname atanana kadar release remote feed kapalı kalır (`SMART_FEED_BASE_URL=""` → `aiRemoteFeedEnabled=false`).

---

## Release cleartext durumu (PR #47 devralındı)

| Kontrol | Durum |
|---------|--------|
| Merged release manifest `usesCleartextTraffic=true` | **Yok** |
| Release config `http://` | **Yok** (varsayılan boş URL) |
| Play cleartext blocker (APK) | **Teknik olarak adreslendi** |

---

## Mobil API / LLM key

| Kontrol | Sonuç |
|---------|--------|
| Android APK içinde API key | **Yok** |
| Android APK içinde LLM key | **Yok** |
| Bu PR'da secret eklendi mi? | **Hayır** |

---

## B5 durumu

| Katman | Durum |
|--------|--------|
| Android release cleartext hardening | **DONE** (PR #47) |
| Prod HTTPS URL tanımı | **PENDING** |
| TLS / reverse proxy ops | **PENDING** |
| `/health` HTTPS prod evidence | **PENDING** |
| smart-feed HTTPS prod evidence | **PENDING** |
| Release build gerçek HTTPS URL evidence | **PENDING** |
| Play formal B5 PASS | **PENDING** |

### Resmi etiket

**`B5 PROD_HTTPS_PENDING`**

*(“B5 kapandı” veya “READY_FOR_PLAY_REVIEW” yazılmaz — prod host/TLS kanıtı yok.)*

---

## Kalan blocker listesi (sıralı)

1. **Prod API hostname kararı** — DevOps / ürün (Q6)
2. **TLS termination** — reverse proxy veya cloud LB + geçerli sertifika
3. **`/health` HTTPS 200** evidence — prod host üzerinde
4. **`/api/v1/smart-feed` HTTPS 200** evidence — prod host üzerinde
5. **Release build** — `-PprodSmartFeedBaseUrl=https://<GERÇEK_HOST>` + BuildConfig doğrulama
6. **Release cihaz smoke** (imzalı APK) — prod HTTPS feed
7. **Play Data Safety / network security** — prod evidence ile güncelleme
8. **Ops runbook** — sertifika yenileme, HSTS (ops belgesi)

---

## Sonraki PR önerisi (deploy öncesi)

**`ops/prod-https-tls-implementation-v0`** (ayrı PR, canlı etki):

- Gerçek hostname seçildikten sonra
- Reverse proxy/TLS provisioning (ops repo veya infra)
- HTTPS smoke evidence (`curl -Iv`, `/health`, smart-feed)
- Release build gerçek URL ile
- `play-kvkk-readiness-v0.md` B5 güncellemesi

**Paralel düşük risk:** Room seed refresh policy (teknik borç, Play blocker değil)

---

## Bu PR kapsamı

| Yapıldı | Yapılmadı |
|---------|-----------|
| Repo audit + evidence | Canlı deploy |
| B5 gap netleştirme | DNS değişikliği |
| Dev HTTP `/health` notu (prod değil) | Reverse proxy config |
| | Play submission |
| | Sahte prod URL |
| | API/Android runtime değişikliği |
| | Manifest/Gradle değişikliği |

---

## Doğrulama komutları (prod host hazır olunca)

```bash
# TLS handshake + health (GERÇEK_HOST değiştir)
curl -Iv https://GERÇEK_HOST/health
curl -s https://GERÇEK_HOST/health

# Smart feed
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://GERÇEK_HOST/api/v1/smart-feed?includeWatchlist=1&includeLatest=1"

# Android release (GERÇEK_HOST değiştir)
cd apps/android
./gradlew :app:assembleRelease -PprodSmartFeedBaseUrl=https://GERÇEK_HOST
rg "SMART_FEED_BASE_URL" app/build/generated/source/buildConfig/release/
```

---

## Merge önerisi

**Ready** — salt okunur evidence/docs; canlı etki yok; B5'i kapatmaz, kalan boşluğu kanıtlar.
