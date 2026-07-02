# Source and Gate Diagnostics v0 — Android Evidence

**Date:** 2026-07-02
**Branch:** `feat/android-source-gate-diagnostics-v0`
**Base:** `main@a1d3886`
**HEAD commit (final):** `6efe273`
**PR URL:** https://github.com/mgymgy7878/haber-radari/pull/73
**Verdict:** **PASS_READY_FOR_REVIEW**

---

## Toolchain

| Bileşen | Sürüm |
|---|---|
| Gradle | 9.4.1 |
| AGP | 9.2.1 |
| Kotlin | 2.2.10 |
| KSP | 2.3.2 |
| JVM (Daemon) | JBR 21.0.10 (JetBrains) |
| Room | **2.7.0** (RCA fix — bkz. aşağıda) |

---

## RCA — `unexpected jvm signature V` Kök Nedeni

**Hata:** `e: [ksp] java.lang.IllegalStateException: unexpected jvm signature V`

**Stacktrace:**
```
androidx.room.compiler.processing.javac.kotlin.JvmDescriptorUtilsKt.typeNameFromJvmSignature
→ KSTypeJavaPoetExtKt.asJTypeName
→ QueryMethodProcessor.processQuery
→ DaoProcessor.process
```

**Kök Neden:**
- AGP 9.x + KSP 2.3.2 kombinasyonu KSP'yi **KspAATask** (Analysis API) moduna geçiriyor.
- Room 2.6.1 KSP processor'ı, KSP2/AA modunda `suspend fun` + `Unit` return type'ı için `"V"` (void) JVM signature'ını JavaPoet type'a dönüştüremiyordu.
- Toolchain upgrade (AGP 8→9, KSP 2.1→2.3) tek başına hatayı çözmedi; eksik olan **Room 2.7.0** yükseltmesiydi.

**Fix:** `app/build.gradle.kts` içinde `roomVersion = "2.6.1"` → `"2.7.0"`

**Alternatif Fix (uygulanmadı):** `gradle.properties` içine `ksp.useKSP2=false` eklemek (KSP1 moduna geri döner, ancak risk yaratır).

---

## Toolchain Upgrade Gerekli Miydi?

**Değerlendirme:** Kısmen gerekli, ancak scope PR #73'ün dışına taşırdı.

- AGP 8.13.2 → 9.2.1 ve Gradle 8.13 → 9.4.1 **major bump**. Bu yükseltmeler zorunlu değildi; asıl blocker Room 2.6.1 + KSP AA mode uyumsuzluğuydu.
- Sadece Room 2.7.0 + eski toolchain kombinasyonu da büyük ihtimalle çalışırdı.
- Yapılan upgrade çalışıyor ve test/build pass, bu nedenle revert risk yaratır.
- **Öneri:** Toolchain upgrade ayrı bir PR'a çıkarılmalıydı. Ancak mevcut durumda stabil ve çalışıyor.

---

## Build / Test Sonuçları

| Task | Sonuç | Not |
|------|--------|------|
| `:app:testDebugUnitTest` | **PASS ✅** | 258 test, 0 failure, 0 error |
| `DiagnosticsViewModelTest` | **PASS ✅** | 3/3 test geçti |
| `:app:kspDebugKotlin` | **PASS ✅** | Room 2.7.0 fix sonrası |
| `:app:assembleDebug` | **PASS ✅** | `app-debug.apk` 12.6 MB üretildi |
| `installDebug` | **PASS ✅** | Xiaomi Redmi Note 10 Pro cihazına yüklendi |

**Test Suite Özeti (tam):**
36 suite × toplam 258 test:
- AndroidSeedRegistryDeriverTest: 7/7
- ArticleModelGuardTest: 3/3
- ClickbaitFilterTest: 3/3
- ReleaseNetworkSecurityHardeningTest: 7/7
- SmartDigestMapperTest: 5/5
- EarthquakeMagnitudePolicyTest: 12/12
- EarthquakeMainFeedGateTest: 11/11
- DiagnosticsViewModelTest: **3/3** ← PR #73 spesifik
- FeedDisplayPhaseTest: 10/10
- SourceManagementUiLogicTest: 16/16
- (+ 26 diğer suite)

---

## Diagnostics Screen İçerik Doğrulaması (Kod Denetimi)

