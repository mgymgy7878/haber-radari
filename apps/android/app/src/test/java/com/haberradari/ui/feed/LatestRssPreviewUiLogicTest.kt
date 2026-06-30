package com.haberradari.ui.feed

import com.haberradari.data.model.Article
import com.haberradari.data.remote.RssParser
import com.haberradari.domain.repository.WatchlistPreviewItem
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class LatestRssPreviewUiLogicTest {

    private fun article(
        id: String,
        sourceId: String,
        sourceName: String,
        title: String,
        url: String,
        publishedAt: Long,
        description: String? = null,
    ) = Article(
        id = id,
        title = title,
        description = description,
        sourceName = sourceName,
        sourceId = sourceId,
        originalUrl = url,
        canonicalUrl = url,
        contentHash = "hash-$id",
        publishedAt = publishedAt,
        fetchedAt = publishedAt,
    )

    private fun backendItem(url: String, title: String = "Backend") = WatchlistPreviewItem(
        id = "backend-1",
        title = title,
        category = "genel",
        publishDecision = "LATEST_RSS",
        publishReason = null,
        evidenceStatus = "LOW_CONFIDENCE",
        contentType = "GENERAL",
        topicQuality = "NORMAL",
        sourceCount = 1,
        reasonCode = null,
        shortDescription = null,
        originalUrl = url,
        publishedAt = "1000",
        sourceNames = listOf("NTV"),
    )

    @Test
    fun `USGS local article merged when missing from backend preview`() {
        val local = article(
            id = "usgs-1",
            sourceId = RssParser.USGS_EARTHQUAKES_SOURCE_ID,
            sourceName = "USGS Earthquakes",
            title = "M 2.1 - California",
            url = "https://earthquake.usgs.gov/earthquakes/eventpage/ci1",
            publishedAt = 9_000L,
        )
        val merged = LatestRssPreviewUiLogic.mergeWithLocalAndroidIngest(
            backendPreview = listOf(backendItem("https://www.ntv.com.tr/1")),
            localArticles = listOf(local),
        )!!

        assertTrue(merged.any { it.sourceNames?.contains("USGS Earthquakes") == true })
        val usgs = merged.first { it.title.contains("California") }
        assertEquals("M 2.1 - California", usgs.title)
        assertEquals("9000", usgs.publishedAt)
        assertNull(usgs.shortDescription)
        assertEquals("https://earthquake.usgs.gov/earthquakes/eventpage/ci1", usgs.originalUrl)
    }

    @Test
    fun `preview item never exposes description even if article has one`() {
        val local = article(
            id = "fed-1",
            sourceId = "fed-press",
            sourceName = "Federal Reserve",
            title = "Fed statement",
            url = "https://www.federalreserve.gov/press.htm",
            publishedAt = 5_000L,
            description = "should not leak",
        )
        val item = LatestRssPreviewUiLogic.articleToPreviewItem(local)
        assertNull(item.shortDescription)
    }

    @Test
    fun `duplicate url not merged twice`() {
        val url = "https://earthquake.usgs.gov/earthquakes/eventpage/dup"
        val backend = listOf(backendItem(url, title = "Backend USGS"))
        val local = article(
            id = "usgs-dup",
            sourceId = RssParser.USGS_EARTHQUAKES_SOURCE_ID,
            sourceName = "USGS Earthquakes",
            title = "Local USGS",
            url = url,
            publishedAt = 8_000L,
        )
        val merged = LatestRssPreviewUiLogic.mergeWithLocalAndroidIngest(backend, listOf(local))!!
        assertEquals(1, merged.count { it.originalUrl == url })
    }

    @Test
    fun `non global official local articles are not merged`() {
        val local = article(
            id = "ntv-local",
            sourceId = "ntv-turkiye",
            sourceName = "NTV",
            title = "Local only NTV",
            url = "https://www.ntv.com.tr/local-only",
            publishedAt = 7_000L,
        )
        val merged = LatestRssPreviewUiLogic.mergeWithLocalAndroidIngest(emptyList(), listOf(local))
        assertNull(merged)
    }

    @Test
    fun `TITLE_LINK_ONLY Fed EU appear when enabled and ingested locally`() {
        val fed = article(
            id = "fed-1",
            sourceId = "fed-press",
            sourceName = "Federal Reserve",
            title = "Press release",
            url = "https://www.federalreserve.gov/newswire/press/2026.htm",
            publishedAt = 6_000L,
        )
        val merged = LatestRssPreviewUiLogic.mergeWithLocalAndroidIngest(null, listOf(fed))!!
        assertEquals(1, merged.size)
        assertNull(merged[0].shortDescription)
        assertEquals("Federal Reserve", merged[0].sourceNames?.single())
    }
}
