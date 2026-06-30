# RSS Parser — Turkish Date Support v0

**Branch:** `fix/rss-parser-turkish-date-v0`  
**Main baseline:** `9fb086d` (PR #61 merge)  
**Tarih:** 2026-06-30  
**Play/KVKK/B5:** Dokunulmadı

---

## Özet

TCMB audit v0.2’de tespit edilen Türkçe Atom tarih formatı (`18 Haz 2026 14:00:00`) için `RssParser.parseDate` genişletildi. **Parser + test only** — kaynak seed/registry değişikliği yok.

---

## Değişen dosyalar

| Dosya | Değişiklik |
|-------|------------|
| `RssParser.kt` | Türkçe ay parse; RFC/ISO mevcut yol korundu |
| `RssParserTurkishDateTest.kt` | Türkçe + regresyon + fallback testleri |

---

## Desteklenen Türkçe format

```text
dd <ay> yyyy HH:mm:ss
```

Timezone belirtilmezse **Europe/Istanbul** (deterministic).

### Kısa ay adları

Oca, Şub/Sub, Mar, Nis, May, Haz, Tem, Ağu/Agu, Eyl, Eki, Kas, Ara

### Tam ay adları

Ocak, Şubat, Mart, Nisan, Mayıs, Haziran, Temmuz, Ağustos, Eylül, Ekim, Kasım, Aralık

Büyük/küçük harf ve Türkçe karakter normalizasyonu (ı→i, ş→s, ğ→g, ü→u, ö→o, ç→c) uygulanır.

---

## Korunan mevcut formatlar

- RFC 2822: `Thu, 26 Jun 2026 12:00:00 +0300`
- ISO 8601: `2026-06-26T21:51:29+0300`
- Parse edilemeyen input → `publishedAt = System.currentTimeMillis()` (mevcut fallback)

---

## Seed / registry teyidi

| Kontrol | Sonuç |
|---------|--------|
| TCMB Android seed eklendi mi | **Hayır** |
| Android seed binding değişti mi | **Hayır** (3 kaynak) |
| Registry `feedUrl` güncellendi mi | **Hayır** |
| Yeni kaynak eklendi mi | **Hayır** |
| Forbidden field (body, image, vb.) | **Hayır** |

---

## Test sonuçları

```text
./gradlew :app:testDebugUnitTest  → PASS
./gradlew :app:assembleDebug      → PASS
```

Cihaz smoke yapılmadı; parser-only değişiklik.

---

## Doğrulama

| Kontrol | Sonuç |
|---------|--------|
| Kod değişti mi | **Evet** |
| Manifest/Gradle/XML değişti mi | **Hayır** |
| Schema migration | **Hayır** |
| Play/B5 hattına dokunuldu mu | **Hayır** |

---

## Sonraki adım

1. TCMB ToS/legal review
2. `docs/tcmb-feed-audit-v0.3` — parser fix sonrası yeniden audit
3. PASS → `feat/tcmb-official-feed-seed-v0`
