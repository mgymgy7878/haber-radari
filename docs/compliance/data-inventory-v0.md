# Data Inventory v0

> **Bu envanter taslaktır; hukuki nihai sınıflandırma değildir. Yayın öncesi hukuk danışmanı teyidi gerekir.**

**Sürüm:** v0  
**Son güncelleme:** 2026-06-29  
**Amaç:** Play Data Safety ve KVKK aydınlatma için teknik veri akışı SSOT taslağı

**Durum kodları:** `current` | `future` | `not_used`

---

## Envanter tablosu

| Data item | Source | Device-only? | Backend? | Third-party SDK? | Purpose | Legal basis (placeholder) | Retention (placeholder) | Data Safety impact | KVKK impact | Status |
|-----------|--------|--------------|----------|------------------|---------|---------------------------|-------------------------|-------------------|-------------|--------|
| Smart feed JSON cache | API response → local file | Evet | Hayır (yanıt sunucudan gelir) | Hayır | Offline fallback | `[TEYİT]` | Cihazda üzerine yazılana kadar | App activity / diagnostics (teyit) | Yerel işleme teyit | current |
| Room article metadata | RSS ingest (local) | Evet | Hayır | Hayır | Yerel haber listesi | `[TEYİT]` | Cihazda | Possibly none if not PII | Teyit | current |
| DataStore preferences | User settings | Evet | Hayır | Hayır | UX tercihleri | `[TEYİT]` | Cihazda | Teyit | Teyit | current |
| Haber kategori tercihi | User / classifier | Evet | Hayır | Hayır | Filtreleme | `[TEYİT]` | Cihazda | Teyit | Teyit | current / partial |
| Sessize alınan kaynaklar | User action | Evet | Hayır | Hayır | Kaynak susturma | `[TEYİT]` | Cihazda | Teyit | Teyit | future |
| Okuma geçmişi | User opens article | Evet | Hayır | Hayır | UX (son okunanlar) | `[TEYİT]` | Cihazda | Teyit | Teyit | future |
| API request metadata | OkHttp client | Hayır | Evet (server logs) | Hayır | API ops, security | `[TEYİT]` | `[90g teyit]` | Device/other IDs (teyit) | İşlem güvenliği teyit | current |
| Device / network info | HTTP stack, OS | Kısmen | Evet (logs) | Hayır | Troubleshooting | `[TEYİT]` | `[90g teyit]` | Diagnostics (teyit) | Teyit | current |
| IP address | Server access log | Hayır | Evet | Hayır | Security, rate limit | `[TEYİT]` | `[90g teyit]` | Possibly collected | Kişisel veri teyit | current |
| Crash logs | — | — | — | — | Stability | — | — | Crash data | Teyit | not_used |
| Analytics events | — | — | — | — | Product analytics | — | — | App interactions | Teyit | not_used |
| Push token (FCM) | — | — | — | — | Notifications | — | — | Device ID | Açık rıza | not_used |
| Approximate location | — | — | — | — | Weather/regional feed | — | — | Location | Açık rıza | not_used |
| Account email | — | — | — | — | Authentication | — | — | Personal info | Açık rıza / sözleşme | not_used |
| LLM prompt metadata | Backend smart digest | Hayır | Evet | LLM provider (if enabled) | Metadata-only digest | `[TEYİT]` | `[TEYİT]` | Teyit | Yurt dışı aktarım teyit | future / disabled |
| Original source link click | User tap → Custom Tabs | Üçüncü taraf site | Hayır (doğrudan) | Tarayıcı / haber sitesi | Link-out | Kullanıcı eylemi | Oturum | Not collected by app (teyit) | Üçüncü taraf | current |
| RSS title / URL / pubDate | NTV, Habertürk RSS | Kısmen | Evet (ingest) | Haber kaynağı | Feed content | `[TEYİT]` | Feed cache TTL | No PII (teyit) | Metadata teyit | current |
| aiSummary / shortDescription | RSS snippet → API | Hayır | Evet | Hayır | Card display | `[TEYİT]` | Cache 5 min | No PII (teyit) | Telif/policy teyit | current |
| Smart digest LLM output | Backend | Hayır | Evet | LLM (if on) | Helper summary | `[TEYİT]` | Cache | Teyit | Teyit | future / mocked |
| Watchlist / raw preview IDs | API debug paths | Evet (display) | Evet | Hayır | Debug UX | `[TEYİT]` | Session | Teyit | Teyit | current |

---

## Özet: current vs future vs not_used

| Status | Count (yaklaşık) | Not |
|--------|------------------|-----|
| current | 10+ | Feed, cache, API logs, RSS metadata |
| future | 5 | Konum, push, analytics, hesap, LLM external |
| not_used | 5 | Crash, analytics, push, location, account |

---

## Play Data Safety — taslak eşleme

| Play kategorisi | v0 taslak |
|-----------------|-----------|
| Personal info (name, email) | Not collected |
| Financial info | Not collected |
| Location | Not collected |
| Photos/videos | Not collected |
| Audio | Not collected |
| Contacts | Not collected |
| App activity | Possibly (cache, local DB) — **teyit** |
| Web browsing | Link-out only; app collects click? **teyit** |
| App info / performance | Crash: not_used; diagnostics: server logs teyit |
| Device IDs | Not used explicitly; push N/A |

---

## KVKK — taslak eşleme

- Aydınlatma metni: `kvkk-aydinlatma-draft-v0.md`  
- Privacy Policy: `privacy-policy-draft-v0.md`  
- Ayrı belgeler; birbirinin yerine geçmez.

---

## Hukuk danışmanı teyidi gereken satırlar

1. IP / User-Agent — kişisel veri mi?  
2. Cihaz cache — veri sorumlusu işlemesi mi?  
3. RSS metadata — kişisel veri içerir mi?  
4. LLM metadata satırı — external açılınca aktarım  
5. Link-out — uygulama veri topluyor mu sayılır?  
6. Data Safety “App activity” işaretleme kararı

---

## İlişkili belgeler

- [Play/KVKK Readiness v0](./play-kvkk-readiness-v0.md)  
- [Privacy Policy Taslak v0](./privacy-policy-draft-v0.md)  
- [KVKK Aydınlatma Taslak v0](./kvkk-aydinlatma-draft-v0.md)
