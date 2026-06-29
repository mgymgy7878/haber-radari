# KVKK Aydınlatma Metni — Taslak v0

> **Bu metin taslaktır; hukuki nihai metin değildir. Yayın öncesi hukuk danışmanı teyidi gerekir.**

**Sürüm:** v0 (taslak)  
**Son güncelleme:** 2026-06-29  
**Durum:** Yayınlanmamış (B2 blocker OPEN)

**Önemli:** Bu metin **Gizlilik Politikası (Privacy Policy)** ile aynı değildir ve onun yerine geçmez. KVKK aydınlatma yükümlülüğü ayrı; açık rıza gerektiren işlemler (varsa) **ayrı metin/onay** ile yürütülmelidir.

---

## 1. Veri sorumlusu

| Alan | Placeholder |
|------|-------------|
| Veri sorumlusu | `[UNVAN — HUKUK TEYİDİ]` |
| Adres | `[ADRES — HUKUK TEYİDİ]` |
| E-posta | `[kvkk@example.com — HUKUK TEYİDİ]` |
| KEP / diğer | `[HUKUK TEYİDİ]` |

---

## 2. İşlenen kişisel veri kategorileri

Aşağıdaki liste teknik envanter taslağıdır (`data-inventory-v0.md` ile uyumlu).

| Kategori | Örnek | v0 |
|----------|-------|-----|
| Kimlik | Ad, soyad | İşlenmiyor (hesap yok) |
| İletişim | E-posta, telefon | İşlenmiyor |
| İşlem güvenliği | IP, log kayıtları | Backend logları — teyit gerekir |
| Kullanım / cihaz | User-Agent, cihaz modeli (loglarda) | Sınırlı — teyit gerekir |
| Yerel uygulama verisi | Önbellek, Room DB | Cihazda — veri sorumlusu işleme kapsamı teyit |
| Konum | GPS, yaklaşık konum | **İşlenmiyor** |
| Pazarlama / bildirim | Push token | **İşlenmiyor** |

---

## 3. Kişisel verilerin işlenme amaçları

| Amaç | Açıklama |
|------|----------|
| Haber feed sunumu | RSS/metadata tabanlı liste ve kaynak şeffaflığı |
| Yerel önbellek | Bağlantı kesintisinde son içerik |
| API güvenliği ve işletim | Sunucu logları, hata ayıklama |
| Ürün iyileştirme | Analytics eklenirse ayrı amaç — şu an yok |

**Ürün konumlandırması:** Yardımcı kaynak sinyali ve yönlendirme; haber doğrulama iddiası yok.

---

## 4. Hukuki sebepler

| İşleme | Taslak dayanak (teyit gerekir) |
|--------|-------------------------------|
| Feed sunumu | Sözleşmenin ifası / meşru menfaat — `[HUKUK TEYİDİ]` |
| Zorunlu loglar | Kanuni yükümlülük / meşru menfaat — `[HUKUK TEYİDİ]` |
| Analytics (gelecek) | Açık rıza veya meşru menfaat — `[HUKUK TEYİDİ]` |
| Push (gelecek) | Açık rıza — `[HUKUK TEYİDİ]` |
| Konum (gelecek) | Açık rıza — `[HUKUK TEYİDİ]` |

---

## 5. Veri toplama yöntemi

- Mobil uygulama üzerinden otomatik: API istekleri, yerel depolama  
- Kullanıcı eylemi: Orijinal haber linkine tıklama (üçüncü taraf site)  
- Otomatik olmayan form: v0’da hesap kaydı **yok**

---

## 6. Aktarım yapılan taraflar

| Alıcı türü | v0 | Not |
|------------|-----|-----|
| Backend hosting sağlayıcı | `[SAĞLAYICI — TEYİT]` | Sunucu logları |
| Haber kaynağı web siteleri | Link-out | Kullanıcı tıklayınca |
| LLM sağlayıcı | Kapalı / sınırlı | Açılırsa DPA + aktarım teyidi |
| Analytics SDK | Yok | Eklenirse güncelleme |

---

## 7. Yurt dışı aktarım

