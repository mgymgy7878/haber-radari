# Google Play Data Safety — Taslak v0

> **Bu belge taslaktır; Google Play Console’a gönderilmiş nihai Data Safety beyanı değildir.**  
> **Güncel Play Console ekranı ve soru seti ile teyit gerekir.**  
> **Yayın öncesi hukuk danışmanı teyidi gerekir.**

**Sürüm:** v0  
**Son güncelleme:** 2026-06-29  
**Blocker:** B3 **OPEN** — draft prepared, Play Console submission pending

---

## 1. Kaynak belgeler

| Belge | Rol |
|-------|-----|
| [data-inventory-v0.md](./data-inventory-v0.md) | Teknik veri envanteri SSOT |
| [privacy-policy-draft-v0.md](./privacy-policy-draft-v0.md) | Privacy Policy taslak (B1 OPEN) |
| [kvkk-aydinlatma-draft-v0.md](./kvkk-aydinlatma-draft-v0.md) | KVKK aydınlatma taslak (B2 OPEN) |
| [play-kvkk-readiness-v0.md](./play-kvkk-readiness-v0.md) | Blocker checklist |

**Tutarlılık kuralı:** Data Safety cevapları Privacy Policy ve KVKK metinleriyle çelişmemelidir. Çelişki tespit edilirse **release blocker**.

---

## 2. Current data collection summary (v0.6.7-debug)

| Alan | Taslak özet |
|------|-------------|
| Hesap / e-posta | Toplanmıyor |
| Konum | Toplanmıyor |
| Push token | Toplanmıyor |
| Analytics SDK | Entegre değil (repo scan) |
| Crash SDK | Entegre değil (repo scan) |
| Cihazda cache | Smart feed JSON + Room DB |
| Backend logları | IP, User-Agent, istek metadata (muhtemel) |
| Mobil API/LLM key | APK’da yok |

---

## 3. Current not-collected data

- Account email / name / phone  
- Precise or approximate location  
- Contacts, photos, microphone, calendar  
- Payment / financial info  
- Push notification tokens  
- In-app analytics identifiers (SDK yok)  
- Crash stack traces via third-party SDK (yok)

---

## 4. Future / conditional data

| Veri | Tetikleyici | Data Safety etkisi |
|------|-------------|-------------------|
| Push token | Push özelliği | Device or other IDs — collected |
| Approximate location | Weather/regional feed | Location — collected + permission |
| Analytics events | Firebase/Mixpanel vb. | App activity — collected |
| Crash logs | Crashlytics/Sentry | Diagnostics — collected |
| Account email | Hesap sistemi | Personal info — collected |
| LLM metadata | External smart digest ON | Backend + third party — teyit |

---

## 5. Device-only data

| Veri | Saklama | Backend’e gider mi? |
|------|---------|---------------------|
| `smart_feed_cache.json` | `cacheDir` | Hayır |
| Room SQLite articles | Cihaz | Hayır |
| DataStore preferences | Cihaz | Hayır (gözlem) |

Kullanıcı kontrolü: Android → Uygulama → Depolama → Veriyi temizle.

---

## 6. Backend request metadata

Mobil uygulama `GET /api/v1/smart-feed` çağrısı yapar. Sunucu tarafında muhtemel:

- IP adresi  
- User-Agent  
- İstek zamanı / path  
- Hata logları  

**Retention:** `[90 gün — HUKUK / OPS TEYİDİ]`  
**Play form:** “Diagnostics” veya “App info and performance” — **güncel Play Console ile teyit gerekir**.

---

## 7. Third-party sharing

| Taraf | v0 | Veri |
|-------|-----|------|
| Haber kaynağı web siteleri | Link-out (Custom Tabs) | Uygulama doğrudan toplamaz; site kendi politikası |
| LLM sağlayıcı | Kapalı / mock | External digest OFF ise paylaşım yok |
| Analytics | Yok | — |
| Hosting/CDN | `[TEYİT]` | Sunucu logları |

---

## 8. Security practices (placeholder)

| Konu | v0 | Production hedefi |
|------|-----|-------------------|
| Transit encryption | Debug HTTP cleartext | HTTPS zorunlu (B5 OPEN) |
| Data at rest (device) | OS sandbox | Aynı |
| Data at rest (server) | `[TEYİT]` | Encryption at rest teyit |
| API key in mobile | Yok | Yok |

---

## 9. Deletion / account status

- **Hesap:** Yok → Play “account deletion” **N/A** adayı (hukuk + Play teyidi)  
- **Yerel veri:** Kullanıcı OS üzerinden silebilir  
- **Sunucu logları:** Retention politikası teyit gerekir  

