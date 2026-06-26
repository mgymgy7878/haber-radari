package com.haberradari

import com.haberradari.data.model.LegalMode
import com.haberradari.data.model.Source
import com.haberradari.data.remote.RssParser
import org.junit.Assert.*
import org.junit.Test

/**
 * LegalMode davranış testleri.
 *
 * Doğrulama:
 * - RSS_METADATA_ONLY → description korunur
 * - TITLE_LINK_ONLY → description null olur
 * - LICENSED → description korunur
 * - DISABLED → makale üretilmez
 */
class LegalModeTest {

    private val testItems = listOf(
        RssParser.RssItem(
            title = "Test Haber",
            link = "https://example.com/haber/1",
            pubDate = "Thu, 26 Jun 2026 12:00:00 +0300",
            description = "Bu bir test açıklamasıdır."
        )
    )

    private fun createSource(mode: LegalMode) = Source(
        id = "test-source",
        name = "Test Kaynak",
        feedUrl = "https://example.com/rss",
        legalMode = mode
    )

    @Test
    fun `RSS_METADATA_ONLY preserves description`() {
        val source = createSource(LegalMode.RSS_METADATA_ONLY)
        val articles = RssParser.toArticles(testItems, source)

        assertEquals(1, articles.size)
        assertEquals("Bu bir test açıklamasıdır.", articles[0].description)
    }

    @Test
    fun `TITLE_LINK_ONLY nullifies description`() {
        val source = createSource(LegalMode.TITLE_LINK_ONLY)
        val articles = RssParser.toArticles(testItems, source)

        assertEquals(1, articles.size)
        assertNull(articles[0].description)
    }

    @Test
    fun `LICENSED preserves description`() {
        val source = createSource(LegalMode.LICENSED)
        val articles = RssParser.toArticles(testItems, source)

        assertEquals(1, articles.size)
        assertEquals("Bu bir test açıklamasıdır.", articles[0].description)
    }

    @Test
    fun `DISABLED produces no articles`() {
        val source = createSource(LegalMode.DISABLED)
        val articles = RssParser.toArticles(testItems, source)

        assertTrue(articles.isEmpty())
    }

    @Test
    fun `all modes preserve required fields - sourceName, originalUrl, title`() {
        for (mode in listOf(LegalMode.RSS_METADATA_ONLY, LegalMode.TITLE_LINK_ONLY, LegalMode.LICENSED)) {
            val source = createSource(mode)
            val articles = RssParser.toArticles(testItems, source)

            if (articles.isNotEmpty()) {
                val article = articles[0]
                assertEquals("Test Kaynak", article.sourceName)
                assertEquals("https://example.com/haber/1", article.originalUrl)
                assertEquals("Test Haber", article.title)
                assertTrue(article.publishedAt > 0)
                assertTrue(article.contentHash.isNotBlank())
            }
        }
    }
}
