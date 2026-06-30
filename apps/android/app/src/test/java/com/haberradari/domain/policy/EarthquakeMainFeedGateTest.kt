package com.haberradari.domain.policy

import com.haberradari.data.model.AiCuratedNewsItem
import com.haberradari.data.model.ContentType
import com.haberradari.data.model.EvidenceStatus
import com.haberradari.data.model.Importance
import com.haberradari.data.model.PublishDecision
import com.haberradari.data.model.SourceEvidence
import com.haberradari.data.model.TopicQuality
import com.haberradari.domain.repository.AiCuratedFeedResult
import com.haberradari.domain.repository.FeedSource
import com.haberradari.domain.repository.WatchlistPreviewItem
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class EarthquakeMainFeedGateTest {

    private fun curatedItem(
        id: String,
        title: String,
        sourceName: String = "USGS Earthquakes",
        category: String = "afet",
    ): AiCuratedNewsItem = AiCuratedNewsItem(
        id = id,
        aiTitle = title,
        aiSummary = "",
        category = category,
        importance = Importance.MEDIUM,
        confidence = 0.5f,
        sourceCount = 1,
        sources = listOf(
            SourceEvidence(
                sourceName = sourceName,
                originalTitle = title,
                url = "https://example.com/$id",
                publishedAt = 1_700_000_000_000L,
                imageUrl = null,
                videoUrl = null,
            ),
        ),
        mediaHints = null,
        originalArticleIds = listOf(id),
        evidenceStatus = EvidenceStatus.SINGLE_SOURCE,
        clusterReason = "",
        warningLabel = null,
        publishDecision = PublishDecision.PUBLISH_MAIN,
        topicQuality = TopicQuality.NORMAL,
        contentType = ContentType.DISASTER_ALERT,
    )

    private fun baseResult(items: List<AiCuratedNewsItem>): AiCuratedFeedResult =
        AiCuratedFeedResult(
            items = items,
            totalScanned = items.size,
            publishedCount = items.size,
            hiddenCount = 0,
            watchlistCount = 0,
            filteredCount = 0,
            generatedAt = 1L,
            isDemo = false,
            source = FeedSource.REMOTE_BACKEND_RSS_WITH_WATCHLIST,
            watchlistPreview = emptyList(),
        )

    @Test
    fun `M5 and above stays on main feed`() {
        val result = EarthquakeMainFeedGate.apply(
            baseResult(listOf(curatedItem("eq-5", "M 5.2 - Alaska"))),
        )
        assertEquals(1, result.items.size)
        assertTrue(result.watchlistPreview.isNullOrEmpty())
    }

    @Test
    fun `M below 5 demoted to watchlist`() {
        val result = EarthquakeMainFeedGate.apply(
            baseResult(listOf(curatedItem("eq-low", "M 4.9 - California"))),
        )
        assertTrue(result.items.isEmpty())
        val watchlist = result.watchlistPreview.orEmpty()
        assertEquals(1, watchlist.size)
        assertEquals(
            EarthquakeMagnitudePolicy.REASON_MAGNITUDE_BELOW_THRESHOLD,
            watchlist.first().reasonCode,
        )
        assertNull(watchlist.first().shortDescription)
    }

    @Test
    fun `unknown magnitude deprem demoted with unknown reason`() {
        val result = EarthquakeMainFeedGate.apply(
            baseResult(
                listOf(
                    curatedItem(
                        id = "ntv-deprem",
                        title = "Son dakika deprem mi oldu?",
                        sourceName = "NTV",
                        category = "genel",
                    ),
                ),
            ),
        )
        assertTrue(result.items.isEmpty())
        assertEquals(
            EarthquakeMagnitudePolicy.REASON_MAGNITUDE_UNKNOWN,
            result.watchlistPreview?.first()?.reasonCode,
        )
    }

    @Test
    fun `non earthquake main item unaffected`() {
        val result = EarthquakeMainFeedGate.apply(
            baseResult(
                listOf(
                    curatedItem(
                        id = "eco-1",
                        title = "Enflasyon verisi açıklandı",
                        sourceName = "Reuters",
                        category = "ekonomi",
                    ),
                ),
            ),
        )
        assertEquals(1, result.items.size)
    }

    @Test
    fun `demoted items merge with existing watchlist`() {
        val existing = WatchlistPreviewItem(
            id = "existing",
            title = "Existing watch",
            category = "genel",
            publishDecision = PublishDecision.WATCHLIST_ONLY.name,
            publishReason = "LOW_SIGNAL",
            evidenceStatus = EvidenceStatus.LOW_CONFIDENCE.name,
            contentType = ContentType.GENERAL.name,
            topicQuality = TopicQuality.NORMAL.name,
            sourceCount = 1,
            reasonCode = "LOW_SIGNAL",
        )
        val result = EarthquakeMainFeedGate.apply(
            baseResult(listOf(curatedItem("eq-low", "M 1.0 - test"))).copy(
                watchlistPreview = listOf(existing),
            ),
        )
        assertEquals(2, result.watchlistPreview?.size)
    }

    private fun latestItem(
        id: String,
        title: String,
        sourceName: String = "NTV",
        category: String = "genel",
    ): WatchlistPreviewItem = WatchlistPreviewItem(
        id = id,
        title = title,
        category = category,
        publishDecision = "LATEST_RSS",
        publishReason = null,
        evidenceStatus = "LOW_CONFIDENCE",
        contentType = "GENERAL",
        topicQuality = "NORMAL",
        sourceCount = 1,
        reasonCode = null,
        shortDescription = null,
        originalUrl = "https://example.com/$id",
        publishedAt = "1000",
        sourceNames = listOf(sourceName),
    )

    @Test
    fun `NTV unknown magnitude deprem removed from Son Haberler`() {
        val result = EarthquakeMainFeedGate.apply(
            baseResult(emptyList()).copy(
                latestRssPreview = listOf(
                    latestItem("ntv-1", "Son dakika deprem mi oldu?"),
                ),
            ),
        )
        assertTrue(result.latestRssPreview.isNullOrEmpty())
        assertEquals(
            EarthquakeMagnitudePolicy.REASON_MAGNITUDE_UNKNOWN,
            result.watchlistPreview?.first()?.reasonCode,
        )
    }

    @Test
    fun `USGS M 0_6 removed from Son Haberler`() {
        val result = EarthquakeMainFeedGate.apply(
            baseResult(emptyList()).copy(
                latestRssPreview = listOf(
                    latestItem(
                        id = "usgs-low",
                        title = "M 0.6 - 22 km N of Borrego Springs, CA",
                        sourceName = "USGS Earthquakes",
                        category = "afet",
                    ),
                ),
            ),
        )
        assertTrue(result.latestRssPreview.isNullOrEmpty())
        assertEquals(
            EarthquakeMagnitudePolicy.REASON_MAGNITUDE_BELOW_THRESHOLD,
            result.watchlistPreview?.first()?.reasonCode,
        )
    }

    @Test
    fun `USGS M 5_0 stays in Son Haberler`() {
        val result = EarthquakeMainFeedGate.apply(
            baseResult(emptyList()).copy(
                latestRssPreview = listOf(
                    latestItem(
                        id = "usgs-5",
                        title = "M 5.0 - Alaska Peninsula",
                        sourceName = "USGS Earthquakes",
                        category = "afet",
                    ),
                ),
            ),
        )
        assertEquals(1, result.latestRssPreview?.size)
        assertTrue(result.watchlistPreview.isNullOrEmpty())
    }

    @Test
    fun `non earthquake latest item stays in Son Haberler`() {
        val result = EarthquakeMainFeedGate.apply(
            baseResult(emptyList()).copy(
                latestRssPreview = listOf(
                    latestItem("eco", "Merkez Bankası faiz kararını açıkladı", "Reuters", "ekonomi"),
                ),
            ),
        )
        assertEquals(1, result.latestRssPreview?.size)
    }
}
