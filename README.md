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
| Bluesky | Mock adapter sınırı | Gelecekte evet |
| YouTube | Mock adapter sınırı | Gelecekte evet |
| Sample events | Sabit örnek veri | — |
| X / TikTok / Instagram | Yok | — |

Connector hatası API'yi düşürmez; fallback/mock moduna geçer.

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

**Terminal 1 — API:**

```bash
pnpm dev:api
```

**Terminal 2 — Mobil:**

```bash
pnpm dev:mobile
```

### API adresi

| Ortam | URL |
|--------|-----|
| PC / curl | `http://localhost:3001` |
| Android emülatör | `http://10.0.2.2:3001` (otomatik) |
| Fiziksel Expo Go | `$env:EXPO_PUBLIC_API_URL="http://<LAN-IP>:3001"` |

Şablon: `apps/mobile/.env.example`

## API uçları

| Uç | Açıklama |
|-----|----------|
| `GET /health` | Sağlık |
| `GET /api/events` | Radar akışı |
| `GET /api/signals` | Sosyal sinyaller (sample) |
| `GET /api/notification-candidates` | Push adayları |
| `GET /api/sources/status` | Connector modları (live/fallback/mock) |
| `GET /api/ingest/preview` | Canlı ingest önizlemesi |
| `POST /api/refresh` | Olay havuzunu yenile |

## Doğrulama (PowerShell)

```powershell
Invoke-RestMethod http://localhost:3001/health
(Invoke-RestMethod http://localhost:3001/api/events).count
Invoke-RestMethod http://localhost:3001/api/sources/status
```

## Typecheck

```bash
pnpm --filter @haber-radari/news-core typecheck
pnpm --filter @haber-radari/connectors typecheck
pnpm --filter @haber-radari/api typecheck
pnpm --filter @haber-radari/mobile typecheck
```

Test script yok (MVP-2A).

## Sonraki faz

- MVP-2B: Bluesky Jetstream / YouTube (API key ile)
- MVP-3: Push
- MVP-4: Konum
