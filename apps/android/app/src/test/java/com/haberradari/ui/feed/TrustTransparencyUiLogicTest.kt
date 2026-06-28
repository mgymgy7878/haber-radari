package com.haberradari.ui.feed

import com.haberradari.data.model.AiCuratedNewsItem
import com.haberradari.data.model.EvidenceStatus
import com.haberradari.data.model.Importance
import com.haberradari.data.model.PublishDecision
import com.haberradari.data.model.SmartDigest
import com.haberradari.data.model.SmartDigestConfidence
import com.haberradari.data.model.SmartDigestModelProvider
import com.haberradari.data.model.SmartDigestStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class TrustTransparencyUiLogicTest {

    private fun digest(status: SmartDigestStatus) = SmartDigest(
        status = status,
        summary = if (status == SmartDigestStatus.FAILED) null else "Özet",
        keyPoints = emptyList(),
        whyItMatters = null,
        confidence = SmartDigestConfidence.MEDIUM,
        sourcePolicy = "METADATA_ONLY",
        modelProvider = SmartDigestModelProvider.MOCK,
        cacheKey = "k",
        generatedAt = null
    )

    @Test
    fun `digest status chip labels`() {
        assertEquals("AI özeti: kapalı", TrustTransparencyUiLogic.digestStatusChipLabel(null))
        assertEquals("AI özeti: kapalı", TrustTransparencyUiLogic.digestStatusChipLabel(digest(SmartDigestStatus.DISABLED)))
        assertEquals("AI özeti: test", TrustTransparencyUiLogic.digestStatusChipLabel(digest(SmartDigestStatus.MOCKED)))
        assertEquals("AI özeti: önbellekten", TrustTransparencyUiLogic.digestStatusChipLabel(digest(SmartDigestStatus.CACHED)))
        assertEquals("AI özeti", TrustTransparencyUiLogic.digestStatusChipLabel(digest(SmartDigestStatus.GENERATED)))
        assertEquals("AI özeti: alınamadı", TrustTransparencyUiLogic.digestStatusChipLabel(digest(SmartDigestStatus.FAILED)))
    }

    @Test
    fun `source count display mapping`() {
        assertEquals("2 kaynak", CuratedSourceLabels.articleSourceSummary(2, 2))
        assertEquals("2 haber · 1 benzersiz kaynak", CuratedSourceLabels.articleSourceSummary(2, 1))
        assertEquals("Kanıt: çoklu kaynak", CuratedSourceLabels.evidenceSummary(EvidenceStatus.CONFIRMED, 2))
        assertTrue(CuratedSourceLabels.evidenceSummary(EvidenceStatus.SINGLE_SOURCE, 1).startsWith("Kanıt: tek kaynak"))
    }

    @Test
    fun `why shown mapping includes publish and sources`() {
        val item = AiCuratedNewsItem(
            id = "c1",
            aiTitle = "Test",
            aiSummary = "Özet",
            category = "Gündem",
            importance = Importance.HIGH,
            confidence = 0.9f,
            sourceCount = 2,
            uniqueSourceCount = 2,
            sources = listOf(
                com.haberradari.data.model.SourceEvidence("AA", "T", "https://a", 1L, null, null),
                com.haberradari.data.model.SourceEvidence("TRT", "T2", "https://b", 2L, null, null)
            ),
            mediaHints = null,
            originalArticleIds = emptyList(),
            evidenceStatus = EvidenceStatus.CONFIRMED,
            clusterReason = "Benzer başlıklar",
            warningLabel = null,
            isDemo = false,
            filteredSourceCount = 0,
            publishDecision = PublishDecision.PUBLISH_MAIN,
            publishReason = "Çok kaynaklı doğrulama"
        )
        val lines = TrustTransparencyUiLogic.whyShownLines(item)
        assertTrue(lines.any { it.label == "Neden" && it.value.contains("doğrulama") })
        assertTrue(lines.any { it.label == "Kaynak kapsamı" && it.value.contains("2 kaynak") })
        assertTrue(lines.any { it.label == "Küme notu" })
    }

    @Test
    fun `failed digest does not collapse feed card`() {
        assertTrue(TrustTransparencyUiLogic.feedCardRemainsVisibleOnDigestFailure())
        assertFalse(SmartDigestUiLogic.shouldShowDigestContent(digest(SmartDigestStatus.FAILED)))
    }

    @Test
    fun `preview publish decisions hide smart digest block`() {
        assertFalse(TrustTransparencyUiLogic.shouldShowSmartDigestBlock(PublishDecision.WATCHLIST_ONLY))
        assertFalse(TrustTransparencyUiLogic.shouldShowSmartDigestBlock(PublishDecision.RAW_ONLY))
        assertFalse(TrustTransparencyUiLogic.shouldShowSmartDigestBlock(PublishDecision.FILTERED_OUT))
        assertTrue(TrustTransparencyUiLogic.shouldShowSmartDigestBlock(PublishDecision.PUBLISH_MAIN))
    }

    @Test
    fun `rss preview detail item has no digest and raw publish decision`() {
        val preview = com.haberradari.domain.repository.WatchlistPreviewItem(
            id = "rss-1",
            title = "Son RSS",
            category = "Gündem",
            publishDecision = "RAW_ONLY",
            publishReason = null,
            evidenceStatus = "LOW_CONFIDENCE",
            contentType = "GENERAL",
            topicQuality = "NORMAL",
            sourceCount = 1,
            reasonCode = null
        )
        assertFalse(TrustTransparencyUiLogic.shouldShowSmartDigestBlock(PublishDecision.RAW_ONLY))
        assertEquals("RAW_ONLY", preview.publishDecision)
    }
}
