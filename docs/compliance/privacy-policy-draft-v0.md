# Privacy Policy — Taslak v0

> **Bu metin taslaktır; hukuki nihai metin değildir. Yayın öncesi hukuk danışmanı teyidi gerekir.**

**Sürüm:** v0 (taslak)  
**Son güncelleme:** 2026-06-29  
**Durum:** Yayınlanmamış — canlı URL yok (B1 blocker OPEN)

---

## 1. Uygulama adı ve amaç

**Uygulama:** Haber Radarı  
**Tür:** Reklamsız haber radarı / metadata tabanlı gelişme takibi

Haber Radarı, birden fazla haber kaynağından **metadata** (başlık, kaynak adı, yayın zamanı, kategori ipucu vb.) toplayarak kullanıcıya **kaynak sinyali**, **kaynak profili** ve **orijinal kaynağa yönlendirme** sunar.

Haber Radarı **şunları iddia etmez:**

- Haber doğrulama veya fact-checking hizmeti sunmak  
- Yalan veya sahte haber tespiti yapmak  
- “Kesin doğru” veya “kanıtlandı” haber sunmak  

*Bu sinyal haberin doğruluğunu tek başına garanti etmez.*

---

## 2. Veri sorumlusu / yayıncı bilgisi

| Alan | Taslak placeholder |
|------|-------------------|
| Veri sorumlusu unvanı | `[ŞİRKET / GELİŞTİRİCİ UNVANI — HUKUK TEYİDİ]` |
| Adres | `[ADRES — HUKUK TEYİDİ]` |
| İletişim e-postası | `[privacy@example.com — HUKUK TEYİDİ]` |
| Web sitesi | `[https://example.com — HUKUK TEYİDİ]` |

---

## 3. Toplanan / işlenen veri kategorileri

Aşağıdaki tablo teknik gözleme dayalı taslaktır. Nihai liste engineering + hukuk review ile kesinleşmelidir.

### 3.1 Cihazda saklanan veriler (device-only)

| Veri | Açıklama | Amaç |
|------|----------|------|
| Smart feed JSON önbelleği | Son başarılı API yanıtı (`smart_feed_cache.json`) | Çevrimdışı / hata durumunda son feed |
| Room SQLite veritabanı | RSS kaynaklı makale metadata (başlık, link, zaman vb.) | Yerel feed ve senkronizasyon |
| Uygulama tercihleri (DataStore) | Kullanıcı ayarları (varsa) | Kişiselleştirme |

### 3.2 Backend’e giden teknik istekler

| Veri | Açıklama | Amaç |
|------|----------|------|
| HTTP istek metadata | IP adresi, User-Agent, istek zamanı (sunucu logları) | API sunumu, güvenlik, hata ayıklama |
| Query parametreleri | `includeWatchlist`, `includeLatest`, `bypassCache` vb. | Feed içeriği üretimi |

**Not:** v0 sürümünde kullanıcı hesabı, e-posta veya telefon numarası **toplanmaz**.

### 3.3 Üçüncü taraf haber kaynakları

Uygulama, RSS/metadata üzerinden haber başlıkları ve linkler gösterir. Kullanıcı **orijinal kaynağa** (NTV, Habertürk vb.) yönlendirildiğinde o sitenin kendi gizlilik politikası geçerlidir.

---

## 4. Toplanmayan veriler (v0)

| Veri | Durum |
|------|--------|
| Hesap / e-posta / şifre | Toplanmıyor — hesap sistemi yok |
| Kesin konum (GPS) | Toplanmıyor |
| Push bildirim token’ı | Toplanmıyor — push yok |
| Rehber / kişi listesi | Toplanmıyor |
| Ödeme bilgisi | Toplanmıyor |
| Mobil uygulama içinde API/LLM anahtarı | Gömülmez |

---

## 5. API / LLM key politikası

- Tüm LLM ve harici API anahtarları **yalnızca backend sunucusunda** tutulur (`LLM_DIGEST_API_KEY` vb.).
- Android APK içinde API key veya LLM credential **bulunmaz**.
- Kullanıcıya dönük LLM özetleme (smart digest external) MVP’de varsayılan olarak **kapalı** veya operatör onaylı sınırlı moddadır; açıldığında bu politika güncellenir.

LLM kullanıldığında (backend):

- Yalnızca **metadata** (başlık, kaynak adı, kategori ipucu) işlenir; tam makale metni scrape edilmez.
- Hukuk danışmanı teyidi: LLM sağlayıcısı, veri işleme sözleşmesi ve yurt dışı aktarım.

