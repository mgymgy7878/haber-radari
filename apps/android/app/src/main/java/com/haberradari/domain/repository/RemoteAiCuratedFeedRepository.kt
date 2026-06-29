package com.haberradari.domain.repository

import com.google.gson.Gson
import com.haberradari.config.FeatureConfig
import com.haberradari.data.model.AiCuratedNewsItem
import com.haberradari.data.model.Article
import com.haberradari.data.network.dto.AiCuratedFeedResponseDto
import com.haberradari.data.network.mapper.SmartDigestMapper
import com.haberradari.data.network.mapper.SourceSignalMapper
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class RemoteAiCuratedFeedRepository(
    private val cacheDir: java.io.File? = null
) : AiCuratedFeedRepository {

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val cacheFile = cacheDir?.let { java.io.File(it, "smart_feed_cache.json") }

    override suspend fun getCuratedFeed(
        localArticlesFallback: List<Article>?,
        forceRefresh: Boolean
    ): AiCuratedFeedResult {
        if (!FeatureConfig.aiRemoteFeedEnabled) {
            throw IllegalStateException("Remote feed is disabled by FeatureConfig.")
        }
        FeatureConfig.assertReleaseSmartFeedUrlPolicy()

        return withContext(Dispatchers.IO) {
            if (forceRefresh) {
                cacheFile?.delete()
            }

            val urlBuilder = StringBuilder(
                "${FeatureConfig.smartFeedBaseUrl}/api/v1/smart-feed?includeWatchlist=1&includeLatest=1"
            )
            if (forceRefresh) {
                urlBuilder.append("&bypassCache=1")
            }
            if (FeatureConfig.smartFeedRawSourceExplorerEnabled) {
                urlBuilder.append("&includeRaw=1&includeNoise=1")
            }
            val targetUrl = urlBuilder.toString()
            
            android.util.Log.i("SmartFeedSource", "Requested URL: $targetUrl")
            
            try {
                val request = Request.Builder()
                    .url(targetUrl)
                    .build()

                val response = client.newCall(request).execute()
                if (!response.isSuccessful) {
                    throw Exception("Backend HTTP error: ${response.code}")
                }

                val bodyString = response.body?.string() ?: throw Exception("Empty response body")
                
                // Kalıcı Cache'e yaz
                writeCache(bodyString)

                parseResult(bodyString, isCached = false, requestedUrl = targetUrl)
            } catch (e: Exception) {
                android.util.Log.e("SmartFeedSource", "Remote fetch failed, trying local cache: ${e.message}")
                val cached = getCachedFeed()
                if (cached != null) {
                    cached.copy(
                        isFallbackUsed = true,
                        fallbackReason = e.message ?: "Bağlantı Hatası"
                    )
                } else {
                    throw e
                }
            }
        }
    }

    override suspend fun getCachedFeed(): AiCuratedFeedResult? {
        return withContext(Dispatchers.IO) {
            val file = cacheFile ?: return@withContext null
            if (!file.exists()) return@withContext null
            try {
                val bodyString = file.readText()
                if (bodyString.isEmpty()) return@withContext null
                parseResult(bodyString, isCached = true)
            } catch (e: Exception) {
                android.util.Log.e("SmartFeedCache", "Failed to read cache: ${e.message}")
                null
            }
        }
    }

    private fun writeCache(bodyString: String) {
        val file = cacheFile ?: return
        try {
            file.writeText(bodyString)
        } catch (e: Exception) {
            android.util.Log.e("SmartFeedCache", "Failed to write cache: ${e.message}")
        }
    }

    private fun parseResult(bodyString: String, isCached: Boolean, requestedUrl: String? = null): AiCuratedFeedResult {
        val dto = try {
            gson.fromJson(bodyString, AiCuratedFeedResponseDto::class.java)
        } catch (e: Exception) {
            throw Exception("JSON parse error: ${e.message}")
        }

        val parsedWatchlistPreview = dto.watchlistPreview?.map { mapPreviewDto(it) }?.takeIf { it.isNotEmpty() }
        val parsedRawPreview = dto.rawPreview?.map { mapPreviewDto(it) }?.takeIf { it.isNotEmpty() }
        val parsedNoisePreview = dto.noisePreview?.map { mapPreviewDto(it) }?.takeIf { it.isNotEmpty() }
        val parsedLatestRssPreview = dto.latestRssPreview?.map { mapPreviewDto(it) }?.takeIf { it.isNotEmpty() }

        // Map DTO to Domain model with safe enum fallbacks (only PUBLISH_MAIN items for the main list)
        val mappedItems = dto.items.filter { it.publishDecision == "PUBLISH_MAIN" }.map { itemDto ->
            AiCuratedNewsItem(
                id = itemDto.id,
                aiTitle = itemDto.aiTitle,
                aiSummary = com.haberradari.ui.feed.AiSummaryUiLogic.normalizeSummary(itemDto.aiSummary),
                category = itemDto.category,
                importance = mapImportance(itemDto.importance),
                confidence = itemDto.confidence,
                evidenceStatus = mapEvidenceStatus(itemDto.evidenceStatus),
                topicQuality = mapTopicQuality(itemDto.topicQuality),
                contentType = mapContentType(itemDto.contentType),
                publishDecision = com.haberradari.data.model.PublishDecision.PUBLISH_MAIN,
                publishReason = itemDto.publishReason,
                warningLabel = itemDto.warningLabel,
                clusterReason = "",
                sourceCount = itemDto.sourceCount,
                uniqueSourceCount = itemDto.uniqueSourceCount ?: itemDto.sources.map { it.sourceName }.distinct().size,
                filteredSourceCount = itemDto.filteredSourceCount,
                sources = itemDto.sources.map { srcDto ->
                    com.haberradari.data.model.SourceEvidence(
                        sourceName = srcDto.sourceName,
                        originalTitle = srcDto.originalTitle,
                        url = srcDto.url,
                        publishedAt = srcDto.publishedAt,
                        imageUrl = srcDto.imageUrl,
                        videoUrl = srcDto.videoUrl,
                        sourceSignal = SourceSignalMapper.fromDto(srcDto.sourceSignal)
                    )
                },
                mediaHints = null,
                originalArticleIds = itemDto.originalArticleIds,
                isDemo = dto.isDemo,
                smartDigest = SmartDigestMapper.fromDto(itemDto.smartDigest),
                sourceSignal = SourceSignalMapper.fromDto(itemDto.sourceSignal)
            )
        }
        
        val finalSource = if (parsedWatchlistPreview != null) FeedSource.REMOTE_BACKEND_RSS_WITH_WATCHLIST else FeedSource.REMOTE_BACKEND_RSS
        
        return AiCuratedFeedResult(
            items = mappedItems,
            totalScanned = dto.stats.totalScanned,
            candidateClusterCount = dto.stats.candidateClusterCount,
            publishedCount = dto.stats.publishedCount,
            hiddenCount = dto.stats.hiddenCount,
            watchlistCount = dto.stats.watchlistCount,
            filteredCount = dto.stats.filteredCount,
            invariantOk = dto.stats.invariantOk,
            invariantError = dto.stats.invariantError,
            generatedAt = dto.generatedAt,
            isDemo = dto.isDemo,
            source = finalSource,
            isFallbackUsed = isCached,
            fallbackReason = if (isCached) "Kalıcı önbellek kullanılıyor." else null,
            requestedUrl = requestedUrl,
            watchlistPreview = parsedWatchlistPreview,
            rawPreview = parsedRawPreview,
            noisePreview = parsedNoisePreview,
            latestRssPreview = parsedLatestRssPreview,
            isCached = isCached
        )
    }

    private fun mapPreviewDto(dto: com.haberradari.data.network.dto.WatchlistPreviewDto): WatchlistPreviewItem {
        return WatchlistPreviewItem(
            id = dto.id,
            title = dto.title,
            category = dto.category,
            publishDecision = dto.publishDecision,
            publishReason = dto.publishReason,
            evidenceStatus = dto.evidenceStatus,
            contentType = dto.contentType,
            topicQuality = dto.topicQuality,
            sourceCount = dto.sourceCount,
            reasonCode = dto.reasonCode,
            shortDescription = dto.shortDescription,
            originalUrl = dto.originalUrl,
            publishedAt = dto.publishedAt,
            sourceNames = dto.sourceNames
        )
    }

    private fun mapImportance(value: String): com.haberradari.data.model.Importance {
        return try {
            com.haberradari.data.model.Importance.valueOf(value)
        } catch (e: Exception) {
            com.haberradari.data.model.Importance.LOW
        }
    }

    private fun mapEvidenceStatus(value: String): com.haberradari.data.model.EvidenceStatus {
        return try {
            com.haberradari.data.model.EvidenceStatus.valueOf(value)
        } catch (e: Exception) {
            com.haberradari.data.model.EvidenceStatus.LOW_CONFIDENCE
        }
    }

    private fun mapTopicQuality(value: String): com.haberradari.data.model.TopicQuality {
        return try {
            com.haberradari.data.model.TopicQuality.valueOf(value)
        } catch (e: Exception) {
            com.haberradari.data.model.TopicQuality.NORMAL
        }
    }

    private fun mapContentType(value: String): com.haberradari.data.model.ContentType {
        return try {
            com.haberradari.data.model.ContentType.valueOf(value)
        } catch (e: Exception) {
            com.haberradari.data.model.ContentType.GENERAL
        }
    }
}

