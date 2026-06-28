package com.haberradari.ui.feed

import com.haberradari.data.model.SmartDigest
import com.haberradari.data.model.SmartDigestConfidence
import com.haberradari.data.model.SmartDigestModelProvider
import com.haberradari.data.model.SmartDigestStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SmartDigestUiLogicTest {

    private fun sampleDigest(
        status: SmartDigestStatus,
        summary: String? = "Özet metni",
        keyPoints: List<String> = listOf("A", "B", "C", "D")
    ) = SmartDigest(
        status = status,
        summary = summary,
        keyPoints = keyPoints,
        whyItMatters = "Önemli",
        confidence = SmartDigestConfidence.MEDIUM,
        sourcePolicy = "METADATA_ONLY",
        modelProvider = SmartDigestModelProvider.MOCK,
        cacheKey = "abc",
        generatedAt = "2026-06-28T00:00:00.000Z"
    )

    @Test
    fun `null smartDigest does not show content`() {
        assertFalse(SmartDigestUiLogic.shouldShowDigestContent(null))
        assertTrue(SmartDigestUiLogic.keyPointsForDisplay(null).isEmpty())
    }

    @Test
    fun `GENERATED with summary shows AI digest`() {
        val digest = sampleDigest(SmartDigestStatus.GENERATED)
        assertTrue(SmartDigestUiLogic.shouldShowDigestContent(digest))
    }

    @Test
    fun `CACHED with summary shows AI digest`() {
        val digest = sampleDigest(SmartDigestStatus.CACHED)
        assertTrue(SmartDigestUiLogic.shouldShowDigestContent(digest))
    }

    @Test
    fun `MOCKED with summary shows AI digest`() {
        val digest = sampleDigest(SmartDigestStatus.MOCKED)
        assertTrue(SmartDigestUiLogic.shouldShowDigestContent(digest))
    }

    @Test
    fun `FAILED does not show content and no panic UI flag`() {
        val digest = sampleDigest(SmartDigestStatus.FAILED, summary = null)
        assertFalse(SmartDigestUiLogic.shouldShowDigestContent(digest))
        assertTrue(SmartDigestUiLogic.shouldShowDebugStatusNote(digest, isDebugBuild = true))
    }

    @Test
    fun `DISABLED hides digest content`() {
        val digest = sampleDigest(SmartDigestStatus.DISABLED, summary = null)
        assertFalse(SmartDigestUiLogic.shouldShowDigestContent(digest))
        assertTrue(SmartDigestUiLogic.shouldShowDebugStatusNote(digest, isDebugBuild = true))
        assertFalse(SmartDigestUiLogic.shouldShowDebugStatusNote(digest, isDebugBuild = false))
    }

    @Test
    fun `keyPoints capped at 3`() {
        val digest = sampleDigest(SmartDigestStatus.GENERATED)
        assertEquals(3, SmartDigestUiLogic.keyPointsForDisplay(digest).size)
        assertEquals(listOf("A", "B", "C"), SmartDigestUiLogic.keyPointsForDisplay(digest))
    }

    @Test
    fun `empty summary hides digest even when GENERATED`() {
        val digest = sampleDigest(SmartDigestStatus.GENERATED, summary = "  ")
        assertFalse(SmartDigestUiLogic.shouldShowDigestContent(digest))
    }
}
