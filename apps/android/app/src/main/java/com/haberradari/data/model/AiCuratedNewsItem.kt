package com.haberradari.data.model

enum class Importance {
    LOW, MEDIUM, HIGH
}

enum class MediaHintType {
    IMAGE, VIDEO
}

data class MediaHint(
    val type: MediaHintType,
    val url: String,
    val sourceName: String
)

enum class EvidenceStatus {
    CONFIRMED,
    PARTIAL,
    SINGLE_SOURCE,
    LOW_CONFIDENCE,
    FILTERED
}

enum class PublishDecision {
    PUBLISH_MAIN,
    WATCHLIST_ONLY,
    FILTERED_OUT,
    RAW_ONLY
}

enum class TopicQuality {
    CRITICAL,
    HIGH_VALUE,
    NORMAL,
    LOW_VALUE,
    NOISE
}

enum class ContentType {
    NEWS_EVENT,
    POLITICAL_STATEMENT,
    ASAYIS_CRIME,
    LISTICLE_OR_ENTERTAINMENT,
    DISASTER_ALERT,
    ECONOMY_DATA,
    NATIONAL_SECURITY,
    SPORTS,
    HUMANITARIAN_AID,
    GENERAL,
    UNKNOWN
}

data class SourceEvidence(
    val sourceName: String,
    val originalTitle: String,
    val url: String,
    val publishedAt: Long,
    val imageUrl: String?,
    val videoUrl: String?,
    val sourceSignal: SourceSignal? = null
)

data class AiCuratedNewsItem(
    val id: String,
    val aiTitle: String,
    val aiSummary: String,
    val category: String,
    val importance: Importance,
    val confidence: Float,
    val sourceCount: Int,
    val uniqueSourceCount: Int = sourceCount,
    val sources: List<SourceEvidence>,
    val mediaHints: List<MediaHint>?,
    val originalArticleIds: List<String>,
    
    // YENI EKLENEN ALANLAR (v0.1 Guardrails)
    val evidenceStatus: EvidenceStatus,
    val clusterReason: String,
    val warningLabel: String?,
    val isDemo: Boolean = true,
    val filteredSourceCount: Int = 0,
    val publishDecision: PublishDecision = PublishDecision.PUBLISH_MAIN,
    val topicQuality: TopicQuality = TopicQuality.NORMAL,
    val contentType: ContentType = ContentType.GENERAL,
    val publishReason: String? = null,
    val smartDigest: SmartDigest? = null,
    val sourceSignal: SourceSignal? = null
)
