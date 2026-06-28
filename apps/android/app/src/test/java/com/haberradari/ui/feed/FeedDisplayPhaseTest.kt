package com.haberradari.ui.feed

import com.haberradari.data.model.AiCuratedNewsItem
import com.haberradari.data.model.EvidenceStatus
import com.haberradari.data.model.Importance
import com.haberradari.data.model.PublishDecision
import com.haberradari.domain.repository.WatchlistPreviewItem
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class FeedDisplayPhaseTest {

    private fun sampleItem() = AiCuratedNewsItem(
        id = "1",
        aiTitle = "Test",
        aiSummary = "Özet",
        category = "Genel",
        importance = Importance.HIGH,
        confidence = 0.9f,
        evidenceStatus = EvidenceStatus.CONFIRMED,
        topicQuality = com.haberradari.data.model.TopicQuality.HIGH_VALUE,
        contentType = com.haberradari.data.model.ContentType.GENERAL,
        publishDecision = PublishDecision.PUBLISH_MAIN,
        publishReason = null,
        warningLabel = null,
        clusterReason = "",
        sourceCount = 2,
        filteredSourceCount = 0,
        sources = emptyList(),
        mediaHints = null,
        originalArticleIds = emptyList(),
        isDemo = false
    )

    private fun latestItem() = WatchlistPreviewItem(
        id = "rss-1",
        title = "Son Haber",
        category = "Genel",
        publishDecision = "LATEST_RSS",
        publishReason = null,
        evidenceStatus = "LOW_CONFIDENCE",
        contentType = "GENERAL",
        topicQuality = "NORMAL",
        sourceCount = 1,
        reasonCode = null
    )

    @Test
    fun `initialLoading with no data renders INITIAL_LOADING not blank gap`() {
        val state = FeedUiState(isInitialLoading = true)
        assertEquals(FeedDisplayPhase.INITIAL_LOADING, resolveFeedDisplayPhase(state))
    }

    @Test
    fun `data null no error intermediate state renders INITIAL_LOADING fallback`() {
        val state = FeedUiState(
            isInitialLoading = false,
            isRemoteLoading = false,
            curatedItems = null,
            latestRssPreview = null,
            lastError = null
        )
        assertEquals(FeedDisplayPhase.INITIAL_LOADING, resolveFeedDisplayPhase(state))
    }

    @Test
    fun `cache read loading renders READING_CACHE`() {
        val state = FeedUiState(isReadingCache = true)
        assertEquals(FeedDisplayPhase.READING_CACHE, resolveFeedDisplayPhase(state))
    }

    @Test
    fun `remote success with latestRssPreview renders CONTENT with visible body`() {
        val state = FeedUiState(
            isInitialLoading = false,
            curatedItems = emptyList(),
            latestRssPreview = listOf(latestItem())
        )
        assertEquals(FeedDisplayPhase.CONTENT, resolveFeedDisplayPhase(state))
        assertTrue(state.hasVisibleBodyItems())
    }

    @Test
    fun `remote fail with cache exists renders CONTENT not offline`() {
        val state = FeedUiState(
            isInitialLoading = false,
            curatedItems = emptyList(),
            latestRssPreview = listOf(latestItem()),
            lastError = "Backend bağlantısı kesildi"
        )
        assertEquals(FeedDisplayPhase.CONTENT, resolveFeedDisplayPhase(state))
    }

    @Test
    fun `remote fail with no cache renders OFFLINE_SETUP`() {
        val state = FeedUiState(
            isInitialLoading = false,
            isRemoteLoading = false,
            curatedItems = null,
            latestRssPreview = null,
            lastError = "Backend bağlantısı kesildi"
        )
        assertEquals(FeedDisplayPhase.OFFLINE_SETUP, resolveFeedDisplayPhase(state))
    }

    @Test
    fun `rapid refresh keeps content phase when data exists`() {
        val state = FeedUiState(
            isInitialLoading = false,
            isRemoteLoading = true,
            curatedItems = listOf(sampleItem()),
            latestRssPreview = listOf(latestItem())
        )
        assertEquals(FeedDisplayPhase.CONTENT, resolveFeedDisplayPhase(state))
        assertTrue(state.hasVisibleBodyItems())
    }

    @Test
    fun `empty main with no latest still has visible body via empty main state`() {
        val state = FeedUiState(
            isInitialLoading = false,
            curatedItems = emptyList(),
            latestRssPreview = null
        )
        assertEquals(FeedDisplayPhase.CONTENT, resolveFeedDisplayPhase(state))
        assertTrue(state.hasVisibleBodyItems())
    }

    @Test
    fun `hasFeedData true when curatedItems is empty list`() {
        val state = FeedUiState(curatedItems = emptyList())
        assertTrue(state.hasFeedData())
    }

    @Test
    fun `hasFeedData false when both null`() {
        val state = FeedUiState()
        assertFalse(state.hasFeedData())
    }
}
