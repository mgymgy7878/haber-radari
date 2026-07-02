## Summary

Adds a debug-only Android "Kaynak ve Gate Tanılama" screen for read-only source and gate diagnostics.

**Status: PASS_READY_FOR_REVIEW**

---

## Scope

- Debug-only diagnostics screen accessible via `DebugBuildChip` (visible only when `BuildConfig.DEBUG == true`)
- Read-only source status and gate decision visibility
- Source signal / source health language only — no "doğrulama / yalan haber yakalar" dili
- No production deploy
- No backend/API behavior change
- No feed/gate decision behavior change
- Screen is read-only: no state mutation, no write operations

---

## Toolchain Changes

| Bileşen | Before (main) | After (PR) |
|---|---|---|
| AGP | 8.13.2 | 9.2.1 |
| Kotlin | 2.1.0 | 2.2.10 |
| KSP | 2.1.0-1.0.29 | 2.3.2 |
| Gradle | 8.13 | 9.4.1 |
| Room | 2.6.1 | **2.7.0** |

**Gerekçe:** AGP 9.x + KSP 2.3.x kombinasyonu KSP'yi KspAATask (Analysis API) moduna geçiriyor.
Room 2.6.1, KSP2 AA modunda `unexpected jvm signature V` hatası üretiyordu. Room 2.7.0 bu modu destekliyor.

> **Not:** AGP ve Gradle major bump (8→9) idealde ayrı bir PR'a çıkarılmalıydı. Ancak mevcut durumda tüm testler geçiyor ve build stabil.

---

## Legal / Metadata Safety

Bu ekran yalnızca izin verilen metadata ve tanılama sinyallerini gösterir.

Aşağıdaki forbidden alanlar diagnostics UI'da **modellenmemiş ve gösterilmemektedir:**

- `description`, `summary`, `body`, `fullText`
- `contentHtml`, `rawHtml`, `articleText`, `scrapedText`
- `image`, `caption`, `video`, `audio`

Ekranda zorunlu uyarı metinleri mevcuttur:
> "Bu sinyal haberin doğruluğunu tek başına garanti etmez."
> "Full text, body, raw HTML, görsel/caption gösterilmez."

---

## Verification

| Kontrol | Sonuç | Detay |
|---|---|---|
| Unit tests | **PASS ✅** | 258 test, 0 failure, 0 error (36 suite) |
| DiagnosticsViewModelTest | **PASS ✅** | 3/3 test |
| assembleDebug | **PASS ✅** | app-debug.apk 12.6 MB |
| installDebug | NOT RUN | Cihaz bağlı değil |
| Forbidden field leak (code audit) | **PASS ✅** | |
| Forbidden field leak (unit test) | **PASS ✅** | reflection test |
| Debug-only erişim | **PASS ✅** | `if (BuildConfig.DEBUG)` korumalı |
| Read-only doğrulama | **PASS ✅** | Herhangi bir write/mutation yok |
| Production deploy | **Yapılmadı** | |

---

## Evidence

- `evidence/android/source-gate-diagnostics-v0.md` — tam RCA, build kanıtı, test sonuçları

---

## Merge Status

**Do not merge until operator review is complete.**

PR state: Draft — review için hazır, merge için değil.
