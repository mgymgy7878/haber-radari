# Data Safety + News Declaration v0 — Evidence

**Generated:** 2026-06-29  
**Branch:** `docs/data-safety-news-declaration-v0`  
**Type:** Docs-only (not Play Console submission)

---

## Blocker impact

| Blocker | Before | After | Closed? |
|---------|--------|-------|---------|
| B1 Privacy Policy URL | OPEN | OPEN | **NO** |
| B2 KVKK aydınlatma | OPEN | OPEN | **NO** |
| B3 Data Safety | OPEN (inventory only) | **OPEN** — draft prepared (`data-safety-draft-v0.md`) | **NO** |
| B4 News declaration | OPEN | **OPEN** — draft prepared (`news-declaration-draft-v0.md`) | **NO** |
| B5 HTTPS/cleartext | OPEN | OPEN | NO |
| B6 Mobile API/LLM key | PASS | PASS | — |
| B7 Product language | REVIEW | REVIEW | NO |
| B8 PR #36 device smoke | BLOCKED | BLOCKED | NO |

**Why B3/B4 not closed:** Play Console’da gerçek beyan gönderilmedi; hukuk + engineering sign-off yok.

---

## Files added

| File | Role |
|------|------|
| `docs/compliance/data-safety-draft-v0.md` | Data Safety matrix + checklist |
| `docs/compliance/news-declaration-draft-v0.md` | News self-declaration draft |
| `evidence/compliance/data-safety-news-declaration-v0.md` | This evidence |

---

## Repo scan results (2026-06-29)

### Android permissions

**Scan:** `AndroidManifest.xml`

| Permission | Result |
|------------|--------|
| `INTERNET` | PASS — expected |
| `ACCESS_NETWORK_STATE` | PASS — expected |
| `ACCESS_FINE_LOCATION` | PASS — not declared |
| `ACCESS_COARSE_LOCATION` | PASS — not declared |
| `POST_NOTIFICATIONS` | PASS — not declared |

**Classification:** PASS

### API key / secret scan

**Scan:** `apps/android`, `apps/api` (excl. node_modules, build)

| Match | Location | Classification |
|-------|----------|----------------|
| `LLM_DIGEST_API_KEY` | `apps/api/src/smart-digest/config.ts` | PASS — server env only |
| `LLM_DIGEST_API_KEY` | `apps/api/src/routes/smart-digest-status.test.ts` | PASS — test fixtures |
| `apiKey` field | smart-digest provider/service | PASS — server-side |
| Mobile APK | No hardcoded keys found | PASS |

**False positives:** Test keys in `*.test.ts` — not shipped.

**Classification:** PASS (mobile); REVIEW (ensure release CI never embeds env)

### Analytics / crash SDK scan

**Scan:** `apps/android` gradle + kotlin sources

| SDK | Found? | Classification |
|-----|--------|----------------|
| Firebase | Comment only (`BackendProxyService.kt` TODO) | PASS — not integrated |
| Crashlytics | No | PASS |
| Analytics | No | PASS |
| Sentry | No | PASS |
| Mixpanel / Amplitude | No | PASS |

**Classification:** PASS — no analytics/crash SDK in v0 build

### Location / notification scan

| Pattern | Found? | Classification |
|---------|--------|----------------|
| `ACCESS_FINE_LOCATION` | No | PASS |
| `ACCESS_COARSE_LOCATION` | No | PASS |
| `POST_NOTIFICATIONS` | No | PASS |
| `LocationManager` / `FusedLocation` | No | PASS |

**Classification:** PASS

### Cleartext / network (informational)

| Item | Value | Note |
|------|-------|------|
| `usesCleartextTraffic` | `true` | B5 OPEN — debug only |
| `smartFeedBaseUrl` | `http://127.0.0.1:3001` | Debug + adb reverse |

---

## Data Safety draft confidence summary

| Confidence | Count (matrix rows) | Examples |
|------------|---------------------|----------|
| high | 10+ | No account, no location, no push, no crash SDK |
| medium | 5+ | On-device cache, category pref, link clicks |
| low | 1 | Server IP/UA diagnostics classification |

**Unknown → resolved by scan:** Crash logs, analytics ID → **not_used** (high confidence).

---

## News declaration draft confidence summary

| Area | Confidence | Note |
|------|------------|------|
| No UGC | high | No comment/upload features |
| No ads | high | Ad-free product |
| No verification claim | high | SSOT product language |
| Aggregator posture | medium | Console wording teyit |
| RSS snippet drift | medium | Cleanup pending |
| Publisher contact | low | Placeholders only |

---

## PR #36 status (unchanged)

- Draft — **do not merge**  
- Device smoke pending  
- APK: `66e358e`  
- PC + USB + `adb reverse tcp:3001 tcp:3001`

---

## Hukuk / Play Console teyidi gereken noktalar

1. Data Safety form güncel soru seti vs matrix  
2. IP/server logs “collected” classification  
3. On-device cache Data Safety treatment  
4. News declaration aggregator vs editor classification  
5. RSS snippet temporary display vs declaration  
6. Publisher legal identity in Console  
7. Privacy Policy / KVKK / Data Safety üçlü tutarlılık  

---

## Recommended next PRs

1. **PR #36** — device smoke → merge (PC)  
2. **Backend aiSummary cleanup** — after #36  
3. **Privacy/KVKK publish** — live URL + Settings links + legal sign-off (B1/B2)  
4. **Play Console submission PR** — Data Safety + News declaration entry (B3/B4 closure)  
5. **Release HTTPS hardening** — B5  
6. Active legal guard binding — last
