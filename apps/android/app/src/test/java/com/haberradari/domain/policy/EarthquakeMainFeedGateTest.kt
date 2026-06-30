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

    // ── filterLatestPreview — Son Haberler filtreleme ──────────────────────────

    private fun latestItem(
        id: String,
        title: String,
        sourceName: String = "USGS Earthquakes",
        category: String = "afet",
    ): WatchlistPreviewItem = WatchlistPreviewItem(
        id = id,
        title = title,
        category = category,
        publishDecision = "LATEST_RSS",
        publishReason = null,
        evidenceStatus = EvidenceStatus.LOW_CONFIDENCE.name,
        contentType = ContentType.GENERAL.name,
        topicQuality = TopicQuality.NORMAL.name,
        sourceCount = 1,
        reasonCode = "LOCAL_ANDROID_INGEST",
        shortDescription = null,
        originalUrl = "https://example.com/$id",
        publishedAt = "1700000000000",
        sourceNames = listOf(sourceName),
    )

    @Test
    fun `Son Haberler - M5 and above passes filter`() {
        val items = listOf(latestItem("usgs-5", "M 5.1 - Alaska"))
        val result = EarthquakeMainFeedGate.filterLatestPreview(items)
        assertEquals(1, result?.size)
    }

    @Test
    fun `Son Haberler - M below 5 removed`() {
        val items = listOf(latestItem("usgs-low", "M 0.6 - 22 km N of Borrego Springs, CA"))
        val result = EarthquakeMainFeedGate.filterLatestPreview(items)
        assertTrue(result.isNullOrEmpty())
    }

    @Test
    fun `Son Haberler - magnitude unknown deprem removed`() {
        val items = listOf(
            latestItem("ntv-dep", "Son dakika deprem mi oldu?", sourceName = "NTV", category = "genel"),
        )
        val result = EarthquakeMainFeedGate.filterLatestPreview(items)
        assertTrue(result.isNullOrEmpty())
    }

    @Test
    fun `Son Haberler - non earthquake item kept`() {
        val items = listOf(
            latestItem("eco-1", "Enflasyon verisi açıklandı", sourceName = "Reuters", category = "ekonomi"),
        )
        val result = EarthquakeMainFeedGate.filterLatestPreview(items)
        assertEquals(1, result?.size)
    }

    @Test
    fun `Son Haberler - null input returns null`() {
        assertNull(EarthquakeMainFeedGate.filterLatestPreview(null))
    }

    @Test
    fun `Son Haberler - mixed items only eligible pass`() {
        val items = listOf(
            latestItem("eq-pass", "M 6.2 - Turkey"),
            latestItem("eq-fail", "M 2.1 - California"),
            latestItem("ntv", "Deprem mi oldu?", sourceName = "NTV", category = "genel"),
            latestItem("non-eq", "Yeni ekonomik paket açıklandı", sourceName = "Reuters", category = "ekonomi"),
        )
        val result = EarthquakeMainFeedGate.filterLatestPreview(items)
        assertEquals(2, result?.size)
        assertTrue(result!!.any { it.id == "eq-pass" })
        assertTrue(result.any { it.id == "non-eq" })
    }
}
