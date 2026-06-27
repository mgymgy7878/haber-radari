package com.haberradari

import com.haberradari.data.model.Article
import com.haberradari.data.model.Source
import com.haberradari.data.model.SourceAuthority
import com.haberradari.data.remote.TopicRouter
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class TopicRoutingTest {

    private fun mockArticle(title: String, desc: String = ""): Article {
        return Article(
            id = "1",
            sourceId = "test_source",
            sourceName = "Test Source",
            title = title,
            originalUrl = "http://test.com",
            canonicalUrl = "http://test.com",
            publishedAt = 0,
            fetchedAt = 0,
            contentHash = "hash",
            description = desc
        )
    }

    private fun mockSource(authority: SourceAuthority): Source {
        return Source(
            id = "test_source",
            name = "Test Source",
            feedUrl = "http://test.com/rss",
            authorityLevel = authority
        )
    }

    @Test
    fun `clickbait on disaster topic by GENERAL_MEDIA is hidden`() {
        val article = mockArticle("Son dakika deprem mi oldu?")
        val source = mockSource(SourceAuthority.GENERAL_MEDIA)

        assertFalse(TopicRouter.shouldShowArticle(article, source))
    }

    @Test
    fun `official primary on disaster topic is always visible even with weird titles`() {
        val article = mockArticle("AFAD: Ege Denizi’nde 4.2 büyüklüğünde deprem")
        val source = mockSource(SourceAuthority.OFFICIAL_PRIMARY)

        assertTrue(TopicRouter.shouldShowArticle(article, source))
    }

    @Test
    fun `informative disaster title by GENERAL_MEDIA is visible`() {
        val article = mockArticle("İzmir’de 4.5 büyüklüğünde deprem meydana geldi")
        val source = mockSource(SourceAuthority.GENERAL_MEDIA)

        assertTrue(TopicRouter.shouldShowArticle(article, source))
    }

    @Test
    fun `weather alert by official source is visible`() {
        val article = mockArticle("Meteoroloji'den sarı kodlu uyarı")
        val source = mockSource(SourceAuthority.OFFICIAL_PRIMARY)

        assertTrue(TopicRouter.shouldShowArticle(article, source))
    }

    @Test
    fun `general news by GENERAL_MEDIA is visible if not clickbait`() {
        val article = mockArticle("Seçim sonuçları açıklandı")
        val source = mockSource(SourceAuthority.GENERAL_MEDIA)

        assertTrue(TopicRouter.shouldShowArticle(article, source))
    }
}