---

## 6. Loglar, hata kayıtları ve analytics

| Bileşen | v0 durumu | Not |
|---------|-----------|-----|
| Backend sunucu logları | Muhtemel (Fastify) | IP, istek yolu, hata stack — retention teyit |
| Android crash analytics (Firebase/Crashlytics) | **Entegre değil** (gözlem) | Eklenirse politika güncellenir |
| Ürün analytics (Mixpanel, GA vb.) | **Entegre değil** (gözlem) | Eklenirse Data Safety + KVKK güncellenir |

---

## 7. Konum verisi

**Şu an kullanılmıyor.**

İleride hava durumu veya bölgesel feed özelliği eklenirse:

- Android konum izni gerekir  
- Bu Privacy Policy güncellenir  
- Play Data Safety ve KVKK aydınlatma metni güncellenir  

---

## 8. Push bildirimleri

**Şu an kullanılmıyor.**

İleride push eklenirse:

- Opt-in izin (`POST_NOTIFICATIONS`)  
- FCM token işleme  
- Ayrı bildirim tercihi ve politika güncellemesi  

---

## 9. Çocuklar / yaş hedefi

| Alan | Taslak |
|------|--------|
| Hedef kitle | `[13+ / 18+ — HUKUK TEYİDİ]` |
| Bilerek çocuk verisi toplama | Yapılmaz (taslak ifade — teyit gerekir) |

---

## 10. Hesap silme (Account deletion)

v0’da **kullanıcı hesabı yoktur**. Play Console “account deletion” URL’si için **N/A** veya “hesap oluşturulmamaktadır” açıklaması — **hukuk danışmanı + Play policy teyidi gerekir**.

Kullanıcı yerel veriyi silmek için:

- Android: Uygulama → Depolama → Veriyi temizle  
- (Opsiyonel gelecek özellik: uygulama içi “önbelleği temizle”)

Hesap sistemi eklenirse silme akışı **yayın blocker’ı** olur.

---

## 11. Kullanıcı hakları ve iletişim

KVKK kapsamındaki haklar (erişim, düzeltme, silme, itiraz vb.) için ayrı **KVKK Aydınlatma Metni** geçerlidir. Bu Privacy Policy, KVKK aydınlatmanın yerine **geçmez**.

| Kanal | Placeholder |
|-------|-------------|
| Gizlilik talepleri | `[privacy@example.com]` |
| KVKK başvuruları | `[kvkk@example.com]` |
| Yanıt süresi | `[30 gün — HUKUK TEYİDİ]` |

---

## 12. Uygulama içi gösterim / link planı

| Konum | Plan (taslak) |
|-------|----------------|
| Ayarlar / Hakkında | “Gizlilik Politikası” → canlı URL |
| Ayarlar / Hakkında | “KVKK Aydınlatma Metni” → ayrı URL veya in-app WebView |
| İlk açılış (opsiyonel) | Kısa bilgilendirme + linkler — aydınlatma ≠ tek checkbox onayı |
| Play Store listing | Privacy Policy URL alanı |

**Blocker:** Canlı URL + uygulama içi erişim implementasyonu ayrı PR (B1 kapanışı).

---

## 13. Değişiklikler

Bu politika güncellenebilir. Önemli değişiklikler uygulama içi bildirim veya mağaza notu ile duyurulabilir — **hukuk teyidi gerekir**.

| Sürüm | Tarih | Not |
|-------|-------|-----|
| v0 taslak | 2026-06-29 | İlk taslak; yayınlanmamış |

---

## 14. Hukuk danışmanı teyidi gereken alanlar

1. Veri sorumlusu kimlik ve iletişim bilgileri  
2. Toplanan veri kategorilerinin KVKK/GDPR sınıflandırması  
3. Backend log retention ve IP işleme hukuki dayanağı  
4. RSS/metadata + link-out telif ve gizlilik sınırı  
5. LLM metadata işleme ve yurt dışı aktarım (açılırsa)  
6. Hesapsız uygulama için Play account deletion beyanı  
7. Çocuk / yaş hedefi ifadesi  
8. Canlı URL barındırma yeri (TR/EU hosting)

---

## İlişkili belgeler

- [KVKK Aydınlatma Taslak v0](./kvkk-aydinlatma-draft-v0.md) — **ayrı belge**  
- [Data Inventory v0](./data-inventory-v0.md)  
- [Play/KVKK Readiness v0](./play-kvkk-readiness-v0.md)
