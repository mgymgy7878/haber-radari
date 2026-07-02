package com.haberradari.ui.feed

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class FeedUsabilityUiLogicTest {

    private val riskyTerms = listOf(
        "doğrulandı",
        "kesin doğru",
        "yalan haber",
        "kanıtlandı",
    )

    @Test
    fun `resolveEmptyKind NO_ENABLED_SOURCES when all sources disabled`() {
        val state = FeedUiState(
            curatedItems = null,
            latestRssPreview = null,
            totalSourceCount = 3,
            enabledSourceCount = 0,
            isInitialLoading = false,
            isRemoteLoading = false,
        )
        assertEquals(FeedUsabilityUiLogic.FeedEmptyKind.NO_ENABLED_SOURCES, FeedUsabilityUiLogic.resolveEmptyKind(state))
    }

    @Test
    fun `resolveEmptyKind NO_NEWS when sources enabled but no feed data`() {
        val state = FeedUiState(
            curatedItems = null,
            latestRssPreview = null,
            totalSourceCount = 2,
            enabledSourceCount = 2,
            isInitialLoading = false,
            isRemoteLoading = false,
        )
        assertEquals(FeedUsabilityUiLogic.FeedEmptyKind.NO_NEWS, FeedUsabilityUiLogic.resolveEmptyKind(state))
    }

    @Test
    fun `resolveEmptyKind NONE while loading`() {
        val state = FeedUiState(isRemoteLoading = true, totalSourceCount = 0, enabledSourceCount = 0)
        assertEquals(FeedUsabilityUiLogic.FeedEmptyKind.NONE, FeedUsabilityUiLogic.resolveEmptyKind(state))
    }

    @Test
    fun `formatLastUpdatedText prefers cacheAgeText`() {
        val text = FeedUsabilityUiLogic.formatLastUpdatedText(
            lastUpdatedAt = 1_000L,
            cacheAgeText = "5 dakika önce güncellendi",
        )
        assertEquals("5 dakika önce güncellendi", text)
    }

    @Test
    fun `formatLastUpdatedText uses timestamp when no cache text`() {
        val now = 1_000_000L
        val text = FeedUsabilityUiLogic.formatLastUpdatedText(
            lastUpdatedAt = now - 120_000,
            cacheAgeText = null,
            nowMillis = now,
        )
        assertEquals("2 dk önce güncellendi", text)
    }

    @Test
    fun `formatDurationOffset formats relative offsets correctly`() {
        val now = 1_000_000L
        assertEquals("Az önce", FeedUsabilityUiLogic.formatDurationOffset(now - 10_000, now))
        assertEquals("2 dk önce", FeedUsabilityUiLogic.formatDurationOffset(now - 120_000, now))
        assertEquals("3 saat önce", FeedUsabilityUiLogic.formatDurationOffset(now - 3 * 3600 * 1000, now))
        assertEquals("2 gün önce", FeedUsabilityUiLogic.formatDurationOffset(now - 2 * 24 * 3600 * 1000, now))
    }

    @Test
    fun `freshness UI model scenarios - source refreshed now and smart cache old`() {
        val now = System.currentTimeMillis()
        val state = FeedUiState(
            lastRssIngestAt = now - 10000, // refreshed now (10s ago)
            lastSmartAnalysisAt = now - 2 * 24 * 3600 * 1000, // 2 days old cache
            isShowingCachedData = true
        )
        val rssText = FeedUsabilityUiLogic.formatRssLastUpdatedText(state.lastRssIngestAt, now)
        val smartText = FeedUsabilityUiLogic.formatSmartAnalysisLastUpdatedText(state.lastSmartAnalysisAt, now)
        assertEquals("Az önce", rssText)
        assertEquals("2 gün önce", smartText)
    }

    @Test
    fun `freshness UI model scenarios - source old and cache old`() {
        val now = System.currentTimeMillis()
        val state = FeedUiState(
            lastRssIngestAt = now - 2 * 24 * 3600 * 1000, // 2 days ago
            lastSmartAnalysisAt = now - 2 * 24 * 3600 * 1000, // 2 days ago
            isShowingCachedData = true
        )
        val rssText = FeedUsabilityUiLogic.formatRssLastUpdatedText(state.lastRssIngestAt, now)
        val smartText = FeedUsabilityUiLogic.formatSmartAnalysisLastUpdatedText(state.lastSmartAnalysisAt, now)
        assertEquals("2 gün önce", rssText)
        assertEquals("2 gün önce", smartText)
    }

    @Test
    fun `connection status label for cache mode is neutral`() {
        val label = FeedUsabilityUiLogic.formatConnectionStatusLabel(
            FeedUsabilityUiLogic.FeedConnectionStatus.ERROR_WITH_CACHE,
        )
        assertEquals("Önbellek modu", label)
    }

    @Test
    fun `connection status ERROR_WITH_CACHE when error and cache`() {
        val state = FeedUiState(lastError = "fail", isShowingCachedData = true)
        assertEquals(
            FeedUsabilityUiLogic.FeedConnectionStatus.ERROR_WITH_CACHE,
            FeedUsabilityUiLogic.resolveConnectionStatus(state, isRefreshing = false),
        )
    }

    @Test
    fun `connection status REFRESHING when pull refresh active`() {
        val state = FeedUiState()
        assertEquals(
            FeedUsabilityUiLogic.FeedConnectionStatus.REFRESHING,
            FeedUsabilityUiLogic.resolveConnectionStatus(state, isRefreshing = true),
        )
    }

    @Test
    fun `empty state copy avoids verification language`() {
        for (kind in FeedUsabilityUiLogic.FeedEmptyKind.entries) {
            if (kind == FeedUsabilityUiLogic.FeedEmptyKind.NONE) continue
            val title = FeedUsabilityUiLogic.emptyStateTitle(kind)
            val message = FeedUsabilityUiLogic.emptyStateMessage(kind)
            riskyTerms.forEach { term ->
                assertFalse(title.lowercase().contains(term))
                assertFalse(message.lowercase().contains(term))
            }
        }
    }

    @Test
    fun `formatPublishedAtLabel parses epoch string`() {
        val now = 10_000_000L
        assertEquals(
            "5 dk önce",
            FeedUsabilityUiLogic.formatPublishedAtLabel("9700000", nowMillis = now),
        )
    }
}
