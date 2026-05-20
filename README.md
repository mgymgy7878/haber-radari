# Haber Radarı

Kişisel **önemli gelişme radarı** — reklam, clickbait, 3. sayfa ve ilgisiz yerel haberleri filtreleyen Android odaklı mobil uygulama (MVP-1).

## Yapı

```
haber-radari/
├── apps/mobile      Expo React Native (Android)
├── apps/api         Fastify API
├── packages/news-core   Skorlama, politika motoru, örnek veriler
└── packages/connectors  TRT RSS / GDELT / sosyal mock
```

## Gereksinimler

- Node.js 20+
- pnpm 9+
- Android emülatör veya fiziksel cihaz (Expo Go)

## İlk kurulum (bir kez)

```bash
pnpm install
pnpm --filter @haber-radari/news-core build
pnpm --filter @haber-radari/connectors build
```

`node_modules` zaten varsa yeniden `pnpm install` gerekmez.

## Çalıştırma

İki ayrı terminal kullanın. **API kapanırsa** (terminal kapatma, Ctrl+C) mobil veri çekemez — tekrar `pnpm dev:api` çalıştırın. Kod değişikliği olmadan API açık kaldığı sürece yeniden başlatma gerekmez.

**Terminal 1 — API (proje kökü):**

```bash
pnpm dev:api
```

- Adres (bilgisayar): `http://localhost:3001`
- Sağlık: `GET /health` → `{ "status": "ok" }`

**Terminal 2 — Mobil (proje kökü):**

```bash
pnpm dev:mobile
```

Expo QR ile Expo Go veya emülatörde `a` (Android).

## API adresi — Android / Expo Go

| Ortam | API adresi |
|--------|------------|
| Bilgisayar / curl | `http://localhost:3001` |
| Android **emülatör** (AVD) | Otomatik `http://10.0.2.2:3001` |
| **Fiziksel telefon** (Expo Go) | `EXPO_PUBLIC_API_URL` ile LAN IP **zorunlu** |

Fiziksel cihaz örneği (Windows PowerShell, IP'nizi yazın):

```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.50:3001"
pnpm dev:mobile
```

Şablon: `apps/mobile/.env.example` — kopyalayıp `.env` yapabilirsiniz (secret yok).

Ayarlar sekmesinde aktif API URL ve bağlantı profili görünür.

## Hızlı doğrulama (PowerShell)

```powershell
Invoke-RestMethod http://localhost:3001/health
(Invoke-RestMethod http://localhost:3001/api/events).count
(Invoke-RestMethod "http://localhost:3001/api/events?filter=suppressed").count
```

Beklenen (MVP-1 örnek veri): Radar ≥8, suppress ≥2, notify_candidate ≥2, review ≥2.

## API uçları

| Uç | Açıklama |
|-----|----------|
| `GET /health` | Sağlık kontrolü |
| `GET /api/events` | Radar akışı |
| `GET /api/events?filter=flash\|finance\|nearby\|suppressed\|all` | Sekme filtreleri |
| `GET /api/signals` | Sosyal erken sinyaller (mock) |
| `GET /api/notification-candidates` | Push adayları (gönderilmez) |
| `POST /api/refresh` | Olay havuzunu yenile |

## MVP-1 kapsamı

- Policy engine + skorlama
- 3. sayfa filtresi (yerel şiddet, clickbait)
- 6 mobil sekme (Türkçe, koyu tema)
- Mock TRT/GDELT/sosyal veri
- Bildirim adayı listesi (gerçek push yok)

## Sonraki fazlar

- MVP-2: X, Bluesky, YouTube connector iskeleti
- MVP-3: Expo Push / FCM
- MVP-4: Ev + anlık konum
- MVP-5: Fact-check, dedup, cluster
