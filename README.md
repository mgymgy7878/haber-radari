# Haber Radarı

Kişisel **önemli gelişme radarı** — reklam, clickbait, 3. sayfa ve ilgisiz yerel haberleri filtreleyen Android odaklı mobil uygulama.

## Yapı

```
haber-radari/
├── apps/mobile      Expo React Native
├── apps/api         Fastify API
├── packages/news-core   Policy, skorlama, source metadata
└── packages/connectors  TRT RSS, GDELT, sosyal adapter sınırları
```

## Kaynaklar (MVP-2A)

| Kaynak | Durum | API key |
|--------|--------|---------|
| TRT RSS | Gerçek fetch + fallback | Hayır |
| GDELT DOC | Public endpoint + fallback | Hayır |
| Bluesky Jetstream | Kısa önizleme (`app.bsky.feed.post`) | Hayır |
| YouTube | `search.list` — `YOUTUBE_API_KEY` ile gated-live | Evet (sunucu) |
| Sample events | Sabit örnek veri | — |
| X / TikTok | Gated — token/onay gerekir (MVP-2D yok) | Evet (gelecek) |
| Instagram | Bu fazda yok | — |

Connector hatası API'yi düşürmez; fallback/mock moduna geçer.

## İçerik kalitesi (MVP-2B)

- **Cluster / dedup:** Başlık fingerprint + konu benzerliği; küme tekrarları baskılanır.
- **Eski haber cezası (saat):** `fresh` ≤6 saat · `recent` 6–24 · `aging` 24–48 · `stale` 48+
- **Kaynak güven matrisi:** official > market > editorial > aggregator > social
- **Sosyal-only:** Tek başına `notify_candidate` olamaz
- **Neden gördüm?:** `reasonBullets` (kartta gösterim MVP-2C)

## Radar açıklanabilirliği (MVP-2C)

Mobil kartlarda: **Neden gördüm?** · **Bildirim durumu** (`notificationReason`) · **Kaynak/güven** (`sourceSummary`) · **Teyit özeti** · baskılama gerekçesi (Ayarlar debug).

Etiketler: DOĞRULANDI, RESMÎ, ERKEN SİNYAL, BİLDİRİM ADAYI, İNCELE, BASKILANDI.

## Gereksinimler

- Node.js 20+
- pnpm 9+

## Kurulum

```bash
pnpm install
pnpm --filter @haber-radari/news-core build
pnpm --filter @haber-radari/connectors build
```

## Çalıştırma

**Terminal 1 — API:** `pnpm dev:api`  
**Terminal 2 — Mobil:** `pnpm dev:mobile`

### API adresi

| Ortam | URL |
|--------|-----|
| PC / curl | `http://localhost:3001` |
| Android emülatör | `http://10.0.2.2:3001` |
| Fiziksel Expo Go | `$env:EXPO_PUBLIC_API_URL="http://<LAN-IP>:3001"` |

## API uçları

| Uç | Açıklama |
|-----|----------|
| `GET /health` | Sağlık |
| `GET /api/events` | Radar akışı |
| `GET /api/signals` | Sosyal sinyaller |
| `GET /api/notification-candidates` | Push adayları |
| `GET /api/sources/status` | Connector durumu |
| `GET /api/ingest/preview` | Ingest önizleme + `quality` özeti |
| `GET /api/social/status` | Sosyal platform durumları |
| `GET /api/social/preview` | Sosyal önizleme (`q`, `limit`, `timeoutMs`) |
| `GET /api/notification-queue` | Bildirim adayı kuyruğu (push yok) |
| `POST /api/refresh` | Olay havuzunu yenile |

## Typecheck

```bash
pnpm --filter @haber-radari/news-core typecheck
pnpm --filter @haber-radari/connectors typecheck
pnpm --filter @haber-radari/api typecheck
pnpm --filter @haber-radari/mobile typecheck
```

## Sosyal sinyal pipeline (MVP-2D)

- **Bluesky:** Jetstream JSON WebSocket kısa önizleme (timeout/abort; sunucuyu kilitlemez).
- **YouTube:** `YOUTUBE_API_KEY` varsa `search.list`; yoksa `gated` — hata fırlatılmaz.
- **X / TikTok:** Yalnızca adapter durumu (`requiresApprovalOrToken`); scraping yok.
- **Bildirim kuyruğu:** `GET /api/notification-queue` — push göndermez; sosyal-only dışlanır.
- Secret'lar mobil uygulamaya konmaz; `.env.example` kök dizinde.

```bash
cp .env.example .env
# YOUTUBE_API_KEY=...  (isteğe bağlı)
pnpm dev:api
```

## Sonraki faz

- MVP-2E: Push bildirimleri
- MVP-3: Konum / gelişmiş filtreler
