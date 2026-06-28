package com.haberradari.data.network.mapper

import com.google.gson.Gson
import com.haberradari.data.model.SmartDigestStatus
import com.haberradari.data.network.dto.AiCuratedFeedResponseDto
import com.haberradari.data.network.dto.SmartDigestDto
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SmartDigestMapperTest {

    private val gson = Gson()

    @Test
    fun `fromDto maps GENERATED digest`() {
        val dto = SmartDigestDto(
            status = "GENERATED",
            summary = "Metadata özeti",
            keyPoints = listOf("1", "2"),
            whyItMatters = "Ekonomi",
            confidence = "HIGH",
            sourcePolicy = "METADATA_ONLY",
            modelProvider = "external",
            cacheKey = "key-1",
            generatedAt = "2026-06-28T00:00:00.000Z"
        )
        val mapped = SmartDigestMapper.fromDto(dto)
        assertNotNull(mapped)
        assertEquals(SmartDigestStatus.GENERATED, mapped!!.status)
        assertEquals("Metadata özeti", mapped.summary)
        assertEquals(2, mapped.keyPoints.size)
    }

    @Test
    fun `fromDto returns null for invalid status without crash`() {
        assertNull(SmartDigestMapper.fromDto(SmartDigestDto(status = "UNKNOWN_STATUS")))
    }

    @Test
    fun `fromDto null input returns null`() {
        assertNull(SmartDigestMapper.fromDto(null))
    }

    @Test
    fun `feed json with smartDigest parses without crash`() {
        val json = """
            {
              "generatedAt": 1,
              "isDemo": false,
              "stats": {
                "totalScanned": 1,
                "candidateClusterCount": 1,
                "publishedCount": 1,
                "hiddenCount": 0,
                "watchlistCount": 0,
                "filteredCount": 0
              },
              "items": [{
                "id": "c1",
                "aiTitle": "Title",
                "aiSummary": "Summary",
                "category": "Gündem",
                "importance": "HIGH",
                "confidence": 0.9,
                "evidenceStatus": "CONFIRMED",
                "topicQuality": "HIGH",
                "contentType": "GENERAL",
                "publishDecision": "PUBLISH_MAIN",
                "publishReason": null,
                "warningLabel": null,
                "sourceCount": 2,
                "filteredSourceCount": 0,
                "sources": [],
                "mediaHints": null,
                "originalArticleIds": [],
                "smartDigest": {
                  "status": "MOCKED",
                  "summary": "[AI metadata özeti]",
                  "keyPoints": ["a"],
                  "whyItMatters": "why",
                  "confidence": "MEDIUM",
                  "sourcePolicy": "METADATA_ONLY",
                  "modelProvider": "mock",
                  "cacheKey": "abc",
                  "generatedAt": "2026-06-28T00:00:00.000Z"
                },
                "unexpectedFutureField": true
              }],
              "futureTopLevelField": "ignored"
            }
        """.trimIndent()

        val dto = gson.fromJson(json, AiCuratedFeedResponseDto::class.java)
        assertEquals(1, dto.items.size)
        val digest = SmartDigestMapper.fromDto(dto.items[0].smartDigest)
        assertNotNull(digest)
        assertEquals(SmartDigestStatus.MOCKED, digest!!.status)
    }

    @Test
    fun `latestRssPreview item has no smartDigest field in DTO`() {
        val json = """
            {
              "generatedAt": 1,
              "isDemo": false,
              "stats": {
                "totalScanned": 1,
                "candidateClusterCount": 1,
                "publishedCount": 0,
                "hiddenCount": 1,
                "watchlistCount": 0,
                "filteredCount": 0
              },
              "items": [],
              "latestRssPreview": [{
                "id": "latest-1",
                "title": "RSS",
                "category": "Genel",
                "publishDecision": "LATEST_RSS",
                "publishReason": null,
                "evidenceStatus": "LOW_CONFIDENCE",
                "contentType": "GENERAL",
                "topicQuality": "NORMAL",
                "sourceCount": 1,
                "reasonCode": null
              }]
            }
        """.trimIndent()
        val dto = gson.fromJson(json, AiCuratedFeedResponseDto::class.java)
        assertTrue(dto.latestRssPreview!!.isNotEmpty())
    }
}
