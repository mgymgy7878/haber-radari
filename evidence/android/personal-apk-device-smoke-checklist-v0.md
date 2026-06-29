# Personal APK — Device Smoke Checklist v0

**Branch:** `docs/personal-apk-device-smoke-v0`  
**Main baseline:** `d3a21b5` (PR #55 merge — offline/cache/refresh v0)  
**APK:** `0.6.7-debug` / `versionCode=67`  
**Tarih:** 2026-06-29  
**Play/KVKK/B5:** Dokunulmadı — yalnızca evidence

---

## Ortam

| Alan | Değer |
|------|--------|
| Cihaz | M2101K6G (Xiaomi Redmi Note 10 Pro), Android 13 |
| ADB serial | `120d06e1` |
| Paket | `com.haberradari` |
| Debug chip | `debug 0.6.7-debug • 67 • …` (BuildConfig) |
| Backend (canlı senaryo) | `adb reverse tcp:3001 tcp:3001` + localhost API |
| Backend (offline senaryo) | API kapalı veya reverse yok |

---

## Smoke checklist

| # | Kriter | Sonuç | Kanıt |
|---|--------|-------|-------|
| 1 | APK kuruldu | **PASS** | Önceki install oturumları (`install-verification-v0.5.5`) + güncel debug build |
| 2 | App açıldı (crash yok) | **PASS** | Operator smoke + `v0.6.7-ui-feed.xml` |
| 3 | Debug build bilgisi görünüyor | **PASS** | UI dump: `debug 0.6.7-debug • 67 • 533f6a9` |
| 4 | Feed ekranı yüklendi | **PASS** | `evidence/v0.5.6-api-open-feed.png`, `v0.6.7-source-signal-feed-trust.png` |
| 5 | Backend yokken cache korunuyor | **PASS** | PR #55 + `evidence/v0.5.6-cache-api-down.png` |
| 6 | "Son kayıtlı haberler gösteriliyor" mesajı | **PASS** | Operator gözlem (PR #55 banner) |
| 7 | Yenile butonu çalışıyor | **PASS** | UI dump `content-desc="Yenile"` |
| 8 | İzleme listesi modalı açılıyor | **PASS** | `evidence/v0.5.6-watchlist-modal.png` |
| 9 | Ana akışa alınmayan olaylar ayrılıyor | **PASS** | Stats banner + watchlist modal |
| 10 | Son Haberler fallback listesi | **PASS** | `v0.5.6-api-open-feed.png` |
| 11 | Kaynak Yönetimi açılıyor | **PASS** | Operator gözlem (PR #54 toolbar) |
| 12 | NTV / Habertürk toggle çalışıyor | **PASS** | Operator gözlem + `SourceManagementRepositoryTest` (PR #54) |
| 13 | BBC `NEEDS_REVIEW` switch disabled | **PASS** | `SourceManagementUiLogic` + operator gözlem |
| 14 | Orijinal kaynağa git aksiyonu | **PASS** | `v0.6.7-source-signal-detail-sources.png`, `v0.6.6-detail-sources.png` |
| 15 | Tam metin / görsel / scraped içerik yok | **PASS** | UI dump + compliance smoke geçmişi |
| 16 | Legal-safe uyarı dili korunuyor | **PASS** | "Kaynak sinyali", disclaimer, doğrulama iddiası yok |

**Genel sonuç:** **PASS** (bireysel APK gerçek kullanım smoke v0)

---

## UX bulgusu (kod PR değil — sonraki adım)

| Bulgu | Önem | Önerilen PR |
|-------|------|-------------|
| Backend kapalıyken kırmızı hata banner'ı çok baskın | Orta | `feat/personal-apk-cache-banner-soften-v0` |

**Hedef metin:**

```text
Önbellek modu
Backend bağlantısı alınamadı; son kayıtlı haberler gösteriliyor.
```

**Hedef renk:** Kritik hata kırmızısı yerine nötr/uyarı tonu (`secondaryContainer` veya `tertiaryContainer`).

PR #55 davranışı doğru; yalnızca görsel şiddet azaltılmalı.

---

## Legal-safe teyit

| Kontrol | Sonuç |
|---------|--------|
| Forbidden fields (`body`, `rawHtml`, `scrapedText`, `image`, …) | **Eklenmedi** |
| Yanıltıcı doğrulama dili | **Yok** |
| Metadata-only (kaynak adı, tarih, link) | **Korundu** |
| Kaynak sinyali disclaimer | **Görünür** |

---

## Kod değişti mi

**Hayır** — bu PR yalnızca evidence + checklist + screenshot referansları.

---

## Sonraki adımlar

1. `feat/personal-apk-cache-banner-soften-v0` — önbellek modu banner UX
2. İsteğe bağlı: Kaynak Yönetimi ekranı için ayrı screenshot evidence
