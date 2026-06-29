package com.haberradari.ui.feed

import com.haberradari.data.model.AiCuratedNewsItem
import com.haberradari.data.model.EvidenceStatus
import com.haberradari.data.model.Importance
import com.haberradari.data.model.PublishDecision
import com.haberradari.data.model.SourceEvidence
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/** Feed/detay ekranı aiSummary fallback davranışı (Compose'suz mantık). */
class AiSummaryFallbackDisplayTest {

    private fun item(summary: String) = AiCuratedNewsItem(
        id = "c1",
        aiTitle = "Başlık haberi",
        aiSummary = summary,
        category = "Gündem",
        importance = Importance.MEDIUM,
        confidence = 0.5f,
        sourceCount = 1,
        uniqueSourceCount = 1,
        sources = listOf(
            SourceEvidence("NTV", "Başlık haberi", "https://example.com/1", 1L, null, null)
        ),
        mediaHints = null,
        originalArticleIds = emptyList(),
        evidenceStatus = EvidenceStatus.SINGLE_SOURCE,
        clusterReason = "",
        warningLabel = null,
        isDemo = false,
        filteredSourceCount = 0,
        publishDecision = PublishDecision.PUBLISH_MAIN
    )

    @Test
    fun `feed card hides summary body when aiSummary empty`() {
        assertFalse(AiSummaryUiLogic.shouldShowSummaryBody(item("").aiSummary))
        assertFalse(AiSummaryUiLogic.shouldShowSummaryBody(item("   ").aiSummary))
    }

    @Test
    fun `feed card shows summary body when aiSummary present`() {
        assertTrue(AiSummaryUiLogic.shouldShowSummaryBody(item("Kısa özet").aiSummary))
    }

    @Test
    fun `detail fallback uses hint when summary missing`() {
        val missing = item("")
        assertFalse(AiSummaryUiLogic.shouldShowSummaryBody(missing.aiSummary))
        assertTrue(missing.sources.isNotEmpty())
        assertTrue(missing.sources[0].url.isNotBlank())
    }
}
