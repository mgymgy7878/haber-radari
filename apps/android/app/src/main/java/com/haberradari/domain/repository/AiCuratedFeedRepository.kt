package com.haberradari.domain.repository

import com.haberradari.data.model.AiCuratedNewsItem
import com.haberradari.data.model.Article

enum class FeedSource {
    REMOTE_BACKEND_RSS,
    REMOTE_BACKEND_RSS_WITH_WATCHLIST,
    LOCAL_MOCK,
    FALLBACK_MOCK
}

data class AiCuratedFeedResult(
    val items: List<AiCuratedNewsItem>,
    val totalScanned: Int,
    val candidateClusterCount: Int = 0,
    val publishedCount: Int,
    val hiddenCount: Int,
    val watchlistCount: Int,
    val filteredCount: Int,
    val invariantOk: Boolean? = null,
    val invariantError: String? = null,
    val generatedAt: Long,
    val isDemo: Boolean,
    val source: FeedSource,
    val isFallbackUsed: Boolean = false,
    val fallbackReason: String? = null,
    val requestedUrl: String? = null,
    val watchlistPreview: List<WatchlistPreviewItem>? = null,
    val rawPreview: List<WatchlistPreviewItem>? = null,
    val noisePreview: List<WatchlistPreviewItem>? = null,
    val latestRssPreview: List<WatchlistPreviewItem>? = null,
    val isCached: Boolean = false
)

data class WatchlistPreviewItem(
    val id: String,
    val title: String,
    val category: String,
    val publishDecision: String,
    val publishReason: String?,
    val evidenceStatus: String,
    val contentType: String,
    val topicQuality: String,
    val sourceCount: Int,
    val reasonCode: String?,
    val shortDescription: String? = null,
    val originalUrl: String? = null,
    val publishedAt: String? = null,
    val sourceNames: List<String>? = null
)

interface AiCuratedFeedRepository {
    suspend fun getCuratedFeed(localArticlesFallback: List<Article>? = null): AiCuratedFeedResult
    suspend fun getCachedFeed(): AiCuratedFeedResult?
}

