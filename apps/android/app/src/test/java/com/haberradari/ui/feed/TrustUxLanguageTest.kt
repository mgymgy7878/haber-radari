package com.haberradari.ui.feed

import com.haberradari.data.model.EvidenceStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Trust UX — kaynak sinyali dili; haber doğrulama iddiası taşımamalı.
 */
class TrustUxLanguageTest {

    private val riskyTerms = listOf(
        "kanıt",
        "kanıtlandı",
        "doğrulandı",
        "kesin doğru",
        "yalan haber",
        "teyit edildi",
    )

    @Test
    fun `evidence labels use source signal language`() {
        assertEquals("Sinyal: çoklu kaynak", CuratedSourceLabels.evidenceSummary(EvidenceStatus.CONFIRMED, 2))
        assertEquals("Kaynak sinyali güçlü", CuratedSourceLabels.evidenceSummary(EvidenceStatus.CONFIRMED, 1))
        assertTrue(CuratedSourceLabels.evidenceSummary(EvidenceStatus.SINGLE_SOURCE, 1).startsWith("Sinyal: tek kaynak"))
    }

    @Test
    fun `evidence labels avoid risky verification terms`() {
        for (status in EvidenceStatus.entries) {
            val label = CuratedSourceLabels.evidenceSummary(status, 2)
            riskyTerms.forEach { term ->
                assertFalse("$label içinde '$term' olmamalı", label.lowercase().contains(term))
            }
        }
    }

    @Test
    fun `sanitizeTrustDisplayText maps API legacy strings`() {
        assertEquals(
            "Çok kaynaklı kaynak sinyali",
            TrustTransparencyUiLogic.sanitizeTrustDisplayText("Çok kaynaklı doğrulama"),
        )
        assertEquals(
            "Ek kaynak sinyali bekleniyor",
            TrustTransparencyUiLogic.sanitizeTrustDisplayText("Doğrulama bekleniyor"),
        )
        assertEquals(
            "Sinyal: tek kaynak",
            TrustTransparencyUiLogic.sanitizeTrustDisplayText("Kanıt: tek kaynak"),
        )
    }

    @Test
    fun `single source warning avoids verification claim`() {
        val text = TrustTransparencyUiLogic.singleSourceWarningText()
        assertFalse(text.lowercase().contains("doğrulama"))
        assertTrue(text.contains("kaynak sinyali"))
    }

    @Test
    fun `source signal disclaimer is present`() {
        assertTrue(TrustTransparencyUiLogic.SOURCE_SIGNAL_DISCLAIMER.contains("garanti etmez"))
    }
}
