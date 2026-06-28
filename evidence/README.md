# Evidence Index

Haber Radarı faz kanıtları. Git'te izlenen dosyalar aşağıdadır.

> **Not:** `evidence/` altında eski fazlara ait untracked dosyalar (v0.5.x cihaz logları, smart-feed runtime dump'ları vb.) PR kapsamına alınmayabilir; yalnızca ilgili faz PR'ında commit edilen kanıtlar SSOT sayılır.

## v0.6.x — Smart Feed + Smart Digest

| Faz | Özet | Ana dosyalar |
|-----|------|--------------|
| **v0.6.0** | Smart Digest foundation | `v0.6.0-smart-digest*.json`, `v0.6.0-smart-digest.md` |
| **v0.6.1** | External adapter + budget guard | `v0.6.1-*.json`, `v0.6.1.md` |
| **v0.6.2** | Android Smart Digest UI | `v0.6.2-*.png`, `v0.6.2.md` |
| **v0.6.3** | Controlled pilot infrastructure (fake provider) | `v0.6.3-*.json`, `v0.6.3-secret-redaction.txt`, `v0.6.3.md` |
| **v0.6.4** | Runbook + status endpoint | `v0.6.4-smart-digest-status*.json`, `v0.6.4-provider-pilot-runbook.md`, `v0.6.4.md` |
| **v0.6.5** | Release hygiene / docs SSOT | `v0.6.5.md` |
| **v0.6.6** | Android trust & source transparency UX | `v0.6.6-digest-statuses.md`, `v0.6.6.md` |

## v0.5.x — Device / UI (referans)

Untracked local kanıtlar olabilir (`install-verification-v0.5.5-*`, `v0.5.6-*`). Resmi PASS kayıtları konuşma SSOT'unda; repo'da izlenen v0.6+ kanıtları birincil referanstır.

## Güvenlik

Evidence dosyalarında **asla**:

- Production API key
- `.env` dump
- Bearer token / secret

`realExternalCallExecuted=false` tüm v0.6.3+ fake/infrastructure kanıtlarında geçerlidir.

## Üretim komutları

```powershell
# Smart digest operatör status (CLI)
cd apps/api
pnpm smart-digest:status

# v0.6.3 fake external evidence (test only)
npx tsx scripts/generate-v063-evidence.ts
```

## Runbook

Gerçek provider pilotu öncesi: [docs/ops/v0.6.4-real-provider-pilot-runbook.md](../docs/ops/v0.6.4-real-provider-pilot-runbook.md)
