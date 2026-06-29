package com.haberradari.ui.feed

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AiSummaryUiLogicTest {

    @Test
    fun `safeSummaryOrNull returns null for null`() {
        assertNull(AiSummaryUiLogic.safeSummaryOrNull(null))
    }

    @Test
    fun `safeSummaryOrNull returns null for empty string`() {
        assertNull(AiSummaryUiLogic.safeSummaryOrNull(""))
    }

    @Test
    fun `safeSummaryOrNull returns null for whitespace only`() {
        assertNull(AiSummaryUiLogic.safeSummaryOrNull("   "))
        assertNull(AiSummaryUiLogic.safeSummaryOrNull("\n\t"))
    }

    @Test
    fun `safeSummaryOrNull returns trimmed text when present`() {
        assertEquals("Özet metni", AiSummaryUiLogic.safeSummaryOrNull("  Özet metni  "))
    }

    @Test
    fun `normalizeSummary maps blank to empty string`() {
        assertEquals("", AiSummaryUiLogic.normalizeSummary(null))
        assertEquals("", AiSummaryUiLogic.normalizeSummary(""))
        assertEquals("", AiSummaryUiLogic.normalizeSummary("  "))
    }

    @Test
    fun `shouldShowSummaryBody follows safeSummaryOrNull`() {
        assertFalse(AiSummaryUiLogic.shouldShowSummaryBody(null))
        assertFalse(AiSummaryUiLogic.shouldShowSummaryBody(""))
        assertFalse(AiSummaryUiLogic.shouldShowSummaryBody("   "))
        assertTrue(AiSummaryUiLogic.shouldShowSummaryBody("Dolu özet"))
    }

    @Test
    fun `missingSummaryHint is neutral`() {
        val hint = AiSummaryUiLogic.missingSummaryHint()
        assertTrue(hint.contains("özet gösterilmiyor"))
        assertFalse(hint.contains("doğrulandı", ignoreCase = true))
        assertFalse(hint.contains("yalan", ignoreCase = true))
    }
}
