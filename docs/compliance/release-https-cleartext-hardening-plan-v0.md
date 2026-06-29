# Release HTTPS / Cleartext Hardening Plan v0

> **Bu belge uygulama planı taslağıdır; B5 blocker’ı kapatmaz.**  
> **Bu PR’da manifest, Gradle veya runtime config değişikliği yapılmamıştır.**  
> **Yayın öncesi engineering + ops + hukuk teyidi gerekir.**

**Sürüm:** v0  
**Son güncelleme:** 2026-06-29  
**Blocker:** B5 **OPEN** — plan prepared, implementation pending

---

## 1. Current state

### 1.1 Repo scan özeti (2026-06-29)

| Bulgu | Dosya | Satır / değer | Risk |
|-------|-------|---------------|------|
| `usesCleartextTraffic="true"` | `apps/android/app/src/main/AndroidManifest.xml` | L15, `<application>` | **B5 OPEN** — tüm build type’lara uygulanır |
| `networkSecurityConfig` | — | Yok | Release için explicit HTTPS policy yok |
| Debug manifest overlay | — | Yok (`src/debug/AndroidManifest.xml` yok) | Debug/release ayrımı yok |
| `smartFeedBaseUrl` | `FeatureConfig.kt` | `http://127.0.0.1:3001` | HTTP hardcoded; build-type ayrımı yok |
| Release `buildTypes` | `app/build.gradle.kts` | Yalnızca `release { }` | Debug default + release aynı manifest |
| API sunucu | `apps/api/src/server.ts` | `HOST=0.0.0.0`, HTTP | TLS termination yok (ops katmanında beklenir) |
| Mobil API key | Android APK | Yok | PASS — değişmez |

### 1.2 Cleartext/HTTP referansları (ürün kritik)

```
apps/android/app/src/main/AndroidManifest.xml:15
  android:usesCleartextTraffic="true"

apps/android/app/src/main/java/.../FeatureConfig.kt:40
  var smartFeedBaseUrl: String = "http://127.0.0.1:3001"

apps/android/app/build.gradle.kts
  buildTypes { release { ... } }  // cleartext override yok
```

**Not:** Test fixture’larındaki `http://example.com` ve XML namespace `http://schemas.android.com` cleartext riski değildir.

### 1.3 B5 durumu

| Alan | Durum |
|------|--------|
| B5 HTTPS / cleartext | **OPEN** |
| Play/KVKK readiness | [play-kvkk-readiness-v0.md](./play-kvkk-readiness-v0.md) § Network security |
| Data Safety draft | Transit encryption: debug cleartext → release HTTPS hedefi |

---

## 2. Target state

### 2.1 Release / production

| Hedef | Açıklama |
|-------|----------|
| Cleartext kapalı | `usesCleartextTraffic=false` (veya attribute kaldırılmış + NSC default deny) |
| HTTPS zorunlu | `smartFeedBaseUrl` yalnızca `https://` |
| Network Security Config | `cleartextTrafficPermitted="false"` base-config |
| API endpoint | Production hostname + geçerli TLS sertifikası (reverse proxy veya native TLS) |
| Mobil secret | API/LLM key APK’da yok (mevcut ilke korunur) |

### 2.2 Debug / local development

| Hedef | Açıklama |
|-------|----------|
| Kontrollü istisna | Yalnızca **debug** build type |
| Localhost cleartext | `127.0.0.1` / `10.0.2.2` (emulator) domain-config ile sınırlı |
| adb reverse | Fiziksel cihaz: `adb reverse tcp:3001 tcp:3001` (mevcut workflow) |
| Release’e sızma yok | Debug NSC / manifest overlay release APK’ya dahil olmamalı |

### 2.3 Backend / ops

| Katman | Hedef |
|--------|--------|
| Production API | HTTPS termination (Caddy, nginx, cloud LB) |
| Dev API | HTTP `localhost:3001` kabul edilebilir (release APK bağlanmamalı) |
| HSTS / sertifika yenileme | Ops runbook (ayrı belge) |

---

## 3. Implementation plan (sonraki PR)

> **PR adı önerisi:** `fix(android): release HTTPS cleartext hardening v0`  
> Bu bölüm **gelecek PR** içindir; bu belgede uygulanmaz.

### 3.1 Dosya değişiklikleri (önerilen)

| # | Dosya | Değişiklik |
|---|-------|------------|
| 1 | `app/src/main/res/xml/network_security_config.xml` | **Yeni** — base: cleartext false |
| 2 | `app/src/debug/res/xml/network_security_config.xml` veya debug manifest | Localhost cleartext istisnası |
| 3 | `app/src/main/AndroidManifest.xml` | `usesCleartextTraffic` kaldır; `networkSecurityConfig` ekle |
| 4 | `app/src/debug/AndroidManifest.xml` | **Yeni** — debug-only `usesCleartextTraffic=true` (alternatif yaklaşım) |
| 5 | `app/build.gradle.kts` | `buildConfigField` — `SMART_FEED_BASE_URL` debug vs release |
| 6 | `FeatureConfig.kt` | Release: `BuildConfig.SMART_FEED_BASE_URL`; debug fallback |
| 7 | `docs/ops/` veya README | Production API URL + TLS notu |
| 8 | `play-kvkk-readiness-v0.md` | B5 → PASS (yalnızca implementation + doğrulama sonrası) |

