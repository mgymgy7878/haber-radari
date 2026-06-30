package com.haberradari.ui.feed

import com.haberradari.data.model.FeedHealth
import com.haberradari.data.model.LegalMode
import com.haberradari.data.model.Source
import com.haberradari.data.model.SourceAuthority
import com.haberradari.data.model.SourceStats
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
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

    private fun stats(
        source: Source = source(),
        articleCount: Int = 5,
        health: FeedHealth? = FeedHealth(
            sourceId = source.id,
            lastSuccessAt = 1_700_000_000_000L,
            consecutiveFailures = 0,
        ),
    ) = SourceStats(source = source, health = health, articleCount = articleCount)

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

    @Test
    fun `healthy source status message`() {
        assertEquals(
            "Kaynak son yenilemede veri sağladı.",
            SourceManagementUiLogic.sourceHealthStatusMessage(stats()),
        )
        assertNull(SourceManagementUiLogic.whyNotInFeedExplanation(stats()))
    }

    @Test
    fun `disabled source status message`() {
        val stat = stats(source = source(enabled = false))
        assertEquals(
            "Bu kaynak kapalı; akışa haber eklemez.",
            SourceManagementUiLogic.sourceHealthStatusMessage(stat),
        )
        assertNotNull(SourceManagementUiLogic.whyNotInFeedExplanation(stat))
    }

    @Test
    fun `NEEDS_REVIEW source status message`() {
        val stat = stats(source = source(legalMode = LegalMode.NEEDS_REVIEW))
        assertEquals(
            "İnceleme bekliyor; üretim akışına alınmaz.",
            SourceManagementUiLogic.sourceHealthStatusMessage(stat),
        )
        assertEquals(
            "İnceleme bekliyor; üretim akışına alınmaz.",
            SourceManagementUiLogic.whyNotInFeedExplanation(stat),
        )
    }

    @Test
    fun `zero article status message`() {
        val stat = stats(articleCount = 0)
        assertEquals(
            "Bu kaynaktan henüz kayıtlı haber yok. Yenileme sonrası tekrar kontrol et.",
            SourceManagementUiLogic.sourceHealthStatusMessage(stat),
        )
        assertNotNull(SourceManagementUiLogic.whyNotInFeedExplanation(stat))
    }

    @Test
    fun `consecutive failure status message`() {
        val stat = stats(
            health = FeedHealth(
                sourceId = "ntv-turkiye",
                lastSuccessAt = 1_700_000_000_000L,
                lastErrorAt = 1_700_000_100_000L,
                lastErrorMessage = "HTTP 404",
                consecutiveFailures = 2,
            ),
        )
        assertEquals(
            "Son yenilemelerde hata alındı; son kayıtlı haberler korunur.",
            SourceManagementUiLogic.sourceHealthStatusMessage(stat),
        )
        assertEquals("Ardışık hata: 2", SourceManagementUiLogic.formatConsecutiveFailures(stat.health))
    }

    @Test
    fun `sanitizeErrorMessage shortens stack traces`() {
        val raw = "HTTP 404 at com.example.Foo.bar(Foo.kt:12)\nat java.lang.Thread.run"
        assertEquals("HTTP 404", SourceManagementUiLogic.sanitizeErrorMessage(raw))
    }

    @Test
    fun `sanitizeErrorMessage truncates long messages`() {
        val raw = "x".repeat(200)
        val sanitized = SourceManagementUiLogic.sanitizeErrorMessage(raw)!!
        assertTrue(sanitized.length <= 120)
        assertTrue(sanitized.endsWith("…"))
    }

    @Test
    fun `buildSourceHealthDetails includes timestamps and article count`() {
        val stat = stats(
            health = FeedHealth(
                sourceId = "ntv-turkiye",
                lastSuccessAt = 1_718_000_000_000L,
                lastErrorAt = 1_718_000_100_000L,
                lastErrorMessage = "Timeout",
                consecutiveFailures = 1,
            ),
            articleCount = 12,
        )
        val details = SourceManagementUiLogic.buildSourceHealthDetails(stat)
        assertEquals("Kayıtlı haber: 12", details.articleCountLabel)
        assertNotNull(details.lastSuccessLabel)
        assertNotNull(details.lastErrorLabel)
        assertEquals("Timeout", details.lastErrorSummary)
        assertNotNull(details.consecutiveFailuresLabel)
    }

    @Test
    fun `health disclaimer avoids verification language`() {
        assertTrue(SourceManagementUiLogic.SOURCE_HEALTH_DISCLAIMER.contains("garanti etmez"))
        riskyTerms.forEach { term ->
            assertFalse(SourceManagementUiLogic.SOURCE_HEALTH_DISCLAIMER.lowercase().contains(term))
        }
    }

    @Test
    fun `health status messages avoid verification language`() {
        val messages = listOf(
            SourceManagementUiLogic.sourceHealthStatusMessage(stats()),
            SourceManagementUiLogic.sourceHealthStatusMessage(stats(source = source(enabled = false))),
            SourceManagementUiLogic.sourceHealthStatusMessage(stats(source = source(legalMode = LegalMode.NEEDS_REVIEW))),
            SourceManagementUiLogic.sourceHealthStatusMessage(stats(articleCount = 0)),
        )
        messages.forEach { message ->
            riskyTerms.forEach { term ->
                assertFalse(message.lowercase().contains(term))
            }
        }
    }
}
