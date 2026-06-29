# Personal APK — Official Feed Source Expansion v0 (AFAD only)

**Branch:** `feat/personal-apk-source-expansion-official-feeds-v0`  
**Main baseline:** `3960912`  
**Tarih:** 2026-06-29  
**Play/KVKK/B5:** Dokunulmadı

---

## Özet

Bireysel APK Android seed listesine registry SSOT’tan doğrulanmış **AFAD** resmi kaynağı eklendi. v0 yalnızca AFAD; diğer resmi kaynaklar feedUrl/ToS evidence olmadan eklenmedi.

---

## Eklenen kaynak

| Alan | Değer |
|------|--------|
| Android `sourceId` | `afad-official` |
| Registry `sourceId` | `afad_official` |
| Ad | AFAD |
| `feedUrl` | `https://www.afad.gov.tr/rss` |
| `legalMode` | `RSS_METADATA_ONLY` |
| `reviewStatus` | `approved` |
| `authorityTier` | `OFFICIAL` → `OFFICIAL_PRIMARY` |
| Kategori | `afet` |
| Varsayılan `enabled` | `true` |

---

## AFAD registry doğrulaması

Kaynak: `apps/android/app/src/main/assets/source-registry-v0.json`

- `sourceId`: `afad_official`
- `feedUrl`: `https://www.afad.gov.tr/rss` ✅
- `legalMode`: `RSS_METADATA_ONLY` ✅
- `reviewStatus`: `approved` ✅
- `publishEligible`: `true`

Unit test: `AndroidSeedRegistryDeriverTest` — `AFAD registry approved RSS_METADATA_ONLY ve feedUrl doğrulanır`

---

## Eklenmeyen resmi kaynaklar (v0.1 aday)

| Kaynak | Neden |
|--------|--------|
| deprem.afad | Registry’de `feedUrl` yok |
| TCMB | Registry’de `feedUrl` yok |
| KAP | Registry’de `feedUrl` yok |
| TÜİK | Registry’de `feedUrl` yok |
| SPK | Registry’de `feedUrl` yok |

Sonraki adım: `official-feeds-url-audit-v0.1` — URL/ToS evidence sonrası binding.

---

## Değişen dosyalar

- `AndroidSeedRegistryDeriver.kt` — AFAD binding, enable, kategori, `mapAuthorityTier`
- `AndroidSeedRegistryDeriverTest.kt`
- `SourceSeedRefreshPolicyTest.kt`

---

## Kaynak Yönetimi davranışı

- Fresh install: AFAD listede görünür, toggle açık
- Kullanıcı `enabled=false` → `seedDefaultSources` / metadata refresh tercihi **ezmez**
- BBC `NEEDS_REVIEW` → toggle disabled (değişmedi)
- NTV/Habertürk `TITLE_LINK_ONLY` (değişmedi)

---

## Legal-safe

| Kontrol | Sonuç |
|---------|--------|
| Metadata-only (`RSS_METADATA_ONLY`) | ✅ |
| Tam metin / scraped / görsel alan eklenmedi | ✅ |
| Forbidden fields UI/model’e eklenmedi | ✅ |
| Yanıltıcı doğrulama dili | Yok |

RSS ingest: title, kısa RSS metadata (legalMode izinli), sourceName, publishedAt, originalUrl — tam metin yok.

---

## Test sonuçları

```
./gradlew :app:testDebugUnitTest  → BUILD SUCCESSFUL
./gradlew :app:assembleDebug      → BUILD SUCCESSFUL
```

---

## Device / manual smoke

**Atlandı** — `adb` PATH'te yok.

Önerilen manual checklist:

1. Kaynak Yönetimi → AFAD listede
2. Toggle aç/kapat
3. Yenile → AFAD RSS metadata
4. Tam metin/görsel UI’da yok

---

## Kod değişti mi

**Evet**

## Manifest / Gradle / XML

**Hayır**

## Schema migration

**Hayır**

## API / backend

**Hayır**

## Play / B5

**Hayır**