**Yaklaşım seçimi (implementation PR’da karar):**

- **A (önerilen):** NSC base deny + debug `domain-config` localhost  
- **B:** `src/debug/AndroidManifest.xml` overlay ile cleartext yalnızca debug  

Her iki yaklaşımda **release APK** cleartext içermemeli.

### 3.2 Release / debug ayrımı

```text
debug build:
  BuildConfig.SMART_FEED_BASE_URL = "http://127.0.0.1:3001"
  NSC: cleartext permitted for 127.0.0.1, 10.0.2.2 (emulator)

release build:
  BuildConfig.SMART_FEED_BASE_URL = "https://api.example.com"  // placeholder
  NSC: cleartextTrafficPermitted=false (global)
  Manifest: no usesCleartextTraffic=true
```

### 3.3 Test plan (implementation PR)

| Test | Amaç |
|------|------|
| `./gradlew :app:testDebugUnitTest` | Mevcut unit testler PASS |
| `./gradlew :app:assembleDebug` | Debug localhost hâlâ çalışır |
| `./gradlew :app:assembleRelease` | Release APK manifest/NSC doğrulama |
| Manifest merge inspect | Release artifact’ta cleartext yok |
| Lint / `aapt dump badging` | `usesCleartextTraffic` release’de false/absent |
| Ops smoke | `curl https://<prod-host>/health` |

### 3.4 APK / cihaz smoke zamanlaması

| Ne zaman | Kim |
|----------|-----|
| Implementation PR merge sonrası | Debug APK — PR #36 benzeri smoke (adb reverse) |
| Release APK smoke | Staging HTTPS endpoint hazır olunca |
| **Bu plan PR’ında** | APK build / adb / cihaz test **YOK** |

PR #36 (aiSummary fallback) bu plandan **ayrı** kalır; karıştırılmamalı.

---

## 4. Acceptance criteria (implementation PR için)

- [ ] Release merged manifest: `usesCleartextTraffic` false veya yok  
- [ ] Release NSC: global cleartext denied  
- [ ] `FeatureConfig` / `BuildConfig` release URL `https://` only  
- [ ] HTTP endpoint release build’de hardcoded kalmamış  
- [ ] Debug build: localhost cleartext yalnızca debug scope  
- [ ] Mobile API/LLM key scan PASS (değişmez)  
- [ ] Play/KVKK readiness + Data Safety transit encryption tutarlı  
- [ ] Evidence: release APK manifest dump veya lint çıktısı  
- [ ] B5 checklist maddesi PASS (implementation + review sonrası)

---

## 5. Non-goals (bu plan PR)

- Manifest / Gradle / XML değişikliği  
- APK build (`assembleDebug` / `assembleRelease`)  
- `adb reverse`, cihaz kurulumu, screenshot  
- B5 blocker kapanışı  
- Production TLS sertifikası provisioning  
- Backend `server.ts` native TLS (ops reverse proxy yeterli olabilir)

---

## 6. Risks

| Risk | Mitigasyon |
|------|------------|
| Cleartext release’e sızar | NSC + ayrı debug manifest; release artifact inspect |
| Debug workflow kırılır | Debug NSC localhost exception; PR #36 smoke |
| Yanlış production URL | BuildConfig + staging smoke |
| Data Safety tutarsızlığı | data-safety-draft-v0 transit row güncelle |
| Plan PR’da kod değişimi | Bu PR docs-only gate |

---

## 7. İlişkili belgeler

| Belge | Rol |
|-------|-----|
| [play-kvkk-readiness-v0.md](./play-kvkk-readiness-v0.md) | B5 blocker SSOT |
| [data-safety-draft-v0.md](./data-safety-draft-v0.md) | Transit encryption |
| [privacy-policy-draft-v0.md](./privacy-policy-draft-v0.md) | Security practices § |
| [Evidence](../../evidence/compliance/release-https-cleartext-hardening-plan-v0.md) | Scan + gate |

---

## 8. Hukuk / Play teyidi (implementation sonrası)

1. Data Safety “data encrypted in transit” beyanı  
2. Privacy Policy security practices bölümü  
3. Production hosting jurisdiction (KVKK aktarım)  

---

## Revizyon

| Sürüm | Tarih | Not |
|-------|-------|-----|
| v0 | 2026-06-29 | İlk plan — docs-only |
