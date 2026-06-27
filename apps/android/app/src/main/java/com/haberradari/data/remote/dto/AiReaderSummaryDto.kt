package com.haberradari.data.remote.dto

enum class EmotionalTone {
    POSITIVE,
    NEUTRAL,
    NEGATIVE,
    TRAGIC,
    INSPIRING
}

enum class VisibilityRecommendation {
    VISIBLE,
    SUPPRESSED,
    BOOSTED,
    NEEDS_REVIEW
}

data class AiReaderSummaryDto(
    val articleId: String,
    val sourceUrl: String,
    val sourceName: String,
    val shortAiSummary: String,
    val detailedAiSummary: String?,
    val whatHappened: String?,
    val whyItMatters: String?,
    val keyActors: List<String>?,
    val location: String?,
    val timeline: List<String>?,
    val publicInterestReason: String?,
    val emotionalTone: EmotionalTone,
    val visibilityRecommendation: VisibilityRecommendation,
    val confidenceScore: Double,
    val sourceAttribution: String,
    val generatedAt: Long,
    val expiresAt: Long
)