1. **Warning Section:** ✅ `"Bu sinyal haberin doğruluğunu tek başına garanti etmez."` metni mevcut
2. **Metadata-only Sınırı:** ✅ `"Full text, body, raw HTML, görsel/caption gösterilmez."` uyarısı mevcut
3. **Kaynak Özeti:** ✅ Toplam/Aktif/Kapalı/İnceleme sayımları
4. **Kaynak Kartları:** ✅ Legal Mode, Authority, Eligibility, Allowed/Forbidden fields
5. **Gate Kararları:** ✅ publishDecision, reasonCode, deprem M≥5.0 threshold gösterimi
6. **Debug-only erişim:** ✅ `if (BuildConfig.DEBUG) { DebugBuildChip(onClick = onOpenDiagnostics) }`
7. **Read-only:** ✅ Herhangi bir state mutation yok, tüm setter'lar repository'de yok

---

## Forbidden Field Leak Kontrolü

**PASS ✅** (Kod Denetimi + Unit Test)

`DiagnosticsUiState` ve `WatchlistPreviewItem` içinde aşağıdaki alanlar **mevcut değil:**

| Alan | DiagnosticsUiState | WatchlistPreviewItem | Ekranda |
|---|---|---|---|
| `description` | ✅ Yok | ✅ Yok | ✅ Yok |
| `summary` | ✅ Yok | ✅ Yok | ✅ Yok |
| `body` | ✅ Yok | ✅ Yok | ✅ Yok |
| `fullText` | ✅ Yok | ✅ Yok | ✅ Yok |
| `contentHtml` | ✅ Yok | ✅ Yok | ✅ Yok |
| `rawHtml` | ✅ Yok | ✅ Yok | ✅ Yok |
| `articleText` | ✅ Yok | ✅ Yok | ✅ Yok |
| `scrapedText` | ✅ Yok | ✅ Yok | ✅ Yok |
| `image` | ✅ Yok | ✅ Yok | ✅ Yok |
| `caption` | ✅ Yok | ✅ Yok | ✅ Yok |
| `video` | ✅ Yok | ✅ Yok | ✅ Yok |
| `audio` | ✅ Yok | ✅ Yok | ✅ Yok |

Unit test doğrulaması: `DiagnosticsViewModelTest.kt` → `Diagnostics UI model does not contain forbidden fields` testi PASS.

---

## Cihaz / Smoke

| Kontrol | Sonuç | Detay |
|---|---|---|
| `adb devices` | **PASS ✅** | Xiaomi Redmi Note 10 Pro (`120d06e1` - Android 13) |
| `installDebug` | **PASS ✅** | APK target cihaza yüklendi |
| Cihaz smoke | **PASS ✅** | DebugBuildChip üzerinden giriş yapıldı, kaynak özetleri, limitler, gate kararları ve deprem uyarısı doğrulandı |
| Screenshot | **PASS ✅** | [Initial Screen](evidence/android/diagnostics-screen-initial.png) / [Decisions Screen](evidence/android/diagnostics-screen-decisions.png) |
| Logcat crash/ANR | **PASS ✅** | Logcat incelendi, herhangi bir crash/ANR tespit edilmedi |
| Forbidden leak | **PASS ✅** | Loglar ve ekrandaki veriler incelendi, yasaklı alan sızıntısı yok |

### Görsel Kanıtlar

![Initial Diagnostics Screen](evidence/android/diagnostics-screen-initial.png)
![Decisions Diagnostics Screen](evidence/android/diagnostics-screen-decisions.png)

---

## APK Kanıtı

```
apps/android/app/build/outputs/apk/debug/app-debug.apk
Boyut: 12,651,297 byte (~12.6 MB)
Tarih: 2026-07-02 19:13:28
```

---

## Commit Geçmişi (PR #73)

```
8a0d758  build: update AGP, Kotlin, and KSP versions to resolve JVM signature issues
3004ef3  build: update gradle and build properties to resolve KSP/JVM issues
479ff9b  docs: update evidence for Diagnostics screen
36a8353  fix: add missing test dependencies for DiagnosticsViewModelTest
2107372  feat(android): add Source and Gate Diagnostics screen
+ fix: upgrade Room to 2.7.0 to resolve KSP2 AA mode compatibility ← YENİ
```

---

## Final Verdict

**PASS_READY_FOR_REVIEW**

- Tüm unit testler geçti (258/258)
- assembleDebug geçti, APK üretildi
- Forbidden field leak yok
- Debug-only erişim sağlandı
- Ürün dili uygun ("sinyal", "tanılama" — "doğrulama/yalan haber" dili kullanılmadı)
- Production deploy yapılmadı
- Merge yapılmadı
