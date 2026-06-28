package com.haberradari.ui.feed

import com.haberradari.data.model.AiCuratedNewsItem
import com.haberradari.data.model.ContentType
import com.haberradari.data.model.EvidenceStatus
import com.haberradari.data.model.Importance
import com.haberradari.data.model.PublishDecision
import com.haberradari.data.model.SourceEvidence
import com.haberradari.data.model.TopicQuality
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CuratedItemIntegrityTest {

    private fun item(
        id: String,
        title: String,
        sources: List<SourceEvidence>,
        articleCount: Int = sources.size,
        uniqueSourceCount: Int = sources.map { it.sourceName }.distinct().size
    ) = AiCuratedNewsItem(
        id = id,
        aiTitle = title,
        aiSummary = "Özet",
        category = "Gündem",
        importance = Importance.MEDIUM,
        confidence = 0.8f,
        sourceCount = articleCount,
        uniqueSourceCount = uniqueSourceCount,
        sources = sources,
        mediaHints = null,
        originalArticleIds = sources.map { it.url },
        evidenceStatus = EvidenceStatus.SINGLE_SOURCE,
        clusterReason = "",
        warningLabel = null,
        isDemo = false,
        filteredSourceCount = 0,
        publishDecision = PublishDecision.PUBLISH_MAIN,
        topicQuality = TopicQuality.NORMAL,
        contentType = ContentType.GENERAL,
        publishReason = null,
        smartDigest = null
    )

    @Test
    fun `detail title matches lead source title`() {
        val sources = listOf(
            SourceEvidence("AA", "Fransa uçağı düştü", "https://aa.com/1", 1L, null, null),
            SourceEvidence("AA", "Fransa uçağı ikinci haber", "https://aa.com/2", 2L, null, null)
        )
        val feedItem = item("cluster-a", "Fransa uçağı düştü", sources, articleCount = 2, uniqueSourceCount = 1)
        assertTrue(CuratedItemIntegrity.detailTitleMatchesLeadSource(feedItem))
        assertTrue(CuratedItemIntegrity.sourcesBelongToItem(feedItem))
    }

    @Test
    fun `item B sources do not appear when opening item A`() {
        val itemA = item(
            "cluster-a",
            "Fransa uçağı düştü",
            listOf(SourceEvidence("AA", "Fransa uçağı düştü", "https://aa.com/1", 1L, null, null))
        )
        val itemB = item(
            "cluster-b",
            "Suudi helikopteri düştü",
            listOf(SourceEvidence("AA", "Suudi helikopteri düştü", "https://aa.com/2", 2L, null, null))
        )
        assertFalse(itemA.sources.any { it.originalTitle.contains("Suudi") })
        assertFalse(itemB.sources.any { it.originalTitle.contains("Fransa") })
    }

    @Test
    fun `article and unique source labels explain SINGLE_SOURCE with multiple articles`() {
        val label = CuratedSourceLabels.articleSourceSummary(articleCount = 2, uniqueSourceCount = 1)
        assertEquals("2 haber · 1 benzersiz kaynak", label)
        val evidence = CuratedSourceLabels.evidenceSummary(EvidenceStatus.SINGLE_SOURCE, 1)
        assertTrue(evidence.contains("tek benzersiz kaynak"))
    }
}
