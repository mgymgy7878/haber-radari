package com.haberradari

import com.haberradari.data.remote.RssParser
import org.junit.Assert.*
import org.junit.Test

/**
 * RSS parser unit testleri.
 *
 * Doğrulama:
 * - Geçerli RSS XML → doğru Article listesi
 * - Boş/bozuk XML → boş liste (crash yok)
 * - Eksik title/link → item atlanır
 * - CDATA destekli içerik
 */
class RssParserTest {

    private val validRssXml = """
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Test Haber</title>
            <item>
              <title>Türkiye'de seçim sonuçları açıklandı</title>
              <link>https://www.example.com/haber/secim-sonuclari</link>
              <pubDate>Thu, 26 Jun 2026 12:00:00 +0300</pubDate>
              <description>Yüksek Seçim Kurulu resmi sonuçları yayımladı.</description>
            </item>
            <item>
              <title>Dolar kuru güne yükselişle başladı</title>
              <link>https://www.example.com/haber/dolar-kuru</link>
              <pubDate>Thu, 26 Jun 2026 10:30:00 +0300</pubDate>
              <description>Merkez Bankası açıklaması sonrası piyasalar hareketlendi.</description>
            </item>
            <item>
              <title><![CDATA[Ankara'da sıcaklık 40°C'yi aştı]]></title>
              <link>https://www.example.com/haber/sicaklik</link>
              <pubDate>Thu, 26 Jun 2026 09:00:00 +0300</pubDate>
              <description><![CDATA[Meteoroloji: "Dikkatli olun" uyarısı yaptı.]]></description>
            </item>
          </channel>
        </rss>
    """.trimIndent()

    @Test
    fun `valid RSS XML parses correctly`() {
        val items = RssParser.parseXml(validRssXml)
        assertEquals(3, items.size)

        val first = items[0]
        assertEquals("Türkiye'de seçim sonuçları açıklandı", first.title)
        assertEquals("https://www.example.com/haber/secim-sonuclari", first.link)
        assertEquals("Yüksek Seçim Kurulu resmi sonuçları yayımladı.", first.description)
        assertTrue(first.pubDate.isNotBlank())
    }

    @Test
    fun `CDATA content is parsed correctly`() {
        val items = RssParser.parseXml(validRssXml)
        val cdataItem = items[2]
        assertEquals("Ankara'da sıcaklık 40°C'yi aştı", cdataItem.title)
        assertEquals("Meteoroloji: \"Dikkatli olun\" uyarısı yaptı.", cdataItem.description)
    }

    @Test
    fun `empty XML returns empty list`() {
        val items = RssParser.parseXml("")
        assertTrue(items.isEmpty())
    }

    @Test
    fun `malformed XML returns empty list without crash`() {
        val items = RssParser.parseXml("<not-valid-rss><<<broken>>>")
        assertTrue(items.isEmpty())
    }

    @Test
    fun `item without title is skipped`() {
        val xml = """
            <rss><channel>
              <item>
                <link>https://example.com/no-title</link>
                <description>Bu itemin başlığı yok</description>
              </item>
              <item>
                <title>Bu item geçerli</title>
                <link>https://example.com/valid</link>
              </item>
            </channel></rss>
        """.trimIndent()
        val items = RssParser.parseXml(xml)
        assertEquals(1, items.size)
        assertEquals("Bu item geçerli", items[0].title)
    }

    @Test
    fun `item without link is skipped`() {
        val xml = """
            <rss><channel>
              <item>
                <title>Linksiz haber</title>
                <description>Link yok</description>
              </item>
            </channel></rss>
        """.trimIndent()
        val items = RssParser.parseXml(xml)
        assertTrue(items.isEmpty())
    }

    @Test
    fun `XML entities are decoded`() {
        val xml = """
            <rss><channel>
              <item>
                <title>Haber &amp; Analiz: &quot;Önemli&quot;</title>
                <link>https://example.com/test</link>
                <pubDate></pubDate>
                <description>A &lt; B &gt; C</description>
              </item>
            </channel></rss>
        """.trimIndent()
        val items = RssParser.parseXml(xml)
        assertEquals(1, items.size)
        assertEquals("Haber & Analiz: \"Önemli\"", items[0].title)
        assertEquals("A < B > C", items[0].description)
    }
}
