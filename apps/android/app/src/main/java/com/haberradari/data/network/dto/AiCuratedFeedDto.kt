package com.haberradari.data.network.dto

data class AiCuratedFeedResponseDto(
    val items: List<AiCuratedNewsItemDto>,
    val stats: FeedStatsDto,
    val generatedAt: Long,
    val isDemo: Boolean,
    val watchlistPreview: List<WatchlistPreviewDto>? = null,
    val rawPreview: List<WatchlistPreviewDto>? = null,
    val noisePreview: List<WatchlistPreviewDto>? = null,
    val latestRssPreview: List<WatchlistPreviewDto>? = null
)

data class WatchlistPreviewDto(
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

data class FeedStatsDto(
    val totalScanned: Int,
    val candidateClusterCount: Int,
    val publishedCount: Int,
    val hiddenCount: Int,
    val watchlistCount: Int,
    val filteredCount: Int,
    val invariantOk: Boolean? = null,
    val invariantError: String? = null
)

data class AiCuratedNewsItemDto(
    val id: String,
    val aiTitle: String,
    val aiSummary: String,
    val category: String,
    val importance: String, // enum string mapping
    val confidence: Float,
    val evidenceStatus: String, // enum string mapping
    val topicQuality: String, // enum string mapping
    val contentType: String, // enum string mapping
    val publishDecision: String, // enum string mapping
    val publishReason: String?,
    val warningLabel: String?,
    val sourceCount: Int,
    val uniqueSourceCount: Int = sourceCount,
    val filteredSourceCount: Int,
    val sources: List<SourceEvidenceDto>,
    val mediaHints: List<String>?,
    val originalArticleIds: List<String>,
    val smartDigest: SmartDigestDto? = null
)

data class SmartDigestDto(
    val status: String? = null,
    val summary: String? = null,
    val keyPoints: List<String>? = null,
    val whyItMatters: String? = null,
    val confidence: String? = null,
    val sourcePolicy: String? = null,
    val modelProvider: String? = null,
    val cacheKey: String? = null,
    val generatedAt: String? = null,
    val errorCode: String? = null
)

data class SourceEvidenceDto(
    val sourceName: String,
    val originalTitle: String,
    val url: String,
    val publishedAt: Long,
    val imageUrl: String?,
    val videoUrl: String?
)
