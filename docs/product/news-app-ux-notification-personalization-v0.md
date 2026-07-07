# Haber Radarı: Ürün, UX ve Kişiselleştirme Mimarisi (v0)

Bu doküman, Haber Radarı'nın ticari haber uygulamalarından nasıl ayrışması gerektiğine dair stratejik ürün ve UX kararlarını içerir.

## 1. Executive Verdict

**Haber Radarı nasıl bir haber uygulaması olmalı?**
Haber Radarı, kullanıcının "sürekli yeni bir şeyler okuması" için tasarlanmış bir mecra değildir. Temel odak, "gerçekten önemli bir gelişme olduğunda kullanıcıyı güvenilir bir şekilde, en az gürültüyle haberdar etmek"tir. 

**Haber ajansı/kanal uygulamalarından farkı ne?**
Ticari uygulamalar tıklama oranını (CTR), reklam gösterimini ve uygulamada geçirilen süreyi artırmak üzere (magazin, asayiş, merak oltaları vb. kullanarak) tasarlanmıştır. Reuters Institute 2025 Dijital Haber Raporu, bu yaklaşımın "haber yorgunluğu"na (news fatigue) ve haberden kaçınmaya (news avoidance) yol açtığını; kullanıcıların %40'ının haberlerden kaçındığını ve %31'inin bilgi yorgunluğu hissettiğini ortaya koymaktadır. Haber Radarı bu yorgunluğun antitezidir: Gürültüyü filtreler, sadece önemli olanı sunar, kaynağı şeffaf kılar ve haberi tıklama tuzağından kurtarır.

## 2. Ürün İlkeleri

*   **Reklamsızlık:** Ticari hedefler ve tıklama tuzağı (clickbait) yoktur.
*   **Haber Alma Önceliği:** Amaç vakit geçirmek değil, kullanıcının önemli gelişmelerden haberdar olmasıdır.
*   **Kaynak Sinyali:** Haberlerin doğruluğu iddia edilmez; sadece olayın hangi kaynak(lar) tarafından aktarıldığı "kaynak sinyali" (tek kaynak / çok kaynak) olarak sunulur.
*   **Minimum Gürültü:** Düşük değerli içerikler (asayiş, 3. sayfa) filtrelenir; bildirimler en aza indirgenir.
*   **Kullanıcı Kontrolü:** Ne kadar bildirim alınacağı ve hangi konuların öncelikli olduğu kullanıcının şeffaf kontrolündedir.
*   **Legal-safe Metadata-only Yapı:** Veriler tamamen kazıma (scraping) olmadan, orijinal haber URL'sine yönlendirecek şekilde sadece metadata bazında işlenir.

## 3. Arayüz Önerisi

Ana akış, Material Design 3 ilkelerine uygun olarak görev bazlı ayrıştırılmalıdır. Haber Radarı'nın üst seviye navigasyonu ticari kategorilere göre değil, kullanıcının haber alma işlevine göre şekillenir:

*   **Öncelikli Akış:** Kullanıcının bugün kesinlikle bilmesi gereken önemli, çoklu kaynakla doğrulanmış (veya kritik tek kaynaklı) gelişmeler.
*   **Gelişen Kayıtlar:** Henüz tam doğrulanmamış, tek bir ajans veya kurum tarafından geçilmiş yeni haberler.
*   **İzleme Listesi:** Kullanıcının ilgi alanına giren ancak genel ana akışa girecek kadar geniş etkili olmayan (veya teyit bekleyen) haberler.
*   **RSS Metadata Önizlemesi:** Kaynak şeffaflığı ve şüphe durumunda doğrulamayı sağlamak için ham kayıtları listeleyen alan. Sistemde haberin nasıl bulunduğunu kanıtlar.
*   **Kaynak Yönetimi:** Hangi kurum ve ajansların dinlendiğini gösteren, açıp-kapatmaya olanak veren ayarlar.
*   **Ayarlar:** Kategori ve bildirim frekansı yönetim ekranları.

## 4. Haber Kartı Tasarımı

Kartlar sansasyonel veya tıklamaya zorlayıcı değil, bilgilendirici olmalıdır:

```text
Başlık
Kaynak adı · 10 dk önce

Etiket: Tek kaynak / kaynak sinyali
Akış değerlendirmesi: Kaynak profili uygun; tek kaynaklı gelişen kayıt.

Uyarı: Bu sinyal haberin doğruluğunu tek başına garanti etmez.

[ Orijinal kaynağa git ]
```
*Not: Gerçek bir LLM olmadan veya güven onayı verilmeden kesinlikle yapay zeka üzerinden çıkarım yapılmış gibi ifadeler (teyit garantisi vb.) yazılmamalıdır.*

## 5. Bildirim Stratejisi

Bildirimler, uygulamanın en kritik ayrıştırıcısıdır. Alert fatigue riskini önlemek için sessizlik varsayılan olmalıdır.

