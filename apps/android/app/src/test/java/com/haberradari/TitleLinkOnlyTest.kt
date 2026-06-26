package com.haberradari

import com.haberradari.data.model.LegalMode
import com.haberradari.data.model.Source
import com.haberradari.data.remote.RssParser
import org.junit.Assert.*
import org.junit.Test

/**
 * TITLE_LINK_ONLY mod testleri.
 *
 * Doğrulama:
 * - Description null olmalı
 * - Title, originalUrl, sourceName, publishedAt dolu olmalı
 * - contentHash doğru hesaplanmalı
 */
class TitleLinkOnlyTest {

    private val testItems = listOf(
        RssParser.RssItem(
            title = "Sadece başlık görünecek haber",
            link = "https://title-only.com/haber/1",
            pubDate = "Thu, 26 Jun 2026 12:00:00 +0300",
            description = "Bu açıklama TITLE_LINK_ONLY modunda saklanMAmalı."
        )
    )

    private val titleOnlySource = Source(
        id = "title-only-source",
        name = "Sadece Başlık Kaynağı",
        feedUrl = "https://title-only.com/rss",
        legalMode = LegalMode.TITLE_LINK_ONLY
    )

    @Test
    fun `TITLE_LINK_ONLY mode nullifies description`() {
        val articles = RssParser.toArticles(testItems, titleOnlySource)

        assertEquals(1, articles.size)
        assertNull(
            "TITLE_LINK_ONLY modunda description null olmalı",
            articles[0].description
        )
    }

    @Test
    fun `TITLE_LINK_ONLY mode preserves title`() {
        val articles = RssParser.toArticles(testItems, titleOnlySource)
        assertEquals("Sadece başlık görünecek haber", articles[0].title)
    }

    @Test
    fun `TITLE_LINK_ONLY mode preserves originalUrl`() {
        val articles = RssParser.toArticles(testItems, titleOnlySource)
        assertEquals("https://title-only.com/haber/1", articles[0].originalUrl)
    }

    @Test
    fun `TITLE_LINK_ONLY mode preserves sourceName`() {
        val articles = RssParser.toArticles(testItems, titleOnlySource)
        assertEquals("Sadece Başlık Kaynağı", articles[0].sourceName)
    }

    @Test
    fun `TITLE_LINK_ONLY mode preserves publishedAt`() {
        val articles = RssParser.toArticles(testItems, titleOnlySource)
        assertTrue(
            "publishedAt pozitif olmalı",
            articles[0].publishedAt > 0
        )
    }

    @Test
    fun `TITLE_LINK_ONLY mode has valid contentHash`() {
        val articles = RssParser.toArticles(testItems, titleOnlySource)
        assertTrue(
            "contentHash 64 karakter hex olmalı",
            articles[0].contentHash.length == 64
        )
        assertTrue(
            "contentHash yalnızca hex karakter içermeli",
            articles[0].contentHash.matches(Regex("[0-9a-f]+"))
        )
    }

    @Test
    fun `TITLE_LINK_ONLY vs RSS_METADATA_ONLY - only description differs`() {
        val metadataSource = titleOnlySource.copy(
            id = "metadata-source",
            legalMode = LegalMode.RSS_METADATA_ONLY
        )

        val titleOnlyArticles = RssParser.toArticles(testItems, titleOnlySource)
        val metadataArticles = RssParser.toArticles(testItems, metadataSource)

        // Description farklı olmalı
        assertNull(titleOnlyArticles[0].description)
        assertNotNull(metadataArticles[0].description)

        // Title aynı olmalı
        assertEquals(titleOnlyArticles[0].title, metadataArticles[0].title)
    }
}
