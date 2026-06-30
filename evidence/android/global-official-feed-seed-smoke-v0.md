# Global Official Feed Seed — Smoke-First Evidence v0

**Branch:** `feat/global-official-feed-seed-v0`  
**Base commit (seed):** `5785a23` — feat: add global official feed seed v0  
**Hardening commit:** `8f797a9` — fix: harden global official feed metadata-only enforcement v0  
**Tarih:** 2026-06-30  
**Play/KVKK/B5:** Dokunulmadı

---

## Dış review kararı

| Kaynak | Karar |
|--------|--------|
| Claude | `FINAL_DECISION = SMOKE_FIRST` |
| Gemini | `FINAL_DECISION = SMOKE_FIRST` |
| Operatör | `FINAL_DECISION_BEFORE_MERGE = SMOKE_FIRST` |

**Merge önerisi (bu evidence):** `NOT_READY_SMOKE_MISSING`

---

## Smoke ortamı

| Alan | Değer |
|------|--------|
| adb yolu | `C:\Users\mscor\AppData\Local\Android\Sdk\platform-tools\adb.exe` *(PATH’te değil)* |
| Bağlı cihaz/emülatör | **Yok** (`adb devices` boş) |
| AVD listesi | **Boş** / emülatör başlatılamadı |
| Durum | **`SMOKE_BLOCKED_NO_DEVICE`** |

> Cihaz veya emülatör bağlanmadan PR #69 merge **önerilmez**.

---

## Otomatik test (smoke öncesi / hardening sonrası)

```text
./gradlew :app:testDebugUnitTest  → BUILD SUCCESSFUL (201 tests)
./gradlew :app:assembleDebug      → BUILD SUCCESSFUL
```

Tarih: 2026-06-30 (Cursor smoke-first oturumu)

---

## Hardening (parser — merge öncesi)

Dış review: USGS `description` yalnızca HTML ise null yapmak **yeterli değil**.

| Değişiklik | Dosya |
|------------|-------|
| `usgs-earthquakes` için `description` **her zaman null** | `RssParser.kt` |
| `TITLE_LINK_ONLY` → description null (değişmedi) | `RssParser.kt` |
| Diğer `RSS_METADATA_ONLY` → HTML strip korundu (TR/TCMB gelecek hattı) | `RssParser.kt` |

Yeni/güncellenen unit testler (`GlobalOfficialFeedSeedV0Test`):

- USGS plain text summary → description null
- USGS HTML summary → description null
- USGS ISO fractional instant parse
- Fed/EU TITLE_LINK_ONLY → description null

---

## Smoke checklist — cihaz sonuçları

| # | Kontrol | Sonuç | Not |
|---|---------|-------|-----|
| 1 | Uygulama açılıyor, crash yok | **BLOCKED** | Cihaz yok |
| 2 | Kaynak Yönetimi’nde 6 kaynak | **BLOCKED** | |
| 3 | Federal Reserve — TITLE_LINK_ONLY, default kapalı, title/link only | **BLOCKED** | Unit test PASS |
| 4 | EU Commission — TITLE_LINK_ONLY, default kapalı, title/link only | **BLOCKED** | Unit test PASS |
| 5 | USGS — RSS_METADATA_ONLY, default açık, description null | **BLOCKED** | Parser hardening + unit test PASS |
| 6 | BBC NEEDS_REVIEW, toggle disabled | **BLOCKED** | Unit test PASS |
| 7 | Orijinal kaynağa git | **BLOCKED** | |
| 8 | Çeviri/AI özet yok | **BLOCKED** | |
| 9 | Offline/cache uyumu | **BLOCKED** | |
| 10 | Logcat crash/ANR yok | **BLOCKED** | |

**Parser/unit kanıtı (cihaz yerine):** Fed/EU/USGS description null — `GlobalOfficialFeedSeedV0Test` PASS. Bu, UI smoke **yerine geçmez**.

---

## USGS description policy (post-hardening)

```text
source.id == usgs-earthquakes → description = null (HTML veya düz metin)
legalMode == TITLE_LINK_ONLY  → description = null
```

Forbidden field UI sızıntısı unit seviyesinde doğrulandı; **cihazda kart/detay ekranı teyidi bekliyor**.

---

## Screenshot

| Dosya | Durum |
|-------|--------|
| `evidence/android/screenshots/v0.6.0-global-source-management.png` | **Yok** — smoke blocked |
| `evidence/android/screenshots/v0.6.0-usgs-feed-card.png` | **Yok** |
| `evidence/android/screenshots/v0.6.0-fed-eu-title-link-only.png` | **Yok** |

---

## PR #69 merge önerisi

| Kod | Anlam |
|-----|--------|
| `NOT_READY_SMOKE_MISSING` | Cihaz/emülatör smoke yapılmadan merge önerilmez |
| `READY_AFTER_SMOKE` | Smoke PASS sonrası hedef durum |
| `BLOCKED_FORBIDDEN_FIELD_LEAK` | Smoke sırasında body/summary görülürse |

**Nihai öneri:** `NOT_READY_SMOKE_MISSING` — hardening tamam, cihaz smoke bekliyor.

---

## Kod değişti mi

**Evet** — `RssParser.kt`, `GlobalOfficialFeedSeedV0Test.kt`, bu evidence dosyası.

| Soru | Yanıt |
|------|-------|
| Manifest/Gradle/XML | Hayır |
| Schema migration | Hayır |
| API/backend | Hayır |
| Play/B5 | Hayır |
| Yeni kaynak | Hayır |

---

## Sonraki adım (smoke unblock)

1. Cihaz USB debug veya AVD başlat
2. PATH’e `platform-tools` ekle veya tam adb yolu kullan
3. `gradlew :app:installDebug`
4. Checklist #1–#10 + screenshot’lar
5. Bu dosyayı PASS ile güncelle → `READY_AFTER_SMOKE`
