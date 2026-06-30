# TCMB Feed Audit v0.3 — Post Parser Fix Teknik Yeniden Denetim

**Branch:** `docs/tcmb-feed-audit-v0.3`  
**Main baseline:** `c71fa6b` (PR #63 merge)  
**Audit tarihi:** 2026-06-30  
**Play/KVKK/B5:** Dokunulmadı  
**Kod değişikliği:** Yok (evidence-only)

---

## Özet

PR #62 (Türkçe tarih parse) ve PR #63 (ToS/legal review) sonrası **TCMB Basın Duyuruları** Atom feed’i yeniden teknik olarak denetlendi. Tam metin/scrape yapılmadı.

| Sonuç katmanı | Değer |
|---------------|--------|
| **Teknik feed** | **`TECHNICAL_FEED_STATUS=PASS`** |
| **ToS/legal gate** | **PASS değil** (PR #63) |
| **Final seed gate** | **`TCMB_SEED_GATE=NEEDS_REVIEW`** |

> **Gate kuralı:** Teknik PASS seed izni **değildir**. ToS/legal PASS veya yazılı izin olmadan TCMB Android seed **açılmaz**.

---

## Referans PR’lar

| PR | İçerik | Gate etkisi |
|----|--------|-------------|
| **#62** | Türkçe RSS tarih parse (`Europe/Istanbul`) | Teknik tarih blocker ✅ kapandı |
| **#63** | ToS/legal review | `NEEDS_REVIEW` / Play `LICENSE_REQUIRED` — seed kapalı |

---

## Denetlenen feed

| Alan | Değer |
|------|--------|
| Kaynak | TCMB — Basın Duyuruları |
| Registry `sourceId` | `tcmb` *(registry; seed değil)* |
| Feed URL | `https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Bottom+Menu/Diger/RSS/Basin+Duyurulari` |
| Format | Atom XML |
| Önerilen `legalMode` | `RSS_METADATA_ONLY` *(seed öncesi)* |

---

## Network audit çıktıları

Komutlar: `curl -I -L --max-time 15`, `curl -sL --max-time 20` (metadata alan yapısı only).

```text
HEAD …/RSS/Basin+Duyurulari
→ HTTP/1.1 200 OK
→ Content-Type: text/html; charset=UTF-8   (header yanlış; gövde Atom XML)

GET …/RSS/Basin+Duyurulari
→ 9980 bytes
→ entry_count: 20
→ entry title (CDATA): 20/20 dolu, 0 boş
→ alternate link href: 20/20 dolu
→ published: 20/20 dolu
→ örnek: <published>18 Haz 2026 14:00:00</published>
→ summary: boş/whitespace (metadata-only uygun)
```

| Kontrol | Sonuç |
|---------|--------|
| HTTP erişim | ✅ 200 |
| Content-Type header | ⚠️ `text/html` (gövde XML — runtime izleme notu) |
| Entry sayısı | 20 |
| Title doluluk | **20/20 (100%)** |
| Link doluluk | **20/20 (100%)** |
| published/updated | Var; Türkçe ay formatı |

---

## Entry alan analizi (metadata-only)

| Alan | Durum | RSS_METADATA_ONLY |
|------|--------|-------------------|
| `title` (entry CDATA) | Dolu | ✅ allowed |
| `link` (alternate href) | Dolu | ✅ allowed → `canonicalUrl` |
| `published` | Türkçe locale | ✅ allowed → `publishedAt` |
| `summary` | Boş | ✅ forbidden body yok |
| `body` / tam metin | Yok | ✅ |

Feed düzeyi `<title></title>` boş — entry düzeyinde sorun yok (v0.2 düzeltmesi teyit).

---

## PR #62 sonrası tarih parse sonucu

Geçici local probe (commit edilmedi): main branch `RssParser` + canlı feed örneği.

| Test | Sonuç |
|------|--------|
| `parseXml` entry sayısı | 20/20 |
| İlk entry `pubDate` | `18 Haz 2026 14:00:00` |
| `toArticles` → `publishedAt` | `2026-06-18 14:00:00 Europe/Istanbul` epoch |
| `now` fallback kullanıldı mı? | **Hayır** — PR #62 fix doğrulandı |

v0.2’deki blocker (**publishedAt = now**) **kapanmış** durumda.

---

## Teknik sonuç

```text
TECHNICAL_FEED_STATUS=PASS
```

| Kriter | Durum |
|--------|--------|
| Feed erişilebilir | ✅ |
| Atom parse (title/link) | ✅ 20/20 |
| Türkçe tarih parse (PR #62) | ✅ |
| Metadata-only alan uyumu | ✅ |
| RSS varlığı = izin | N/A — ToS ayrı gate |

---

## Final seed sonucu

```text
TCMB_SEED_GATE=NEEDS_REVIEW
REASON=ToS/legal PASS yok; yazılı izin veya hukuk teyidi yok.
```

### Neden seed açılmadı

1. **PR #63 ToS/legal gate PASS değil** — ticari kullanım yazılı izin maddesi
2. Play/public: **`LICENSE_REQUIRED`**
3. Registry `feedUrl` / review evidence henüz güncellenmedi
4. Bu PR **bilinçli olarak seed açmaz** — teknik PASS yeterli değil

### Android seed durumu

| Kontrol | Sonuç |
|---------|--------|
| TCMB seed eklendi mi | **Hayır** |
| Binding değişti mi | **Hayır** (3 kaynak: NTV, BBC, Habertürk) |
| Registry `feedUrl` | **Değişmedi** |

---

## Sonraki koşullar (seed PR öncesi)

1. **ToS/legal PASS** veya TCMB **yazılı izin** (Play/ticari yol için zorunlu)
2. Registry `feedUrl` + `reviewStatus` evidence güncellemesi
3. Attribution UX kanıtı (kaynak adı + link-out)
4. Ayrı kod PR: `feat/tcmb-official-feed-seed-v0` (Basın Duyuruları only, controlled enable)

---

## Doğrulama

| Kontrol | Sonuç |
|---------|--------|
| Kod değişti mi | **Hayır** |
| Parser değişikliği | **Hayır** |
| Manifest/Gradle/XML | **Hayır** |
| Test çalıştırıldı mı | Geçici parser probe (commit edilmedi); kalıcı test eklenmedi |
| Docs notu | `Test çalıştırılmadı; docs/evidence-only audit PR.` |
| Network doğrulama | **Evet** — curl özetleri yukarıda |
| Play/KVKK/B5 | Dokunulmadı |

---

## v0.2 → v0.3 delta

| Alan | v0.2 | v0.3 |
|------|------|------|
| Türkçe tarih parse | ❌ `now` fallback | ✅ Istanbul epoch |
| Teknik feed | NEEDS_REVIEW (tarih) | **PASS** |
| ToS/legal | NEEDS_REVIEW | NEEDS_REVIEW (değişmedi) |
| Seed gate | Kapalı | **Kapalı** |
