package com.haberradari.ui.feed

import com.haberradari.data.model.*
import com.haberradari.data.repository.NewsRepository
import com.haberradari.domain.repository.AiCuratedFeedRepository
import com.haberradari.domain.repository.AiCuratedFeedResult
import com.haberradari.domain.repository.FeedSource
import com.haberradari.domain.repository.WatchlistPreviewItem
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import kotlin.reflect.full.memberProperties

@OptIn(ExperimentalCoroutinesApi::class)
class DiagnosticsViewModelTest {

    private val newsRepository = mockk<NewsRepository>()
    private val aiFeedRepository = mockk<AiCuratedFeedRepository>()
    private val testDispatcher = StandardTestDispatcher()

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun source(
        id: String,
        enabled: Boolean = true,
        legalMode: LegalMode = LegalMode.RSS_METADATA_ONLY
    ) = Source(
        id = id,
        name = "Source $id",
        feedUrl = "https://example.com/$id",
        enabled = enabled,
        legalMode = legalMode,
        authorityLevel = SourceAuthority.GENERAL_MEDIA
    )

    private fun stats(source: Source) = SourceStats(
        source = source,
        health = null,
        articleCount = 0
    )

    @Test
    fun `diagnostics UI state correctly aggregates source stats`() = runTest {
        val sources = listOf(
            source("active", enabled = true, legalMode = LegalMode.RSS_METADATA_ONLY),
            source("disabled", enabled = false, legalMode = LegalMode.RSS_METADATA_ONLY),
            source("needs_review", enabled = true, legalMode = LegalMode.NEEDS_REVIEW)
        )
        val sourceStats = sources.map { stats(it) }

        every { newsRepository.getSourceStats() } returns flowOf(sourceStats)
        coEvery { aiFeedRepository.getCachedFeed() } returns null

        val viewModel = DiagnosticsViewModel(newsRepository, aiFeedRepository)
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals(3, state.totalSources)
        assertEquals(1, state.activeSources) // Only "active"
        assertEquals(1, state.disabledSources) // Only "disabled"
        assertEquals(1, state.needsReviewSources) // Only "needs_review"
    }

    @Test
    fun `recent decisions are loaded and sorted`() = runTest {
        val decision1 = WatchlistPreviewItem(
            id = "1", title = "T1", category = "c", publishDecision = "D1",
            publishReason = null, evidenceStatus = "E", contentType = "C",
            topicQuality = "Q", sourceCount = 1, reasonCode = "R1", publishedAt = "1000"
        )
        val decision2 = WatchlistPreviewItem(
            id = "2", title = "T2", category = "c", publishDecision = "D2",
            publishReason = null, evidenceStatus = "E", contentType = "C",
            topicQuality = "Q", sourceCount = 1, reasonCode = "R2", publishedAt = "2000"
        )
        
        val cachedResult = AiCuratedFeedResult(
            items = emptyList(),
            totalScanned = 0,
            publishedCount = 0,
            hiddenCount = 0,
            watchlistCount = 2,
            filteredCount = 0,
            generatedAt = 5000L,
            isDemo = false,
            source = FeedSource.LOCAL_MOCK,
            watchlistPreview = listOf(decision1, decision2)
        )

        every { newsRepository.getSourceStats() } returns flowOf(emptyList())
        coEvery { aiFeedRepository.getCachedFeed() } returns cachedResult

        val viewModel = DiagnosticsViewModel(newsRepository, aiFeedRepository)
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals(2, state.recentDecisions.size)
        assertEquals("2", state.recentDecisions[0].id) // Sorted by date desc
        assertEquals(5000L, state.lastRefreshAt)
        assertTrue(state.isCache)
    }

    @Test
    fun `Diagnostics UI model does not contain forbidden fields`() {
        val forbiddenFields = setOf(
            "description", "summary", "body", "fullText", 
            "contentHtml", "rawHtml", "articleText", "scrapedText", 
            "image", "caption", "video", "audio"
        )
        
        // Check WatchlistPreviewItem used in UI
        val itemProperties = WatchlistPreviewItem::class.memberProperties
        for (prop in itemProperties) {
            assertTrue(
                "Forbidden field ${prop.name} found in WatchlistPreviewItem",
                prop.name !in forbiddenFields || prop.name == "shortDescription" // shortDescription is allowed metadata
            )
        }
        
        // Note: shortDescription is allowed in RSS_METADATA_ONLY mode as per project rules.
        // But body, fullText, etc. are strictly forbidden.
    }
}
