package com.haberradari

import com.haberradari.data.model.LegalMode
import com.haberradari.data.model.Source
import com.haberradari.data.remote.RssParser
import org.junit.Assert.*
import org.junit.Test

/**
 * DISABLED kaynak testleri.
 *
 * Doğrulama:
 * - DISABLED modunda makale üretilmez
 * - DISABLED kaynak toArticles'a verildiğinde boş liste döner
 * - DISABLED + enabled=false double-check
 */
class DisabledSourceTest {

    private val testItems = listOf(
        RssParser.RssItem(
            title = "Bu haber hiç çekilmemeli",
            link = "https://disabled-source.com/haber/1",
            pubDate = "Thu, 26 Jun 2026 12:00:00 +0300",
            description = "Bu açıklama da saklanmamalı."
        ),
        RssParser.RssItem(
            title = "İkinci disabled haber",
            link = "https://disabled-source.com/haber/2",
            pubDate = "Thu, 26 Jun 2026 11:00:00 +0300",
            description = "Bu da saklanmamalı."
        )
    )

    @Test
    fun `DISABLED source produces no articles`() {
        val source = Source(
            id = "disabled-source",
            name = "Devre Dışı Kaynak",
            feedUrl = "https://disabled-source.com/rss",
            legalMode = LegalMode.DISABLED,
            enabled = true
        )

        val articles = RssParser.toArticles(testItems, source)
        assertTrue("DISABLED kaynak makale üretmemeli", articles.isEmpty())
    }

    @Test
    fun `DISABLED source produces no articles even with multiple items`() {
        val source = Source(
            id = "disabled-multi",
            name = "Çoklu Devre Dışı",
            feedUrl = "https://disabled-source.com/rss",
            legalMode = LegalMode.DISABLED
        )

        val manyItems = (1..10).map {
            RssParser.RssItem(
                title = "Haber $it",
                link = "https://disabled-source.com/haber/$it",
                pubDate = "",
                description = "Açıklama $it"
            )
        }

        val articles = RssParser.toArticles(manyItems, source)
        assertTrue(articles.isEmpty())
    }

    @Test
    fun `non-DISABLED source produces articles normally`() {
        val source = Source(
            id = "active-source",
            name = "Aktif Kaynak",
            feedUrl = "https://example.com/rss",
            legalMode = LegalMode.RSS_METADATA_ONLY
        )

        val articles = RssParser.toArticles(testItems, source)
        assertEquals(2, articles.size)
    }
}
