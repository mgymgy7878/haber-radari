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

    @Test
    fun `Atom XML parses correctly`() {
        val atomXml = """
            <?xml version="1.0" encoding="UTF-8"?>
            <feed xmlns="http://www.w3.org/2005/Atom">
              <title type="text">ntv.com.tr</title>
              <entry>
                <id>https://www.ntv.com.tr/turkiye/test</id>
                <title>Atom Feed Başlığı</title>
                <link rel="alternate" href="https://www.ntv.com.tr/turkiye/test"/>
                <summary>Atom açıklaması</summary>
                <published>2026-06-26T21:51:29+03:00</published>
              </entry>
              <entry>
                <title>İkinci Atom</title>
                <link href="https://example.com/ikinci"/>
                <content>İkinci içerik</content>
                <updated>2026-06-26T22:00:00+03:00</updated>
              </entry>
            </feed>
        """.trimIndent()
        
        val items = RssParser.parseXml(atomXml)
        assertEquals(2, items.size)
        
        val first = items[0]
        assertEquals("Atom Feed Başlığı", first.title)
        assertEquals("https://www.ntv.com.tr/turkiye/test", first.link)
        assertEquals("Atom açıklaması", first.description)
        assertEquals("2026-06-26T21:51:29+03:00", first.pubDate)
        
        val second = items[1]
        assertEquals("İkinci Atom", second.title)
        assertEquals("https://example.com/ikinci", second.link)
        assertEquals("İkinci içerik", second.description)
        assertEquals("2026-06-26T22:00:00+03:00", second.pubDate)
    }
}
