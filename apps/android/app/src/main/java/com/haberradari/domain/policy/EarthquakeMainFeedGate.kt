package com.haberradari.domain.policy

import com.haberradari.data.model.AiCuratedNewsItem
import com.haberradari.data.model.PublishDecision
import com.haberradari.domain.repository.AiCuratedFeedResult
import com.haberradari.domain.repository.WatchlistPreviewItem

/**
 * Deprem magnitude eşiği kapısı — PUBLISH_MAIN ve kullanıcıya dönük Son Haberler (latestRssPreview) için.
 * Eşik altı / bilinmeyen deprem kayıtları ana akıştan ve Son Haberler'den kaldırılır.
 * Ham önizleme metadata-only sınırını korumuş olur; description/body kullanılmaz.
 */
object EarthquakeMainFeedGate {

    fun apply(result: AiCuratedFeedResult): AiCuratedFeedResult {
        val keptMain = mutableListOf<AiCuratedNewsItem>()
        val demoted = mutableListOf<WatchlistPreviewItem>()

        for (item in result.items) {
            if (item.publishDecision != PublishDecision.PUBLISH_MAIN) {
                keptMain.add(item)
                continue
            }
            when (
                val eligibility = EarthquakeMagnitudePolicy.evaluateMainFeedEligibility(
                    title = primaryTitle(item),
                    category = item.category,
                    sourceNames = item.sources.map { it.sourceName },
                )
            ) {
                is EarthquakeMagnitudePolicy.MainFeedEligibility.Eligible -> keptMain.add(item)
                is EarthquakeMagnitudePolicy.MainFeedEligibility.WatchlistOnly -> {
                    demoted.add(item.toWatchlistPreview(eligibility.reasonCode))
                }
            }
        }

        if (demoted.isEmpty()) return result

        val mergedWatchlist = (result.watchlistPreview.orEmpty() + demoted)
            .distinctBy { it.id }

        val demotedCount = demoted.size
        return result.copy(
            items = keptMain,
            watchlistPreview = mergedWatchlist.takeIf { it.isNotEmpty() },
            publishedCount = (result.publishedCount - demotedCount).coerceAtLeast(0),
            hiddenCount = result.hiddenCount + demotedCount,
            watchlistCount = mergedWatchlist.size,
        )
    }

    private fun primaryTitle(item: AiCuratedNewsItem): String =
        item.sources.firstOrNull()?.originalTitle?.takeIf { it.isNotBlank() } ?: item.aiTitle

    /**
     * Son Haberler (latestRssPreview) kullanıcıya dönük production alanıdır.
     * Deprem sinyali taşıyan ve eşiği karşılamayan kayıtlar listeden çıkarılır.
     * Yalnızca title/category/sourceNames kullanılır — description/body/html yasak.
     */
    fun filterLatestPreview(
        items: List<WatchlistPreviewItem>?,
    ): List<WatchlistPreviewItem>? {
        if (items.isNullOrEmpty()) return items
        val filtered = items.filter { item ->
            EarthquakeMagnitudePolicy.evaluateMainFeedEligibility(
                title = item.title,
                category = item.category,
                sourceNames = item.sourceNames.orEmpty(),
            ) is EarthquakeMagnitudePolicy.MainFeedEligibility.Eligible
        }
        return filtered.takeIf { it.isNotEmpty() }
    }

    private fun AiCuratedNewsItem.toWatchlistPreview(reasonCode: String): WatchlistPreviewItem =
        WatchlistPreviewItem(
            id = id,
            title = primaryTitle(this),
            category = category,
            publishDecision = PublishDecision.WATCHLIST_ONLY.name,
            publishReason = reasonCode,
            evidenceStatus = evidenceStatus.name,
            contentType = contentType.name,
            topicQuality = topicQuality.name,
            sourceCount = sourceCount,
            reasonCode = reasonCode,
            shortDescription = null,
            originalUrl = sources.firstOrNull()?.url,
            publishedAt = sources.firstOrNull()?.publishedAt?.toString(),
            sourceNames = sources.map { it.sourceName }.distinct(),
        )
}
