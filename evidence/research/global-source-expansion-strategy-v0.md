# Global Kaynak Genişleme Stratejisi v0 — Evidence

**Branch:** `docs/global-source-expansion-strategy-v0`  
**Main baseline:** `c5a02a1` (PR #65 — personal APK source health details)  
**Tarih:** 2026-06-30  
**Tür:** Docs-only — kod / seed / registry değişikliği yok

---

## Özet

Haber Radarı ürün yönü güncellendi: **küresel önemli gelişmeleri seçen, ülkeler/kategoriler bazlı kişisel haber radarı** (şimdilik Türkçe UI). Global ajanslar (Reuters/AP/AFP) ve büyük ticari medya (NYT vb.) **doğrudan seed’e eklenmez**; resmi/kurumsal kaynaklar ilk global omurga adayıdır.

---

## Değişen dosyalar

| Dosya | Değişiklik |
|-------|------------|
| `docs/research/global-source-expansion-strategy-v0.md` | Yeni — strateji belgesi |
| `evidence/research/global-source-expansion-strategy-v0.md` | Yeni — bu evidence |

---

## Kod değişti mi

**Hayır**

## Seed / registry / feedUrl değişti mi

**Hayır** — Android seed hâlâ 3 kaynak (NTV, BBC Türkçe, Habertürk)

## TCMB / AFAD gate

Değişmedi. TCMB seed gate **NEEDS_REVIEW**; AFAD runtime seed’de yok.

## Play / KVKK / B5

Dokunulmadı.

## Forbidden field

Eklenmedi.

## Gate enum’ları (belgede tanımlandı)

```text
APPROVED_METADATA_SOURCE
TITLE_LINK_ONLY
NEEDS_REVIEW
LICENSE_REQUIRED
DISABLED
NO_FEED_FOUND
```

## v0 hedef paket (özet)

| Kategori | Öncelik |
|----------|---------|
| Dünya gündemi | ABD, Almanya, İngiltere, AB, Çin, Japonya (resmi/public) |
| Ekonomi | Fed, ECB, IMF, World Bank, OECD |
| Sağlık | WHO, CDC, EMA, FDA |
| Teknoloji | Resmi vendor blogları, siber güvenlik bültenleri |
| Afet/doğa | USGS, EMSC, resmi afet kaynakları |

## Önerilen sonraki PR sırası

1. `docs/global-official-feeds-audit-v0` (evidence-only)
2. PASS resmi kaynaklar için seed PR
3. Teknoloji/sağlık audit
4. Ticari medya audit (NYT, BBC global, DW…)
5. Cihaz smoke evidence
6. Play/KVKK/B5 (en son)

## Legal-safe çizgi

- Metadata-only; tam metin/scrape/görsel yok
- “Doğrulama / kesin doğru” dili yok
- Ajans lisanssız → DISABLED
- RSS varlığı ≠ izin

## Test

Docs-only PR — `:app:testDebugUnitTest` / `assembleDebug` çalıştırılmadı (kod değişmedi).

## Device smoke

Atlanmadı — bu PR kapsamı dışı; ayrı branch (`test/personal-apk-post-health-device-smoke-v0`) sırada.