Hosting, analytics veya LLM yurt dışındaysa KVKK m.9 kapsamında **ayrı değerlendirme** gerekir.

| Senaryo | Durum |
|---------|--------|
| Backend TR içi | `[TEYİT]` |
| CDN / cloud yurt dışı | `[TEYİT — HUKUK]` |
| LLM API (ABD vb.) | External digest açılırsa **yüksek öncelikli teyit** |

---

## 8. Saklama süreleri

| Veri | Taslak süre | Teyit |
|------|-------------|-------|
| Smart feed cache (cihaz) | Kullanıcı silene kadar / üzerine yazılana kadar | Engineering |
| Room DB | Aynı | Engineering |
| Backend logları | `[90 gün — HUKUK TEYİDİ]` | |
| Analytics (gelecek) | `[HUKUK TEYİDİ]` | |

---

## 9. İlgili kişi hakları (KVKK m.11)

İlgili kişi olarak aşağıdaki haklara sahipsiniz (özet — nihai metin hukuk teyidi):

- Kişisel verilerinizin işlenip işlenmediğini öğrenme  
- İşlenmişse bilgi talep etme  
- Amacına uygun kullanılıp kullanılmadığını öğrenme  
- Yurt içi/yurt dışı aktarılan üçüncü kişileri bilme  
- Eksik/yanlış işlenmişse düzeltilmesini isteme  
- KVKK m.7 kapsamında silme / yok etme talep etme  
- Otomatik analizlere itiraz (uygulanıyorsa)  
- Kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme  

**Hesap yoksa:** Talepler e-posta / web form üzerinden kimlik doğrulama süreci ile — `[HUKUK TEYİDİ]`.

---

## 10. Başvuru iletişim bilgisi

| Kanal | Placeholder |
|-------|-------------|
| E-posta | `[kvkk@example.com]` |
| Adres | `[POSTA ADRESİ]` |
| Başvuru formu URL | `[https://example.com/kvkk-basvuru]` |

---

## 11. Hesap silme — N/A (v0)

Uygulamada kullanıcı hesabı **bulunmamaktadır**. Bu nedenle “hesap silme” akışı v0’da **N/A**’dır.

- Yerel veri: cihaz ayarlarından uygulama verisi silinebilir  
- Hesap özelliği eklenirse: silme akışı + aydınlatma güncellemesi **blocker**

---

## 12. Gelecek özellikler — risk notları

| Özellik | KVKK etkisi |
|---------|-------------|
| Konum / hava durumu | Açık rıza, aydınlatma güncelleme |
| Push bildirim | Token işleme, opt-in |
| Analytics / crash SDK | Yeni veri kategorileri, aktarım |
| Kullanıcı hesabı | Kimlik/iletişim, silme hakkı |
| LLM kullanıcı özeti | Metadata işleme, sağlayıcı DPA |

---

## 13. Aydınlatma ≠ açık rıza

- Bu belge **aydınlatma** metnidir.  
- Pazarlama, profilleme veya analytics için **ayrı açık rıza** gerekebilir — tek checkbox altında birleştirilmemelidir (KVKK Kurulu yaklaşımı — hukuk teyidi).

---

## 14. Hukuk danışmanı teyidi gereken alanlar

1. İşlenen verilerin kişisel veri / anonim veri sınıflandırması  
2. Hukuki sebep seçimi (m.5/m.6)  
3. Cihazda kalan verinin veri sorumlusu işleme kapsamı  
4. Backend IP logları ve retention  
5. Yurt dışı aktarım (hosting, LLM, analytics)  
6. İlgili kişi başvuru prosedürü ve kimlik doğrulama  
7. Hesapsız uygulama için m.11 uygulama pratiği  
8. Aydınlatma metninin sunum yeri ve zamanlaması (onboarding vs ayarlar)

---

## İlişkili belgeler

- [Privacy Policy Taslak v0](./privacy-policy-draft-v0.md)  
- [Data Inventory v0](./data-inventory-v0.md)  
- [Play/KVKK Readiness v0](./play-kvkk-readiness-v0.md)
