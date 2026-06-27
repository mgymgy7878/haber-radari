package com.haberradari.data.repository

import com.haberradari.data.remote.dto.AiReaderSummaryDto
import com.haberradari.data.remote.dto.AiReaderSummaryRequestDto
import com.haberradari.data.remote.dto.EmotionalTone
import com.haberradari.data.remote.dto.VisibilityRecommendation
import kotlinx.coroutines.delay

class MockAiReaderRepository : AiReaderRepository {
    override suspend fun getSummary(request: AiReaderSummaryRequestDto): Result<AiReaderSummaryDto> {
        if (request.articleId.isBlank() || request.sourceUrl.isBlank() || request.sourceName.isBlank()) {
            return Result.failure(IllegalArgumentException("Missing required fields"))
        }

        val urlRegex = "^(http|https)://.*$".toRegex()
        if (!request.sourceUrl.matches(urlRegex)) {
            return Result.failure(IllegalArgumentException("Invalid URL format"))
        }

        // Simulate network delay
        delay(500)

        return Result.success(
            AiReaderSummaryDto(
                articleId = request.articleId,
                sourceUrl = request.sourceUrl,
                sourceName = request.sourceName,
                shortAiSummary = "Bu, ${request.sourceName} kaynağından gelen haberin AI tarafndan 1 cmlelik zetidir.",
                detailedAiSummary = "Bu detayl AI zetidir. Sadece mock contract amacyla gsterilmektedir.",
                whatHappened = "Olay gerekleti.",
                whyItMatters = "Bu haberin nemi mock data olarak salanmtr.",
                keyActors = listOf("Kii 1", "Kurum 2"),
                location = "Trkiye",
                timeline = null,
                publicInterestReason = "Genel bilgilendirme.",
                emotionalTone = EmotionalTone.NEUTRAL,
                visibilityRecommendation = VisibilityRecommendation.VISIBLE,
                confidenceScore = 0.95,
                sourceAttribution = request.sourceName,
                generatedAt = System.currentTimeMillis(),
                expiresAt = System.currentTimeMillis() + 86400000 // +1 day
            )
        )
    }
}
