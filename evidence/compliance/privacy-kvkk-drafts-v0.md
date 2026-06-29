# Privacy + KVKK Drafts v0 — Evidence

**Generated:** 2026-06-29  
**Branch:** `docs/privacy-kvkk-drafts-v0`  
**Type:** Docs-only (not legal final text)

---

## Blocker impact

| Blocker | Before this PR | After this PR | Closed? |
|---------|----------------|---------------|---------|
| B1 Privacy Policy URL | OPEN | **OPEN** — draft created; live URL pending | **NO** |
| B2 KVKK aydınlatma | OPEN | **OPEN** — draft created; legal review pending | **NO** |
| B3 Data Safety | OPEN | **OPEN** — inventory draft supports future form | **NO** |
| B4 News declaration | OPEN | OPEN | NO |
| B5 HTTPS/cleartext | OPEN | OPEN | NO |
| B6 Mobile API/LLM key | PASS | PASS | — |
| B7 Product language | REVIEW | REVIEW | NO |
| B8 PR #36 device smoke | BLOCKED | BLOCKED | NO |

**Why blockers are not closed:** This PR produces **draft text only**. Closure requires:

1. Hukuk danışmanı nihai metin teyidi  
2. Canlı Privacy Policy URL (hosting)  
3. Uygulama içi link/erişim (Settings — ayrı PR)  
4. Play Console alanlarının doldurulması  

---

## Files added

| File | Role |
|------|------|
| `docs/compliance/privacy-policy-draft-v0.md` | Privacy Policy taslak |
| `docs/compliance/kvkk-aydinlatma-draft-v0.md` | KVKK aydınlatma taslak (ayrı belge) |
| `docs/compliance/data-inventory-v0.md` | Veri envanteri / Data Safety temeli |
| `evidence/compliance/privacy-kvkk-drafts-v0.md` | Bu evidence |

---

## PR #36 status (unchanged)

- Android aiSummary fallback: **draft, do not merge**  
- Device smoke pending  
- APK commit: `66e358e`  
- Requires PC + USB + `adb reverse tcp:3001 tcp:3001`

---

## Hukuk danışmanı teyidi gereken noktalar (özet)

1. Veri sorumlusu kimlik bilgileri (her iki metin)  
2. Hukuki sebep seçimi (KVKK m.5/m.6)  
3. IP/log retention  
4. Cihaz cache KVKK kapsamı  
5. Yurt dışı aktarım (hosting, LLM, analytics)  
6. Hesapsız uygulama — m.11 ve Play account deletion  
7. RSS/metadata + link-out telif/gizlilik sınırı  
8. Yaş hedefi / çocuk politikası  
9. Aydınlatma sunum zamanı ve açık rıza ayrımı  

---

## Product language compliance

Drafts use safe language:

- kaynak sinyali, kaynak profili, kaynak sağlığı, orijinal kaynağa yönlendirme  
- “Bu sinyal haberin doğruluğunu tek başına garanti etmez.”

Forbidden terms avoided in drafts.

---

## Recommended next PRs

1. **PR #36** — device smoke → merge (PC session)  
2. **Backend aiSummary cleanup** — after #36  
3. **Privacy/KVKK publish PR** — live URL + in-app Settings links + legal sign-off  
4. **Data Safety form PR** — engineering + legal aligned declaration  
5. **Release HTTPS hardening** — B5 closure  
6. **News self-declaration** — Play Console  
