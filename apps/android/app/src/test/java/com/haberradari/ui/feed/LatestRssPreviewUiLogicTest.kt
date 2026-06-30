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
    fun `USGS M5plus local article merged when missing from backend preview`() {
        val local = article(
            id = "usgs-1",
            sourceId = RssParser.USGS_EARTHQUAKES_SOURCE_ID,
            sourceName = "USGS Earthquakes",
            title = "M 5.2 - California",
            url = "https://earthquake.usgs.gov/earthquakes/eventpage/ci1",
            publishedAt = 9_000L,
        )
        val merged = LatestRssPreviewUiLogic.mergeWithLocalAndroidIngest(
            backendPreview = listOf(backendItem("https://www.ntv.com.tr/1")),
            localArticles = listOf(local),
        )!!

        assertTrue(merged.any { it.sourceNames?.contains("USGS Earthquakes") == true })
        val usgs = merged.first { it.title.contains("California") }
        assertEquals("M 5.2 - California", usgs.title)
        assertEquals("9000", usgs.publishedAt)
        assertNull(usgs.shortDescription)
        assertEquals("https://earthquake.usgs.gov/earthquakes/eventpage/ci1", usgs.originalUrl)
    }

    @Test
    fun `USGS M below 5 NOT merged — cap-priority pre-filter`() {
        val local = article(
            id = "usgs-low",
            sourceId = RssParser.USGS_EARTHQUAKES_SOURCE_ID,
            sourceName = "USGS Earthquakes",
            title = "M 2.1 - California",
            url = "https://earthquake.usgs.gov/earthquakes/eventpage/ci-low",
            publishedAt = 9_000L,
        )
        val merged = LatestRssPreviewUiLogic.mergeWithLocalAndroidIngest(
            backendPreview = null,
            localArticles = listOf(local),
        )
        assertNull("M<5 USGS must be pre-filtered before cap", merged)
    }

    @Test
    fun `USGS M5plus survives when 12 M-below-5 articles dominate by date`() {
        val articles = (1..12).map { i ->
            article(
                id = "usgs-low-$i",
                sourceId = RssParser.USGS_EARTHQUAKES_SOURCE_ID,
                sourceName = "USGS Earthquakes",
                title = "M 0.$i - region $i",
                url = "https://earthquake.usgs.gov/earthquakes/eventpage/low$i",
                publishedAt = 100_000L + i,
            )
        } + article(
            id = "usgs-big",
            sourceId = RssParser.USGS_EARTHQUAKES_SOURCE_ID,
            sourceName = "USGS Earthquakes",
            title = "M 5.4 - 90 km ESE of Kimbe, Papua New Guinea",
            url = "https://earthquake.usgs.gov/earthquakes/eventpage/big",
            publishedAt = 50_000L,
        )
        val merged = LatestRssPreviewUiLogic.mergeWithLocalAndroidIngest(null, articles)!!
        val usgsItems = merged.filter { it.sourceNames?.contains("USGS Earthquakes") == true }
        assertTrue(
            "M 5.4 must be present; M<5 must be filtered",
            usgsItems.any { it.title.startsWith("M 5.4") },
        )
        assertTrue(
            "M<5 items must not appear",
            usgsItems.none { it.title.matches(Regex("M [0-4]\\..+")) },
        )
    }

    @Test
    fun `non-earthquake source cap unchanged — Fed 15 articles takes 12`() {
        val articles = (1..15).map { i ->
            article(
                id = "fed-$i",
                sourceId = "fed-press",
                sourceName = "Federal Reserve",
                title = "Fed statement $i",
                url = "https://www.federalreserve.gov/press$i.htm",
                publishedAt = 1000L * i,
            )
        }
        val merged = LatestRssPreviewUiLogic.mergeWithLocalAndroidIngest(null, articles)!!
        val fedItems = merged.filter { it.sourceNames?.contains("Federal Reserve") == true }
        assertEquals("Non-eq source cap should be 12", 12, fedItems.size)
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

    @Test
    fun `USGS magnitude unknown deprem NOT merged`() {
        val local = article(
            id = "usgs-unknown",
            sourceId = RssParser.USGS_EARTHQUAKES_SOURCE_ID,
            sourceName = "USGS Earthquakes",
            title = "Earthquake in California region", // No magnitude
            url = "https://earthquake.usgs.gov/earthquakes/eventpage/unknown",
            publishedAt = 9_000L,
        )
        val merged = LatestRssPreviewUiLogic.mergeWithLocalAndroidIngest(
            backendPreview = null,
            localArticles = listOf(local),
        )
        assertNull("Magnitude unknown USGS must be filtered", merged)
    }

    @Test
    fun `NTV magnitude unknown deprem filtered out`() {
        val item = WatchlistPreviewItem(
            id = "ntv-unknown",
            title = "İstanbul\u0027da korkutan deprem!", // No magnitude
            category = "genel",
            publishDecision = "LATEST_RSS",
            publishReason = null,
            evidenceStatus = "LOW_CONFIDENCE",
            contentType = "GENERAL",
            topicQuality = "NORMAL",
            sourceCount = 1,
            reasonCode = null,
            shortDescription = null,
            originalUrl = "https://www.ntv.com.tr/1",
            publishedAt = "1000",
            sourceNames = listOf("NTV"),
        )
        
        val filtered = com.haberradari.domain.policy.EarthquakeMainFeedGate.filterLatestPreview(listOf(item))
        assertNull("Magnitude unknown NTV earthquake must be filtered by gate", filtered)
    }

    @Test
    fun `NTV regular news NOT filtered out`() {
        val item = WatchlistPreviewItem(
            id = "ntv-regular",
            title = "Ekonomi gündemi hareketli",
            category = "ekonomi",
            publishDecision = "LATEST_RSS",
            publishReason = null,
            evidenceStatus = "LOW_CONFIDENCE",
            contentType = "GENERAL",
            topicQuality = "NORMAL",
            sourceCount = 1,
            reasonCode = null,
            shortDescription = null,
            originalUrl = "https://www.ntv.com.tr/2",
            publishedAt = "1000",
            sourceNames = listOf("NTV"),
        )
        
        val filtered = com.haberradari.domain.policy.EarthquakeMainFeedGate.filterLatestPreview(listOf(item))
        assertEquals(1, filtered?.size)
        assertEquals("ntv-regular", filtered?.first()?.id)
    }
}
