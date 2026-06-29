# Play / KVKK Readiness v0 — Evidence Snapshot

> Read-only compliance snapshot. Not legal advice.

**Generated:** 2026-06-29  
**Branch intent:** `docs/play-kvkk-readiness-v0`

## Blocker summary

| ID | Blocker | Status |
|----|---------|--------|
| B1 | Privacy Policy URL | OPEN — draft: `privacy-policy-draft-v0.md` |
| B2 | KVKK aydınlatma | OPEN — draft: `kvkk-aydinlatma-draft-v0.md` |
| B3 | Data Safety form | OPEN — draft: `data-safety-draft-v0.md` |
| B4 | News self-declaration | OPEN — draft: `news-declaration-draft-v0.md` |
| B5 | Cleartext / HTTPS | OPEN (`usesCleartextTraffic=true` debug) |
| B6 | Mobile API/LLM keys | PASS (server-side only) |
| B7 | Forbidden product language | REVIEW |
| B8 | PR #36 device smoke | BLOCKED |

## PR #36 gate (separate)

- Merge: **NO** until device smoke
- APK commit: `66e358e`
- Requires: PC API :3001 + `adb reverse tcp:3001 tcp:3001`
- Screenshots: Feed + detail, no backend connection error

## Technical observations

```text
AndroidManifest: usesCleartextTraffic=true (debug)
FeatureConfig.smartFeedBaseUrl: http://127.0.0.1:3001 (debug)
LLM_DIGEST_API_KEY: backend env only
Account system: none (deletion N/A candidate)
Location permission: none (v0)
Push: none (v0)
```

## Product language line (required)

> Bu sinyal haberin doğruluğunu tek başına garanti etmez.

Forbidden in store/onboarding/trust UX: doğrulandı, kesin doğru, yalan haber, kanıtlandı.

## Legal counsel review required

- Privacy Policy + KVKK final texts
- Play account deletion N/A for no-account app
- RSS/TITLE_LINK_ONLY copyright posture
- LLM metadata digest disclosure
- Cross-border data transfer (if any)

## Recommended PR sequence (unchanged)

1. PR #36 merge after device smoke
2. Backend NTV/Habertürk aiSummary cleanup
3. Play/KVKK blocker closure (policy URLs, Data Safety, release hardening)
4. Active legal guard binding last
