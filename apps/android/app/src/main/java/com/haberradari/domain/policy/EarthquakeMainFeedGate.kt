package com.haberradari.domain.policy

import com.haberradari.data.model.AiCuratedNewsItem
import com.haberradari.data.model.PublishDecision
import com.haberradari.domain.repository.AiCuratedFeedResult
import com.haberradari.domain.repository.WatchlistPreviewItem

/**
 * Deprem magnitude eşiği kapısı — ana akış (PUBLISH_MAIN) ve kullanıcıya dönük
 * Son Haberler (`latestRssPreview`) için uygulanır.
 *
 * Eşik altı / bilinmeyen deprem kayıtları izleme listesine taşınır.
 * Ham/debug önizleme (`rawPreview`, `noisePreview`) dokunulmaz.
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

        val (keptLatest, demotedFromLatest) = filterLatestRssPreview(result.latestRssPreview)
        val allDemoted = demoted + demotedFromLatest

        if (allDemoted.isEmpty() && keptLatest == result.latestRssPreview) {
            return result
        }

        val mergedWatchlist = (result.watchlistPreview.orEmpty() + allDemoted)
            .distinctBy { it.id }

        val mainDemotedCount = demoted.size
        val latestDemotedCount = demotedFromLatest.size
        return result.copy(
            items = keptMain,
            latestRssPreview = keptLatest,
            watchlistPreview = mergedWatchlist.takeIf { it.isNotEmpty() },
            publishedCount = (result.publishedCount - mainDemotedCount).coerceAtLeast(0),
            hiddenCount = result.hiddenCount + mainDemotedCount + latestDemotedCount,
            watchlistCount = mergedWatchlist.size,
        )
    }

    /**
     * Son Haberler önizlemesi — production kullanıcı alanı; deprem eşiği burada da geçerli.
     * Local Android ingest merge sonrası gate bu listede de uygulanmalı (FeedViewModel sırası).
     */
    fun filterLatestRssPreview(
        preview: List<WatchlistPreviewItem>?,
    ): Pair<List<WatchlistPreviewItem>?, List<WatchlistPreviewItem>> {
        if (preview.isNullOrEmpty()) return preview to emptyList()

        val kept = mutableListOf<WatchlistPreviewItem>()
        val demoted = mutableListOf<WatchlistPreviewItem>()

        for (item in preview) {
            when (
                val eligibility = EarthquakeMagnitudePolicy.evaluateMainFeedEligibility(
                    title = item.title,
                    category = item.category,
                    sourceNames = item.sourceNames.orEmpty(),
                    existingReasonCode = item.reasonCode,
                )
            ) {
                is EarthquakeMagnitudePolicy.MainFeedEligibility.Eligible -> kept.add(item)
                is EarthquakeMagnitudePolicy.MainFeedEligibility.WatchlistOnly -> {
                    demoted.add(item.toDemotedWatchlist(eligibility.reasonCode))
                }
            }
        }

        return kept.takeIf { it.isNotEmpty() } to demoted
    }

    private fun primaryTitle(item: AiCuratedNewsItem): String =
        item.sources.firstOrNull()?.originalTitle?.takeIf { it.isNotBlank() } ?: item.aiTitle

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

    private fun WatchlistPreviewItem.toDemotedWatchlist(reasonCode: String): WatchlistPreviewItem =
        copy(
            publishDecision = PublishDecision.WATCHLIST_ONLY.name,
            publishReason = reasonCode,
            reasonCode = reasonCode,
            shortDescription = null,
        )
}
