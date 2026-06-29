package com.haberradari.ui.feed

import com.haberradari.data.model.LegalMode
import com.haberradari.data.model.Source
import com.haberradari.data.model.SourceAuthority
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SourceManagementUiLogicTest {

    private val riskyTerms = listOf(
        "doğrulandı",
        "kesin doğru",
        "yalan haber",
        "kanıtlandı",
    )

    private fun source(
        id: String = "ntv-turkiye",
        legalMode: LegalMode = LegalMode.TITLE_LINK_ONLY,
        enabled: Boolean = true,
    ) = Source(
        id = id,
        name = "Test Kaynak",
        feedUrl = "https://example.com/rss",
        legalMode = legalMode,
        enabled = enabled,
        category = "genel",
        authorityLevel = SourceAuthority.GENERAL_MEDIA,
    )

    @Test
    fun `NEEDS_REVIEW toggle blocked`() {
        assertFalse(SourceManagementUiLogic.isUserToggleAllowed(LegalMode.NEEDS_REVIEW))
        assertNotNull(SourceManagementUiLogic.toggleBlockedReason(LegalMode.NEEDS_REVIEW))
    }

    @Test
    fun `DISABLED toggle blocked`() {
        assertFalse(SourceManagementUiLogic.isUserToggleAllowed(LegalMode.DISABLED))
        assertNotNull(SourceManagementUiLogic.toggleBlockedReason(LegalMode.DISABLED))
    }

    @Test
    fun `TITLE_LINK_ONLY toggle allowed`() {
        assertTrue(SourceManagementUiLogic.isUserToggleAllowed(LegalMode.TITLE_LINK_ONLY))
    }

    @Test
    fun `countActiveIngestSources excludes NEEDS_REVIEW even if enabled`() {
        val sources = listOf(
            source(legalMode = LegalMode.TITLE_LINK_ONLY, enabled = true),
            source(id = "bbc", legalMode = LegalMode.NEEDS_REVIEW, enabled = true),
            source(id = "off", legalMode = LegalMode.TITLE_LINK_ONLY, enabled = false),
        )
        assertEquals(1, SourceManagementUiLogic.countActiveIngestSources(sources))
    }

    @Test
    fun `legal labels avoid verification language`() {
        for (mode in LegalMode.entries) {
            val label = SourceManagementUiLogic.legalModeShortLabel(mode)
            val desc = SourceManagementUiLogic.legalModeDescription(mode)
            val hint = SourceManagementUiLogic.sourceProfileHint(source(legalMode = mode))
            riskyTerms.forEach { term ->
                assertFalse(label.lowercase().contains(term))
                assertFalse(desc.lowercase().contains(term))
                assertFalse(hint.lowercase().contains(term))
            }
        }
    }

    @Test
    fun `TITLE_LINK_ONLY description mentions link mode`() {
        assertTrue(
            SourceManagementUiLogic.legalModeDescription(LegalMode.TITLE_LINK_ONLY)
                .contains("Başlık + orijinal link"),
        )
    }
}
