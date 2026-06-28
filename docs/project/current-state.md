# Haber Radarı — Current State

Son güncelleme: v0.6.5 release hygiene (dokümantasyon SSOT)

## main HEAD

```
72f1529826f88a92bab8a23ae817d497a47863f0
```

## Faz durumu

| Faz | Açıklama | Durum |
|-----|----------|-------|
| v0.5.5 | Functional Device Verification | **PASS** |
| v0.5.6 | UI/state polish | **PASS** |
| v0.6.0 | Smart Digest foundation | **PASS** |
| v0.6.1 | External Provider Adapter + Budget Guard | **PASS** |
| v0.6.2 | Android Smart Digest UI | **PASS** |
| v0.6.3 | Controlled Pilot Infrastructure | **PASS** |
| v0.6.4 | Provider Pilot Runbook + Status Endpoint | **PASS** |
| v0.6.5 | Release Hygiene + Architecture SSOT | **PASS** |

## Güvenlik bayrakları (production)

| Alan | Değer |
|------|-------|
| `realExternalCallExecuted` | **false** |
| `productionApiKeyUsed` | **false** |
| `operatorApprovalUsed` | **false** |

Gerçek external LLM pilotu **başlamadı**.

## Aktif ürün hattı

- **Client:** `apps/android` (Kotlin / Compose, v0.6.2-debug / versionCode 62)
- **Backend:** `apps/api` — `GET /api/v1/smart-feed`, `GET /api/v1/smart-digest/status`
- **Digest:** Backend-only; external default **kapalı**

## Legacy

- `apps/mobile` — Expo MVP (Radar API)
- `/api/events`, `/api/signals` — ikincil connector hattı

## Sonraki adımlar (operasyonel karar)

1. ~~Release hygiene / docs SSOT~~ (v0.6.5)
2. Gerçek provider pilotu — **ayrı onay gerekir**

Onay cümlesi:

```text
v0.6.3 gerçek provider pilotu için 1 çağrıya onay veriyorum
```

## Kanıt ve runbook

- [Evidence index](../../evidence/README.md)
- [Architecture v0.6](../architecture/current-architecture-v0.6.md)
- [Provider pilot runbook](../ops/v0.6.4-real-provider-pilot-runbook.md)
