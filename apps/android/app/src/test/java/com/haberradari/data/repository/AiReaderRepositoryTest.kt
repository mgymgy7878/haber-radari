package com.haberradari.data.repository

import com.haberradari.data.remote.dto.AiReaderSummaryRequestDto
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class AiReaderRepositoryTest {

    private lateinit var repository: MockAiReaderRepository

    @Before
    fun setup() {
        repository = MockAiReaderRepository()
    }

    @Test
    fun `getSummary returns valid summary for valid request`() = runTest {
        val request = AiReaderSummaryRequestDto(
            articleId = "test-123",
            sourceUrl = "https://example.com/news/1",
            sourceName = "Test News",
            title = "A Test Article"
        )

        val result = repository.getSummary(request)
        
        assertTrue(result.isSuccess)
        val summary = result.getOrNull()!!
        
        assertEquals("test-123", summary.articleId)
        assertTrue(summary.confidenceScore in 0.0..1.0)
        assertTrue(summary.shortAiSummary.contains("mock", ignoreCase = true) || summary.detailedAiSummary?.contains("mock", ignoreCase = true) == true)
        assertTrue(summary.generatedAt > 0)
        assertTrue(summary.expiresAt > summary.generatedAt)
    }

    @Test
    fun `getSummary returns failure for invalid URL`() = runTest {
        val request = AiReaderSummaryRequestDto(
            articleId = "test-123",
            sourceUrl = "invalid-url",
            sourceName = "Test News",
            title = "A Test Article"
        )

        val result = repository.getSummary(request)
        
        assertTrue(result.isFailure)
        assertEquals("Invalid URL format", result.exceptionOrNull()?.message)
    }

    @Test
    fun `getSummary returns failure for missing required fields`() = runTest {
        val request = AiReaderSummaryRequestDto(
            articleId = "",
            sourceUrl = "https://example.com",
            sourceName = "Test News",
            title = "Title"
        )

        val result = repository.getSummary(request)
        
        assertTrue(result.isFailure)
        assertEquals("Missing required fields", result.exceptionOrNull()?.message)
    }
}
