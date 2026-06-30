package com.haberradari.ui.feed

import com.haberradari.data.model.Article
import com.haberradari.data.registry.AndroidSeedRegistryDeriver
import com.haberradari.domain.repository.WatchlistPreviewItem

/**
 * Son Haberler önizlemesi — backend smart-feed ile Android local RSS ingest köprüsü.
 *
 * Global resmi seed kaynakları (Fed/EU/USGS) yalnızca cihazda ingest edilir;
 * backend `latestRssPreview` henüz bu kayıtları içermeyebilir. Metadata-only sınırı korunur.
 */
object LatestRssPreviewUiLogic {

    /** PR #69 global official Android ingest — backend preview'a merge edilir. */
    val LOCAL_ANDROID_INGEST_PREVIEW_SOURCE_IDS: Set<String> = setOf(
        "fed-press",
        "eu-commission-press",
        "usgs-earthquakes",
    )

    private const val MAX_PREVIEW_ITEMS = 40
    private const val MAX_ITEMS_PER_LOCAL_SOURCE = 12

    /**
     * Backend önizlemesine, henüz listede olmayan local Android ingest kayıtlarını ekler.
     * [shortDescription] her zaman null — title/date/source/link dışı özet gösterilmez.
     */
    fun mergeWithLocalAndroidIngest(
        backendPreview: List<WatchlistPreviewItem>?,
        localArticles: List<Article>,
        localOnlySourceIds: Set<String> = LOCAL_ANDROID_INGEST_PREVIEW_SOURCE_IDS,
    ): List<WatchlistPreviewItem>? {
        val backend = backendPreview.orEmpty()
        val seenUrls = backend.mapNotNull { normalizeUrl(it.originalUrl) }.toMutableSet()

        val localItems = localArticles
            .asSequence()
            .filter { it.sourceId in localOnlySourceIds }
            .filter { article ->
                val canonical = normalizeUrl(article.canonicalUrl)
                val original = normalizeUrl(article.originalUrl)
                (canonical == null || canonical !in seenUrls) &&
                    (original == null || original !in seenUrls)
            }
            .sortedByDescending { it.publishedAt }
            .groupBy { it.sourceId }
            .flatMap { (_, bySource) -> bySource.take(MAX_ITEMS_PER_LOCAL_SOURCE) }
            .map { articleToPreviewItem(it) }
            .toList()

        if (backend.isEmpty() && localItems.isEmpty()) return null

        return (backend + localItems)
            .distinctBy { normalizeUrl(it.originalUrl) ?: it.id }
            .sortedByDescending { it.publishedAt?.toLongOrNull() ?: 0L }
            .take(MAX_PREVIEW_ITEMS)
    }

    fun articleToPreviewItem(article: Article): WatchlistPreviewItem =
        WatchlistPreviewItem(
            id = "local-${article.id}",
            title = article.title,
            category = categoryForSource(article.sourceId),
            publishDecision = "LATEST_RSS",
            publishReason = null,
            evidenceStatus = "LOW_CONFIDENCE",
            contentType = "GENERAL",
            topicQuality = "NORMAL",
            sourceCount = 1,
            reasonCode = "LOCAL_ANDROID_INGEST",
            shortDescription = null,
            originalUrl = article.originalUrl,
            publishedAt = article.publishedAt.toString(),
            sourceNames = listOf(article.sourceName),
        )

    private fun categoryForSource(sourceId: String): String =
        AndroidSeedRegistryDeriver.ANDROID_SEED_CATEGORY_OVERRIDES_V0[sourceId] ?: "genel"

    private fun normalizeUrl(url: String?): String? =
        url?.trim()?.lowercase()?.takeIf { it.isNotEmpty() }
}
