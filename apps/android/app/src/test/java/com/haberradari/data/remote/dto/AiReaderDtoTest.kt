package com.haberradari.data.remote.dto

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AiReaderDtoTest {

    @Test
    fun `AiReaderSummaryRequestDto construct properly without forbidden fields`() {
        val request = AiReaderSummaryRequestDto(
            articleId = "123",
            sourceUrl = "https://example.com/news",
            sourceName = "Example News",
            title = "Test Article",
            description = "Short desc"
        )

        assertEquals("123", request.articleId)
        assertEquals("https://example.com/news", request.sourceUrl)
        assertEquals("Example News", request.sourceName)
        
        // Assert absence of fullText properties on the DTO class structure using reflection
        val props = AiReaderSummaryRequestDto::class.java.declaredFields.map { it.name }
        assertTrue(!props.contains("fullText"))
        assertTrue(!props.contains("articleBody"))
        assertTrue(!props.contains("contentHtml"))
    }

    @Test
    fun `AiReaderSummaryDto construct properly without forbidden fields`() {
        val dto = AiReaderSummaryDto(
            articleId = "123",
            sourceUrl = "https://example.com/news",
            sourceName = "Example News",
            shortAiSummary = "Summary",
            detailedAiSummary = null,
            whatHappened = null,
            whyItMatters = null,
            keyActors = null,
            location = null,
            timeline = null,
            publicInterestReason = null,
            emotionalTone = EmotionalTone.NEUTRAL,
            visibilityRecommendation = VisibilityRecommendation.VISIBLE,
            confidenceScore = 0.8,
            sourceAttribution = "Example",
            generatedAt = 1000L,
            expiresAt = 2000L
        )

        assertEquals("123", dto.articleId)
        assertTrue(dto.confidenceScore in 0.0..1.0)
        
        // Assert absence of fullText properties on the DTO class structure
        val props = AiReaderSummaryDto::class.java.declaredFields.map { it.name }
        assertTrue(!props.contains("fullText"))
        assertTrue(!props.contains("articleBody"))
        assertTrue(!props.contains("contentHtml"))
    }
}
