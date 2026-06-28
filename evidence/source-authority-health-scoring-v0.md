# Source Authority / Health Scoring v0

**Date:** 2026-06-28  
**Status:** ✅ PASS (shadow/read-only)  
**Context:** PR #23 — publish-gate davranışı değiştirilmedi

---

## Amaç

Haber kaynakları için deterministik, açıklanabilir ve test edilebilir bir **source authority + source health scoring** katmanı eklemek. Bu PR yalnızca shadow/read-only skor üretir; ana akış publish kararını etkilemez.

---

## Değişen dosyalar

| Dosya | Rol |
|-------|-----|
| `apps/api/src/source-scoring/source-score-types.ts` | Skor modeli + shadow payload tipleri |
| `apps/api/src/source-scoring/authority-tier-resolver.ts` | Deterministik authority tier |
| `apps/api/src/source-scoring/source-health-scorer.ts` | Health + cluster boost hesabı |
| `apps/api/src/source-scoring/shadow-score-builder.ts` | Feed → shadow payload builder |
| `apps/api/src/source-scoring/fixtures/source-scoring-cases.json` | 7 fixture case |
| `apps/api/src/source-scoring/source-scoring.test.ts` | Unit + fixture testleri |
| `apps/api/src/services/rss-ingest.ts` | Per-source `sourceStatuses[]` telemetrisi |
| `apps/api/src/routes/smart-feed.ts` | `debugStats.sourceScoreShadow` (read-only) |
| `apps/api/src/routes/smart-feed.test.ts` | Shadow varlığı + publish sayısı regression |

---

## Scoring alanları

| Alan | Açıklama |
|------|----------|
| `sourceId` | RSS kaynak kimliği |
| `sourceName` | Görünen kaynak adı |
| `sourceUrl` / `sourceDomain` | RSS URL ve domain |
| `authorityTier` | OFFICIAL / PRIMARY_WIRE_OR_AGENCY / ESTABLISHED_MEDIA / LOCAL_MEDIA / UNKNOWN / BLOCKED_OR_LOW_TRUST |
| `authorityScore` | Tier taban skoru (10–95) |
| `healthScore` | Fetch + metadata + tazelik birleşimi |
| `freshnessScore` | Son yayın yaşı (6s/24s/48s eşikleri) |
| `metadataCompletenessScore` | title/link/time/description doluluk oranı |
| `failurePenalty` | Başarısız fetch cezası (0 veya 45) |
| `duplicateConfirmationBoost` | Cluster çoklu kaynak teyidi (+0 / +10 / +15) |
| `finalSourceScore` | Ağırlıklı birleşik skor (0–100) |
| `reasons[]` | Debug/açıklama stringleri |

### Formül (v0)

**Authority:** tier taban skoru (deterministik domain/trust kuralları).

**Metadata completeness:** tam kayıt oranı × 100 − skip penalty (max 30).

**Freshness:** ≤6s → 100, ≤24s → 80, ≤48s → 60, aksi → 40.

**Health:** `100 − failurePenalty − (100−metadata)×0.25 − (100−freshness)×0.15`

**Final (kaynak):** `authority×0.5 + health×0.35 + metadata×0.1 + freshness×0.05`

**Article overlay:** `finalSourceScore + duplicateConfirmationBoost` (cap 100)

**Cluster boost:** 1 kaynak → 0, 2 kaynak → +10, ≥3 kaynak → +15

---

## Fixture listesi

| id | Senaryo |
|----|---------|
| `official-afad` | Resmi kurum → OFFICIAL, yüksek authority |
| `established-media-ntv` | Bilinen medya → ESTABLISHED_MEDIA |
| `unknown-source` | Düşük trust → LOCAL_MEDIA |
| `metadata-incomplete` | Eksik metadata → health penalty |
| `fetch-failed` | Başarısız fetch → failurePenalty |
| `duplicate-cluster-boost` | 3 kaynak → +15 boost |
| `single-source-no-boost` | Tek kaynak → boost yok |

Ek unit testler: AA agency tier, unknown profil, determinism, shadow payload disclaimer.

---

## Test sonuçları

| Suite | Sonuç |
|-------|-------|
| API vitest | **98/98 PASS** (85 mevcut + 13 source scoring) |
| API build (`tsc`) | **PASS** |
| Android testDebugUnitTest | **96/96 PASS** (değişiklik yok) |
| Classification regression | **85/85 korundu** (12/12 fixture dahil) |

---

## Publish davranışı

**publish behavior changed: false**

- `PublishGate.evaluate()` çağrıları değişmedi
- `publishedCount` / `items` filtre mantığı aynı
- Yalnızca `debugStats.sourceScoreShadow` eklendi (backward-compatible debug alanı)
- Trust UX (Android) bu PR'da değiştirilmedi

---

## Safety flags

| Alan | Değer |
|------|-------|
| `realExternalCallExecuted` | **false** |
| `productionApiKeyUsed` | **false** |
| `operatorApprovalUsed` | **false** |
| Scraping genişletildi | **false** |
| Tam metin kopyalama | **false** |
| Mutlak doğruluk iddiası | **false** — skor yalnızca güvenilirlik sinyali |

---

## Sonraki adımlar (önerilen sıra)

1. **PR #24:** Trust UX — kaynak sinyal açıklaması (küçük UI)
2. **PR #25:** Publish-gate'e kontrollü bağlama
3. **PR #26:** Source health admin/debug ekranı
