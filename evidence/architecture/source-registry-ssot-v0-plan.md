# Evidence — Source Registry SSOT v0 Hazırlık Planı

**Tarih:** 2026-06-29  
**Belge türü:** Architecture plan evidence (docs-only PR)  
**Ana plan:** [docs/architecture/source-registry-ssot-v0-plan.md](../../docs/architecture/source-registry-ssot-v0-plan.md)

---

## Amaç

PR #41’deki geçici `title-link-only-payload-policy` katmanını kalıcı SSOT mimarisine bağlamadan önce kapsam, drift analizi ve acceptance criteria sabitlendi.

**Bu evidence PR runtime/API/Android davranışı değiştirmez.**

---

## Repo tarama özeti (2026-06-29)

### Kaynak listesi drift

| Konum | Dosya | Kayıt |
|-------|-------|-------|
| API runtime | `apps/api/src/config/rss-sources.ts` | 4 (2 enabled: NTV, Habertürk) |
| API SSOT fixture | `apps/api/src/source-registry/source-registry-v0.json` | 20 (`readOnly: true`) |
| Android seed | `NewsRepository.seedDefaultSources()` | 3 (NTV Türkiye, BBC Türkçe, Habertürk) |

### legalMode durumu

| Hat | legalMode |
|-----|-----------|
| API `rss-sources.ts` | Yok — `enabled` + `disabledReason` |
| API registry fixture | Var — tüm kayıtlarda dolu |
| Android seed | Var — hepsi `RSS_METADATA_ONLY` (SSOT hedefi: ticari → `TITLE_LINK_ONLY`) |
| PR #41 policy | Registry `TITLE_LINK_ONLY` okur — response only |

### PR #41 geçici katman

- Modül: `apps/api/src/source-registry/title-link-only-payload-policy.ts`
- Bağlantı: `apps/api/src/routes/smart-feed.ts`
- **Aktif legal guard değil** — ingest/publish gate bağlı değil
- Kanıt: `evidence/compliance/backend-ai-summary-cleanup-v0.md` (PR #41 merged)

### Ingest / publish registry kullanımı

- `rss-ingest.ts` → `RSS_SOURCES` (registry değil)
- `publish-gate.ts` → `legalMode` kontrolü yok
- Registry → dry-run audit, contract test, PR #41 policy okuma

---

## SSOT v0 hedef alan seti

Her kaynak: `id`, `displayName`, `sourceType`, `legalMode`, `authorityTier`, `allowedFields`, `forbiddenFields`, `reviewStatus`, `publishEligible`, `licenseStatus`, `canonicalBaseUrl`, `rssUrl`, `notes`, `lastReviewedAt`.

---

## Acceptance criteria checklist (implementation için)

| # | Kriter | Plan PR | Implementation PR |
|---|--------|---------|-------------------|
| 1 | Tek registry’den API + Android türetimi | Tanımlandı | Bekliyor |
| 2 | `legalMode` boş olamaz | Tanımlandı | Bekliyor |
| 3 | DISABLED / NEEDS_REVIEW ingest yok | Tanımlandı | Kısmi (AA/TRT runtime kapalı) |
| 4 | TITLE_LINK_ONLY summary boş | Tanımlandı | PR #41 response only |
| 5 | Forbidden fields yok | Tanımlandı | Contract + smoke |
| 6 | Lisanssız ajans publish blok | Tanımlandı | Fixture only |
| 7 | Android fallback kırılmaz | Tanımlandı | PR #36 main’de |
| 8 | B5 HTTPS değişmez | Tanımlandı | OPEN |

---

## Doğrulama (bu PR)

| Kontrol | Sonuç |
|---------|--------|
| Runtime/API kod değişti mi? | **Hayır** |
| Android/Kotlin değişti mi? | **Hayır** |
| Manifest/Gradle/XML değişti mi? | **Hayır** |
| Test çalıştırıldı mı? | **Hayır** — docs/evidence-only architecture plan PR |
| `git diff` kapsamı | Yalnızca `docs/` + `evidence/architecture/` (+ opsiyonel index link) |

---

## Migration faz özeti

1. Envanter (bu belge)
2. Schema + fixture
3. API registry okuma
4. Android seed SSOT import
5. PR #41 policy → resolver
6. Legal eligibility testleri
7. Publish gate blocker (son)

---

## B5 durumu

Release HTTPS / cleartext hardening **OPEN** — bu plan PR kapsamı dışı. Bkz. `docs/compliance/release-https-cleartext-hardening-plan-v0.md`.

---

## Sonraki önerilen adım

Plan merge sonrası: **SSOT implementation v0** (Aşama 3–5, küçük PR’lar). HTTPS hardening ayrı risk track.
