# Release HTTPS / Cleartext Hardening Plan v0 — Evidence

**Generated:** 2026-06-29  
**Branch:** `docs/release-https-cleartext-hardening-plan-v0`  
**Type:** Docs-only plan (no implementation)

---

## Gate summary

| Check | Result |
|-------|--------|
| Code/manifest/Gradle changed | **NO** |
| APK build run | **NO** |
| adb / device smoke | **NO** |
| Tests run | **NO** — docs/evidence-only APK-free PR |
| B5 closed | **NO** — OPEN, plan prepared |
| PR #36 mixed | **NO** — separate track |

---

## B5 blocker status

| Before | After this PR |
|--------|---------------|
| OPEN (`usesCleartextTraffic=true`) | **OPEN** — implementation plan documented |

**Not:** “Blocker kapandı” ifadesi kullanılmamalıdır.

---

## Cleartext scan results

**Command pattern:** `grep -RIn usesCleartextTraffic|cleartext|networkSecurityConfig|http://` (product paths)

### Critical (product)

| File | Line | Finding | Severity |
|------|------|---------|----------|
| `apps/android/app/src/main/AndroidManifest.xml` | 15 | `usesCleartextTraffic="true"` on `<application>` | **BLOCKER** |
| `apps/android/.../FeatureConfig.kt` | 40 | `smartFeedBaseUrl = "http://127.0.0.1:3001"` | HIGH |
| `apps/android/app/build.gradle.kts` | 43-50 | No debug/release URL split | MEDIUM |

### Absent (expected for hardening)

| Item | Status |
|------|--------|
| `network_security_config.xml` | **Not found** |
| `src/debug/AndroidManifest.xml` | **Not found** |
| `buildConfigField` API URL | **Not found** |

### Non-product (informational)

| Path | Note |
|------|------|
| `apps/api/src/server.ts` | Dev HTTP log; prod TLS via ops |
| `apps/android/.../*Test.kt` | Test fixtures `http://` |
| `apps/mobile/src/api/config.ts` | Separate Expo app; out of native Android scope |
| XML `xmlns:android="http://..."` | Namespace, not cleartext traffic |

---

## Mobile secret scan (unchanged)

| Check | Result |
|-------|--------|
| API key in APK | PASS — none |
| LLM key in APK | PASS — server env only |

---

## Target vs current gap

| Dimension | Current | Target (implementation PR) |
|-----------|---------|----------------------------|
| Release cleartext | Allowed (manifest) | Denied |
| Debug cleartext | Global true | Localhost-only debug scope |
| API URL scheme | HTTP | HTTPS (release) |
| NSC file | Missing | Required |
| B5 | OPEN | PASS after impl + verify |

---

## Recommended implementation PR scope

1. `network_security_config.xml` (main + debug overlay)  
2. Manifest cleartext removal from main  
3. `build.gradle.kts` `SMART_FEED_BASE_URL` per build type  
4. `FeatureConfig` reads `BuildConfig`  
5. Evidence: release manifest dump  
6. Debug APK smoke (optional, separate from this plan PR)  

---

## PR #36 status (unchanged)

- Android aiSummary fallback — draft, blocked  
- Device smoke pending — PC + USB + adb reverse  
- APK commit: `66e358e`  
- **Not in scope for this plan PR**

---

## Related blockers (unchanged)

| ID | Status |
|----|--------|
| B1 Privacy Policy URL | OPEN |
| B2 KVKK | OPEN |
| B3 Data Safety | OPEN |
| B4 News declaration | OPEN |
| B5 HTTPS/cleartext | **OPEN** (plan ready) |
| B8 PR #36 smoke | BLOCKED |

---

## Next recommended PRs

1. **Implementation:** `fix(android): release HTTPS cleartext hardening v0`  
2. **PR #36** device smoke → merge (PC)  
3. Backend aiSummary cleanup  
4. Privacy/KVKK publish + Play Console submission  
5. Active legal guard binding (last)
