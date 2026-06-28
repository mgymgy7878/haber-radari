package com.haberradari.domain.repository

import com.haberradari.data.model.Article
import com.haberradari.domain.MockSmartFeedAnalyzer
import com.haberradari.data.model.PublishDecision

class MockAiCuratedFeedRepository(
    private val analyzer: MockSmartFeedAnalyzer = MockSmartFeedAnalyzer()
) : AiCuratedFeedRepository {

    override suspend fun getCuratedFeed(
        localArticlesFallback: List<Article>?,
        forceRefresh: Boolean
    ): AiCuratedFeedResult {
        val articles = localArticlesFallback ?: emptyList()
        val result = analyzer.analyzeAndCluster(articles)
        
        val watchlistCount = result.items.count { it.publishDecision == PublishDecision.WATCHLIST_ONLY }
        val filteredCount = result.items.count { it.publishDecision == PublishDecision.FILTERED_OUT || it.publishDecision == PublishDecision.RAW_ONLY }
        
        return AiCuratedFeedResult(
            items = result.items,
            totalScanned = result.totalAnalyzed,
            candidateClusterCount = result.items.size,
            publishedCount = result.publishedCount,
            hiddenCount = result.hiddenCount,
            watchlistCount = watchlistCount,
            filteredCount = filteredCount,
            invariantOk = true,
            generatedAt = System.currentTimeMillis(),
            isDemo = true,
            source = FeedSource.LOCAL_MOCK,
            watchlistPreview = result.items.filter { it.publishDecision == PublishDecision.WATCHLIST_ONLY || it.publishDecision == PublishDecision.RAW_ONLY }.take(10).map {
                com.haberradari.domain.repository.WatchlistPreviewItem(
                    id = it.id,
                    title = it.aiTitle,
                    category = it.category,
                    publishDecision = it.publishDecision.name,
                    publishReason = it.publishReason,
                    evidenceStatus = it.evidenceStatus.name,
                    contentType = it.contentType.name,
                    topicQuality = it.topicQuality.name,
                    sourceCount = it.sourceCount,
                    reasonCode = it.publishReason
                )
            }
        )
    }

    override suspend fun getCachedFeed(): AiCuratedFeedResult? = null
}

