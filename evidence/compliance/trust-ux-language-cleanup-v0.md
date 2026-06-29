# Trust UX language cleanup (v0)

**Branch:** `fix/trust-ux-language-cleanup-v0`  
**PR title:** `fix(android): align trust UX language with source-signal policy`  
**Date:** 2026-06-29

## Amaç

Play/KVKK öncesi yanıltıcı ürün dilini temizlemek: “doğrulama / kanıt / kesin doğru” algısını **kaynak sinyali / yardımcı değerlendirme** çizgisine çekmek. Davranış değişmedi — yalnızca UI copy.

## Eski → yeni metin tablosu

| Konum | Eski | Yeni |
|-------|------|------|
| `CuratedSourceLabels` CONFIRMED (2+) | Kanıt: çoklu kaynak | Sinyal: çoklu kaynak |
| `CuratedSourceLabels` CONFIRMED (1) | Kanıt: doğrulandı | Kaynak sinyali güçlü |
| `CuratedSourceLabels` PARTIAL | Kanıt: kısmi doğrulama | Sinyal: kısmi kaynak profili |
| `CuratedSourceLabels` SINGLE_SOURCE | Kanıt: tek kaynak | Sinyal: tek kaynak |
| `CuratedSourceLabels` LOW_CONFIDENCE | Kanıt: düşük güven | Sinyal: düşük profil |
| `CuratedSourceLabels` FILTERED | Kanıt: filtrelendi | Sinyal: filtrelendi |
| `TrustTransparencyUiLogic` whyShown | Kanıt durumu | Kaynak sinyali |
| `TrustTransparencyUiLogic` uyarı | çoklu doğrulama yok | ek kaynak sinyali yok |
| `FeedScreen` boş akış | Doğrulama, önem ve güvenlik… | Kaynak sinyali, önem ve güvenlik… |
| `FeedScreen` RSS başlık | AI doğrulaması değildir | haber doğrulama hizmeti değildir |
| `FeedScreen` banner | sayaç doğrulaması | sayaç kontrolü |
| `FeedScreen` izleme listesi | Kanıt: … | Sinyal: … |
| `ArticleDetailScreen` | AI doğrulaması değildir | haber doğrulama veya AI teyidi değildir |
| `AiCuratedDetailScreen` | Güven: %N | Yardımcı değerlendirme: %N |
| `SmartDigestSection` | Güven: … | Özet güveni: … |
| `MockSmartFeedAnalyzer` publishReason | Çok kaynaklı doğrulama | Çok kaynaklı kaynak sinyali |
| `MockSmartFeedAnalyzer` warning | Doğrulama bekleniyor | Ek kaynak sinyali bekleniyor |
| API legacy passthrough | (sanitize) Doğrulama/Kanıt: … | Ek kaynak sinyali / Sinyal: … |
| Trust ekranları (yeni) | — | Bu sinyal haberin doğruluğunu tek başına garanti etmez. |
| Kaynak kartı CTA | Orijinal habere git | Orijinal kaynağa git |

## Kalan riskli ifade taraması (production UI)

`apps/android/app/src/main` grep sonrası:

| İfade | Durum |
|-------|--------|
| Kanıt / kanıtlandı / doğrulandı (kullanıcı metni) | **Yok** — yalnızca `sanitizeTrustDisplayText` eşleme girdileri |
| Doğrulama (olumlu iddia) | **Yok** — negasyon metinleri (“haber doğrulama hizmeti **değildir**”) bilinçli |
| Kesin doğru / yalan haber / teyit edildi | **Yok** |
| Kod yorumları / KDoc | Mock yorumu, Article KDoc — kullanıcıya görünmez |

API, Source Registry, Manifest/Gradle/XML: **değişmedi**.

## Test / build

| Suite | Sonuç |
|-------|-------|
| `:app:testDebugUnitTest` | **PASS** |
| `TrustUxLanguageTest` | **PASS** |
| `:app:assembleDebug` | **PASS** |

## Cihaz smoke

| Adım | Sonuç |
|------|-------|
| `:app:installDebug` | (merge öncesi doğrulanabilir) |
| Launch + trust metinleri | Beklenen: Sinyal / Kaynak sinyali disclaimer |

## Kapsam dışı (bilinçli)

| Konu | Durum |
|------|-------|
| API `publish-gate.ts` metinleri | **Değişmedi** — Android `sanitizeTrustDisplayText` ile UI’da güvenli gösterim |
| Source Registry / Android seed | **Değişmedi** |
| HTTPS hardening (B5) | **OPEN** |
| Publish gate | **Açılmadı** |
| Manifest/Gradle/XML | **Değişmedi** |

## Değişen dosyalar

- `CuratedSourceLabels.kt`, `TrustTransparencyUiLogic.kt`, `TrustTransparencyComponents.kt`
- `FeedScreen.kt`, `ArticleDetailScreen.kt`, `AiCuratedDetailScreen.kt`, `SmartDigestSection.kt`
- `MockSmartFeedAnalyzer.kt` (mock UI metinleri)
- `TrustUxLanguageTest.kt`, `TrustTransparencyUiLogicTest.kt`
