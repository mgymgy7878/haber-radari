# AFAD Feed URL Regression Fix v0

**Branch:** `fix/afad-feed-url-regression-v0`  
**Main baseline:** `a08d0cb` (PR #59 merge)  
**Tarih:** 2026-06-30  
**Play/KVKK/B5:** Dokunulmadı

---

## Sorun

PR #58 ile Android seed'e eklenen AFAD kaynağı:

```text
feedUrl: https://www.afad.gov.tr/rss
```

PR #59 audit (`evidence/research/official-feeds-url-audit-v0.1.md`) anında **302 → 404** döndü. Kullanıcı Kaynak Yönetimi'nde AFAD açık görür, yenilemede veri akmaz — kullanılabilirlik regresyonu.

---

## Fix kararı

| Seçenek | Karar |
|---------|--------|
| Sahte/yeni URL tahmin | Hayır |
| Kırık feed ile default açık bırak | Hayır |
| Android runtime binding'den çıkar | **Evet** |
| Registry `afad_official` kaydı | Kalır |
| Mevcut kurulum (PR #58) | `afad-official` satırı varsa **enabled=false** |

---

## Kod değişiklikleri

| Dosya | Değişiklik |
|-------|------------|
| `AndroidSeedRegistryDeriver.kt` | AFAD binding/enable/category/parity kaldırıldı; `ANDROID_SEED_RETIRED_RUNTIME_IDS_V0` eklendi |
| `NewsRepository.kt` | `retireRemovedSeedSources()` — retired id'ler kapatılır |
| `AndroidSeedRegistryDeriverTest.kt` | Seed sayısı 3; AFAD runtime'da yok |
| `SourceSeedRefreshPolicyTest.kt` | Fresh install 3; retired AFAD disable testi |

**Android seed (3):** `ntv-turkiye`, `bbc-turkce`, `haberturk`

---

## Doğrulama

| Kontrol | Sonuç |
|---------|--------|
| Registry JSON değişti mi | Hayır |
| Manifest/Gradle/XML | Dokunulmadı |
| Unit test | `AndroidSeedRegistryDeriverTest`, `SourceSeedRefreshPolicyTest` güncellendi |

---

## Sonraki adım

Valid AFAD RSS URL + ToS evidence PASS sonrası binding geri eklenebilir (`feat/personal-apk-source-expansion-official-feeds-v0.2`).