*   **Deprem / Afet / Kamu Güvenliği:** Varsayılan olarak AÇIK. Kritik bildirim kanalı kullanılır.
*   **Günlük Kısa Özet:** Varsayılan olarak AÇIK, ancak günde 1 kez limitli.
*   **Piyasa / Regülasyon (KAP, TCMB vb.):** Kullanıcı açıkça seçerse aktifleşir.
*   **Son Dakika Genel Haber:** Sıkı filtreli veya tamamen kapalı. Sadece "Öncelikli Akış"ta çok güçlü bir sinyal oluşursa tetiklenir.
*   **Magazin / Spor / Asayiş:** Varsayılan KAPALI.

**Android 13+ Notları:** 
`POST_NOTIFICATIONS` runtime permission istenirken kullanıcıya "neden" bu izni vermesi gerektiği (sadece deprem ve kritik olaylar için) anlatılmalıdır.

**Doğru Bildirim Dili Örneği:**
> AFAD kaynak sinyali: M5.2 deprem kaydı
> Tek kaynak / resmi kaynak
> Bu sinyal haberin doğruluğunu tek başına garanti etmez.

## 6. Kategori Mimarisi

Kategoriler haber sitelerinin klasik yapısından ("Gündem", "Spor", "Dünya") farklı olarak haberin ciddiyetine ve kullanıcının bilme zorunluluğuna göre şekillenir:

*   **Kritik:** Afet, kamu güvenliği, acil duyurular.
*   **Ekonomi & Piyasa:** BIST, SPK, TCMB, makroekonomik kararlar.
*   **Türkiye:** Ulusal siyasi ve toplumsal olaylar (rutin demeç gürültüsü hariç).
*   **Dünya:** Savaş, diplomasi ve küresel piyasa olayları.
*   **Teknoloji & AI:** Gelişmeler ve regülasyonlar (kullanıcının birincil ilgi alanlarına yönelik).
*   **Yerel:** (İleride opsiyonel) Sadece kullanıcının bölgesindeki acil durumlar.
*   **İzleme Listesi:** Sinyali zayıf veya henüz tam doğrulanmamış gelişen kayıtlar.
*   **RSS Metadata Önizlemesi:** Şeffaflık alanı.

## 7. Ayarlar

Kullanıcıya tam şeffaflık ve kontrol sağlanır:

*   **Bildirim Yoğunluğu:** Sessiz / Dengeli / Kritik
*   **Tek Kaynak Davranışı:** Göster / İzleme listesinde tut / Gizle
*   **Kaynak Profili:** Resmi ağırlıklı / Dengeli / Geniş (Ticari medya dahil)
*   **Clickbait Filtresi:** Normal / Sıkı
*   **Deprem Eşiği:** M≥5.0 (Kullanıcı tarafından değiştirilebilir)
*   **Kategori Önceliği:** İlgilenilen spesifik kategorilerin seçimi
*   **Veri ve Gizlilik:** Uygulamanın sadece metadata okuduğuna dair açık beyan.
*   **Kaynak Şeffaflığı:** Hangi yasal izinlerle hangi kurumların takip edildiği (Legal Mode List).

## 8. Kişiselleştirme

Kişiselleştirme, "bağımlılık yaratmak" (engagement baiting) için değil, "gürültüyü azaltmak" için kullanılır.

*   **Local-first:** Profil verileri cihazda yaşar.
*   **Bağlamsal Kullanıcı Seçimi:** Kişiselleştirme, kullanıcının doğrudan ayarlar veya onboarding sırasında yaptığı (örn: "Ekonomi bildirimlerini aç") tercihlere göre şekillenir.
*   **Reklam ve Tıklama Profili Yok:** Kullanıcının hangi habere ne kadar tıkladığı bir "öneri algoritması"nı beslemez.
*   **Gizlilik:** Kullanıcı profili, özet çıkarma veya değerlendirme yapmak amacıyla LLM'e (eğer varsa) gönderilmez.

## 9. Legal / Play / KVKK Notları

*   **Google Play News & Magazine Policy:** Uygulamanın bir haber aggregator'ı olduğu net bir şekilde beyan edilmeli ve üçüncü taraf içerik sahipleri, kaynaklarıyla beraber açıkça gösterilmelidir (`Orijinal kaynağa git` butonu bu şartı sağlar).
*   **Metadata-only Kuralı:** Orijinal makalenin ham detayları, html, image gibi telif gerektirebilecek alanları işlenmez. Sadece `title`, `link` ve `publishedAt` gibi RSS metadataları kullanılır.
*   **KVKK ve Gizlilik Politikası:** Kullanıcının verisinin (local-first tercihleri dahil) sunucularda profillenmediğini garanti eden, okunabilir ve Play uyumlu bir doküman hazırlanmalıdır.

## 10. MVP Roadmap

Önerilen geliştirme sırası:

1.  **A.** PR #76 (ui-rss-feel-v0) device smoke testini bekler.
2.  **B.** Product UX dokümanı merge edilir (Bu doküman).
3.  **C.** UI Information Architecture (IA) v0 tasarımı başlar.
4.  **D.** Notification settings screen v0 geliştirmesi.
5.  **E.** Personalization local preferences v0.
6.  **F.** Play/KVKK readiness doküman ve manifest güncellemesi.
7.  **G.** Gerçek LLM pilotu (Bu adım diğer her şey stabil olana kadar ayrı tutulur).
