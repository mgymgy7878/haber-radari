# Haber Radarı

Kişisel **önemli gelişme radarı** — reklam, clickbait ve ilgisiz haberleri filtreleyen, **metadata tabanlı** haber akışı.

## Aktif ürün hattı (SSOT)

| Bileşen | Konum | Rol |
|---------|-------|-----|
| **Native Android client** | `apps/android` | Aktif mobil istemci — Smart Feed tüketir, LLM çağrısı yapmaz |
| **Smart Feed backend** | `apps/api` | RSS ingest → cluster → publish gate → smart digest → JSON API |
| **Shared packages** | `packages/news-core`, `packages/connectors` | Policy, skorlama, connector sınırları |

**Veri akışı:**

```
RSS kaynakları → cluster engine → publish gate → smart digest (backend-only) → GET /api/v1/smart-feed → Android UI
```

### Güvenlik sınırları (Smart Digest)

- LLM **yalnızca backend** tarafında; Android'de API key **yok**
- Gerçek external LLM çağrısı **varsayılan kapalı** (`LLM_DIGEST_EXTERNAL_ENABLED=0`)
- Operatör onayı olmadan external digest yapılmaz
- Tam haber metni / scraping **yok** — yalnızca metadata (`title`, `shortDescription`, `sourceName`, `originalUrl`, …)
- Prompt/response log **varsayılan kapalı**

Gerçek provider pilotu ayrı operasyonel onay gerektirir. Bkz. [Provider pilot runbook](docs/ops/v0.6.4-real-provider-pilot-runbook.md).

## Legacy / ikincil hatlar

| Bileşen | Konum | Durum |
|---------|-------|-------|
| **Expo React Native** | `apps/mobile` | Legacy MVP — Radar API (`/api/events`, sosyal sinyaller). Aktif ürün geliştirmesi burada değil |
| **Radar / events API** | `apps/api` (`/api/events`, …) | Eski connector tabanlı radar hattı; Smart Feed ile paralel, birincil ürün değil |

Yeni özellikler **Android + Smart Feed** hattına eklenir.

## Monorepo yapısı

```
haber-radari/
├── apps/android/       Native Android (Kotlin / Compose) — aktif client
├── apps/api/           Fastify API — Smart Feed + Smart Digest
├── apps/mobile/        Expo RN — legacy MVP
├── packages/news-core/ Policy, skorlama
├── packages/connectors/ TRT RSS, GDELT, sosyal adapter sınırları
├── docs/               Architecture, ops, product specs
└── evidence/           Faz kanıtları (evidence/README.md)
```

## Gereksinimler

- Node.js 20+
- pnpm 9+
- Android Studio / JDK 17+ (native client için)

## Hızlı başlangıç

### Backend (Smart Feed API)

```powershell
cd apps/api
pnpm install
pnpm build
pnpm start
```

Geliştirme modu: repo kökünden `pnpm dev:api`

**Operatör status (read-only, secret döndürmez):**

```powershell
cd apps/api
pnpm smart-digest:status
# veya HTTP: GET http://127.0.0.1:3001/api/v1/smart-digest/status
```

### Android (native client)

```powershell
cd apps/android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME="C:\Users\mscor\AppData\Local\Android\Sdk"
.\gradlew.bat testDebugUnitTest
.\gradlew.bat installDebug
```

**Emülatör / cihaz → localhost API:**

```powershell
adb reverse tcp:3001 tcp:3001
```

| Ortam | API URL |
|-------|---------|
| PC / curl | `http://127.0.0.1:3001` |
| Android (adb reverse sonrası) | `http://127.0.0.1:3001` |
| Android emülatör (reverse yok) | `http://10.0.2.2:3001` |

### Legacy Expo mobile (opsiyonel)

```powershell
pnpm dev:mobile
# EXPO_PUBLIC_API_URL=http://<LAN-IP>:3001
```

## Birincil API uçları (Smart Feed hattı)

| Uç | Açıklama |
|-----|----------|
| `GET /api/v1/smart-feed` | AI-curated feed (RSS → cluster → publish gate → digest) |
| `GET /api/v1/smart-digest/status` | Read-only operatör dashboard (budget, gates; **API key değeri dönmez**) |
| `GET /health` | Sağlık kontrolü |

Smart Feed contract: [docs/architecture/smart-feed-api-contract-v0.md](docs/architecture/smart-feed-api-contract-v0.md)

## Smart Digest ortam değişkenleri

Şablon: `apps/api/.env.example` — **asla commit edilmez**, yalnızca local `.env` için referans.

| Değişken | Açıklama |
|----------|----------|
| `LLM_DIGEST_ENABLED` | Digest pipeline açık/kapalı |
| `LLM_DIGEST_PROVIDER` | `mock` veya `external` |
| `LLM_DIGEST_EXTERNAL_ENABLED` | Gerçek provider — **default 0** |
| `LLM_DIGEST_REQUIRE_OPERATOR_APPROVAL` | Operatör onay kapısı |
| `OPERATOR_APPROVED_REAL_LLM_DIGEST` | Gerçek çağrı onayı (pilot anında 1) |
| `LLM_DIGEST_API_KEY` | Backend-only; **repo'ya yazılmaz** |
| `LLM_DIGEST_DAILY_LIMIT` | Günlük external call limiti (default 5) |
| `LLM_DIGEST_PER_REQUEST_LIMIT` | Request başına limit (default 1) |
| `LLM_DIGEST_LOG_PROMPTS` / `LLM_DIGEST_LOG_RESPONSES` | Default **0** (kapalı) |

## Ops / runbook

- [Provider pilot runbook](docs/ops/v0.6.4-real-provider-pilot-runbook.md)
- [Current architecture v0.6](docs/architecture/current-architecture-v0.6.md)
- [Project current state](docs/project/current-state.md)
- [Evidence index](evidence/README.md)

## Legacy Radar API uçları (ikincil)

| Uç | Açıklama |
|-----|----------|
| `GET /api/events` | Eski radar akışı |
| `GET /api/signals` | Sosyal sinyaller |
| `GET /api/sources/status` | Connector durumu |
| `POST /api/refresh` | Olay havuzunu yenile |

## Test

```powershell
cd apps/api
pnpm vitest run src
pnpm build
```

```powershell
cd apps/android
.\gradlew.bat testDebugUnitTest
```

## Mevcut faz durumu

v0.5.5 – v0.6.4 **PASS** (Smart Feed + Smart Digest altyapısı). Detay: [docs/project/current-state.md](docs/project/current-state.md)

**Gerçek external LLM pilotu:** henüz yapılmadı. Açık operatör onayı olmadan başlatılmamalı.
