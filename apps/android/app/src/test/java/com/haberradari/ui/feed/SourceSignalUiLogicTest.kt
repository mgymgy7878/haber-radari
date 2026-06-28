package com.haberradari.ui.feed

import com.haberradari.data.model.SourceSignal
import com.haberradari.data.model.SourceSignalBand
import com.haberradari.data.network.dto.SourceSignalDto
import com.haberradari.data.network.mapper.SourceSignalMapper
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SourceSignalUiLogicTest {

    private fun sampleSignal() = SourceSignal(
        label = "Kaynak sinyali",
        tierLabel = "Bilinen medya",
        scoreBand = SourceSignalBand.MEDIUM,
        reasons = listOf("Kaynak profili değerlendirmesi yardımcı sinyaldir."),
        disclaimer = "Bu sinyal haberin doğruluğunu tek başına garanti etmez."
    )

    @Test
    fun `feed chip label uses safe language`() {
        val label = TrustTransparencyUiLogic.sourceSignalFeedChipLabel(sampleSignal())
        assertEquals("Kaynak sinyali: orta profil", label)
        assertFalse(TrustTransparencyUiLogic.containsUnsafeSourceSignalLanguage(label!!))
    }

    @Test
    fun `null signal does not break chip label`() {
        assertNull(TrustTransparencyUiLogic.sourceSignalFeedChipLabel(null))
        assertTrue(TrustTransparencyUiLogic.sourceSignalWhyShownLines(null).isEmpty())
    }

    @Test
    fun `why shown lines include tier and band`() {
        val lines = TrustTransparencyUiLogic.sourceSignalWhyShownLines(sampleSignal())
        assertTrue(lines.any { it.label == "Kaynak sinyali" && it.value == "Bilinen medya" })
        assertTrue(lines.any { it.label == "Sinyal bandı" })
    }

    @Test
    fun `mapper handles null and unknown band`() {
        assertNull(SourceSignalMapper.fromDto(null))
        val mapped = SourceSignalMapper.fromDto(
            SourceSignalDto(
                label = "Kaynak sinyali",
                tierLabel = "Yerel kaynak",
                scoreBand = "INVALID",
                reasons = listOf("Metadata eksikliği var"),
                disclaimer = "Bu sinyal haberin doğruluğunu tek başına garanti etmez."
            )
        )
        assertEquals(SourceSignalBand.UNKNOWN, mapped?.scoreBand)
    }

    @Test
    fun `disclaimer avoids banned phrases`() {
        val signal = sampleSignal()
        assertFalse(TrustTransparencyUiLogic.containsUnsafeSourceSignalLanguage(signal.disclaimer))
        signal.reasons.forEach { reason ->
            assertFalse(TrustTransparencyUiLogic.containsUnsafeSourceSignalLanguage(reason))
        }
    }
}