---

## 10. Children / age target

| Alan | Taslak |
|------|--------|
| Target age | `[13+ / 18+ — HUKUK TEYİDİ]` |
| Designed for children | No (taslak) |

---

## 11. Data Safety answer matrix

> **Play Data Safety draft answer** sütunu öneridir; Console’a girilmemiştir.

| Data category | Data item | Current status | Sent to backend? | Shared with third party? | Purpose | User control | Retention | Privacy Policy § | KVKK § | Play draft answer | Confidence | Blocker / note |
|---------------|-----------|----------------|------------------|--------------------------|---------|--------------|-----------|------------------|--------|-------------------|------------|----------------|
| Personal info | Account email | not_used | No | No | Auth | N/A | N/A | §4 | §2 | Not collected | high | No account |
| Personal info | Name | not_used | No | No | — | N/A | — | §4 | §2 | Not collected | high | |
| Location | Precise location | not_used | No | No | — | N/A | — | §7 | §12 future | Not collected | high | Avoid unless explicit feature |
| Location | Approximate location | future | No | No | Weather feed | Opt-in future | TBD | §7 | §12 | Not collected (v0) | high | |
| App activity | News category preference | device-only / partial | No | No | Filtering | Clear app data | Device | §3.1 | §2 | Not collected / on-device only — **teyit** | medium | Classifier vs user pref ayrımı |
| App activity | Muted sources | future | No | No | UX | Clear app data | Device | §3.1 | §12 | Not collected (v0) | medium | Feature future |
| App activity | Read history | future | No | No | UX | Clear app data | Device | §3.1 | §12 | Not collected (v0) | medium | |
| App activity | Feed cache | device-only | No* | No | Offline | Clear app data | Until overwrite | §3.1 | §2 | Not collected — **teyit** | medium | *Response from server |
| App info | Crash logs | not_used | No | No | Stability | N/A | — | §6 | — | Not collected | high | No crash SDK |
| App info | Diagnostics / logs | current | Yes (server) | Hosting `[TEYİT]` | Ops/security | N/A | `[90d]` | §6 | §2 | Collected — **teyit** | low | IP/UA classification |
| Device IDs | Push token | not_used | No | No | Push | N/A | — | §8 | §12 | Not collected | high | |
| Device IDs | Analytics ID | not_used | No | No | Analytics | N/A | — | §6 | — | Not collected | high | No SDK |
| Financial | Payment info | not_used | No | No | — | N/A | — | §4 | — | Not collected | high | Ad-free |
| Web browsing | Link clicks tracked | not_used | No | No | — | User opens browser | N/A | §3.3 | §5 | Not collected | medium | No click telemetry found |
| Other | RSS metadata | current | Yes (ingest) | Source sites | Feed | N/A | Cache TTL | §3.3 | §2 | Not personal data — **teyit** | medium | Title/link only |
| Other | LLM prompt metadata | future/disabled | If enabled | LLM provider | Helper digest | N/A | TBD | §5 | §6 | Not collected (v0 external off) | high | Mock/disabled |
| Other | API key on device | not_used | No | No | — | N/A | — | §5 | — | Not collected | high | Server-only keys |

---

## 12. Open blockers

| ID | Durum |
|----|--------|
| B1 | OPEN — Privacy URL yok |
| B2 | OPEN — KVKK nihai metin yok |
| B3 | **OPEN** — bu taslak; Console submission yok |
| B5 | OPEN — cleartext debug |
| Tutarlılık | Privacy/KVKK/Data Safety üçlüsü nihai review bekliyor |

---

## 13. Hukuk danışmanı teyidi gereken alanlar

1. IP / server log — kişisel veri mi, Data Safety’de nasıl işaretlenecek?  
2. On-device cache — “collected” sayılır mı?  
3. RSS metadata — personal data sınırı  
4. Hesapsız uygulama deletion beyanı  
5. Yurt dışı hosting / LLM aktarımı (açılırsa)  
6. Yaş hedefi ve çocuklar politikası  

---

## 14. Play Console submission checklist (post-draft)

- [ ] Güncel Data Safety soru setini Console’da aç ve bu matrisle satır satır karşılaştır  
- [ ] Privacy Policy URL canlı ve linkli  
- [ ] KVKK metni erişilebilir (TR)  
- [ ] Engineering sign-off (data-inventory güncel)  
- [ ] Legal sign-off  
- [ ] Internal QA: uygulama davranışı = beyan  

---

## İlişkili belgeler

- [News Declaration Taslak v0](./news-declaration-draft-v0.md)  
- [Evidence snapshot](../../evidence/compliance/data-safety-news-declaration-v0.md)
