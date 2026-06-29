package com.haberradari.ui.feed

import com.haberradari.data.model.Article
import com.haberradari.data.model.AiCuratedNewsItem
import com.haberradari.domain.repository.AiCuratedFeedResult
import com.haberradari.domain.repository.FeedSource
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class FeedRefreshUiLogicTest {

    private fun sampleState(
        curatedItems: List<AiCuratedNewsItem>? = listOf(),
        articles: List<Article> = emptyList(),
        lastUpdatedAt: Long? = 1_000L,
    ) = FeedUiState(
        curatedItems = curatedItems,
        lastUpdatedAt = lastUpdatedAt,
        articles = articles,
    )

    private fun sampleCached(generatedAt: Long = 5_000L) = AiCuratedFeedResult(
        items = emptyList(),
        totalScanned = 1,
        publishedCount = 0,
        hiddenCount = 1,
        watchlistCount = 0,
        filteredCount = 0,
        generatedAt = generatedAt,
        isDemo = false,
        source = FeedSource.REMOTE_BACKEND_RSS,
        isCached = true,
    )

    @Test
    fun `shouldSkipNetworkRefresh when no active sources`() {
        assertTrue(FeedRefreshUiLogic.shouldSkipNetworkRefresh(0))
        assertFalse(FeedRefreshUiLogic.shouldSkipNetworkRefresh(1))
    }

    @Test
    fun `mergeErrorPreservingContent keeps feed data on failure`() {
        val state = sampleState(curatedItems = emptyList())
        val merged = FeedRefreshUiLogic.mergeErrorPreservingContent(state, "Bağlantı hatası")
        assertEquals("Bağlantı hatası", merged.lastError)
        assertTrue(merged.isShowingCachedData)
        assertEquals(FeedRefreshUiLogic.RefreshOutcome.FAILED_SHOWING_CACHE, merged.refreshOutcome)
        assertNotNull(merged.curatedItems)
    }

    @Test
    fun `mergeErrorPreservingContent no cache state when empty`() {
        val state = FeedUiState(curatedItems = null, latestRssPreview = null)
        val merged = FeedRefreshUiLogic.mergeErrorPreservingContent(state, "Bağlantı hatası")
        assertEquals(FeedRefreshUiLogic.RefreshOutcome.FAILED_NO_CACHE, merged.refreshOutcome)
        assertNull(merged.curatedItems)
    }

    @Test
    fun `applyCachedSnapshot preserves lastUpdatedAt from cache`() {
        val state = FeedUiState()
        val cached = sampleCached(generatedAt = 9_000L)
        val merged = FeedRefreshUiLogic.applyCachedSnapshot(
            state,
            cached,
            errorMessage = "fail",
        ) { "5 dk önce güncellendi" }

        assertEquals(9_000L, merged.lastUpdatedAt)
        assertEquals(FeedRefreshUiLogic.RefreshOutcome.FAILED_SHOWING_CACHE, merged.refreshOutcome)
        assertEquals("5 dk önce güncellendi", merged.cacheAgeText)
    }

    @Test
    fun `applyCachedSnapshot success clears error outcome`() {
        val state = FeedUiState(lastError = "old")
        val cached = sampleCached(generatedAt = 12_000L)
        val merged = FeedRefreshUiLogic.applyCachedSnapshot(
            state,
            cached,
            errorMessage = null,
        ) { "1 saat önce güncellendi" }

        assertEquals(FeedRefreshUiLogic.RefreshOutcome.SUCCESS, merged.refreshOutcome)
        assertEquals(12_000L, merged.lastUpdatedAt)
        assertNull(merged.lastError)
    }

    @Test
    fun `cached error banner message includes cache hint`() {
        val msg = FeedRefreshUiLogic.cachedErrorBannerMessage("3 dk önce güncellendi")
        assertTrue(msg.contains("Bağlantı alınamadı"))
        assertTrue(msg.contains("son kayıtlı haberler"))
    }

    @Test
    fun `cached banner message includes age when present`() {
        val msg = FeedRefreshUiLogic.cachedContentBannerMessage("2 saat önce güncellendi")
        assertTrue(msg.contains("Son kayıtlı haberler gösteriliyor"))
        assertTrue(msg.contains("2 saat önce"))
    }

    @Test
    fun `refresh outcome labels avoid verification language`() {
        val risky = listOf("doğrulandı", "kesin doğru", "kanıtlandı")
        FeedRefreshUiLogic.RefreshOutcome.entries.forEach { outcome ->
            val label = FeedRefreshUiLogic.formatRefreshOutcomeLabel(outcome) ?: return@forEach
            risky.forEach { term ->
                assertFalse(label.lowercase().contains(term))
            }
        }
    }
}
