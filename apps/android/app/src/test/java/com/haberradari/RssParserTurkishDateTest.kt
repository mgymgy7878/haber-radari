package com.haberradari

import com.haberradari.data.model.LegalMode
import com.haberradari.data.model.Source
import com.haberradari.data.remote.RssParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.ZoneId
import java.time.ZonedDateTime

/**
 * Türkçe RSS/Atom tarih parse testleri — TCMB benzeri resmi feed formatları.
 */
class RssParserTurkishDateTest {

    private val testSource = Source(
        id = "test-source",
        name = "Test",
        feedUrl = "https://example.com/rss",
        legalMode = LegalMode.RSS_METADATA_ONLY,
        enabled = true,
        category = "genel",
    )

    private fun istanbulEpoch(
        year: Int,
        month: Int,
        day: Int,
        hour: Int,
        minute: Int,
        second: Int,
    ): Long = ZonedDateTime.of(year, month, day, hour, minute, second, 0, ISTANBUL)
        .toInstant()
        .toEpochMilli()

    private fun articlePublishedAt(pubDate: String): Long {
        val item = RssParser.RssItem(
            title = "Test",
            link = "https://example.com/item",
            pubDate = pubDate,
            description = null,
        )
        return RssParser.toArticles(listOf(item), testSource).single().publishedAt
    }

    @Test
    fun `TCMB short month Haz parses to Istanbul timezone`() {
        assertEquals(
            istanbulEpoch(2026, 6, 18, 14, 0, 0),
            articlePublishedAt("18 Haz 2026 14:00:00"),
        )
    }

    @Test
    fun `Turkish short months Oca Sub Agu parse correctly`() {
        assertEquals(
            istanbulEpoch(2026, 1, 1, 0, 5, 10),
            articlePublishedAt("01 Oca 2026 00:05:10"),
        )
        assertEquals(
            istanbulEpoch(2026, 2, 5, 9, 30, 0),
            articlePublishedAt("05 Şub 2026 09:30:00"),
        )
        assertEquals(
            istanbulEpoch(2026, 8, 30, 23, 59, 59),
            articlePublishedAt("30 Ağu 2026 23:59:59"),
        )
    }

    @Test
    fun `Turkish full month name Haziran parses correctly`() {
        assertEquals(
            istanbulEpoch(2026, 6, 18, 14, 0, 0),
            articlePublishedAt("18 Haziran 2026 14:00:00"),
        )
    }

    @Test
    fun `ASCII month variants Sub and Agu parse correctly`() {
        assertEquals(
            istanbulEpoch(2026, 2, 5, 9, 30, 0),
            articlePublishedAt("05 Sub 2026 09:30:00"),
        )
        assertEquals(
            istanbulEpoch(2026, 8, 30, 23, 59, 59),
            articlePublishedAt("30 Agu 2026 23:59:59"),
        )
    }

    @Test
    fun `RFC 2822 pubDate regression unchanged`() {
        val item = RssParser.RssItem(
            title = "RFC item",
            link = "https://example.com/rfc",
            pubDate = "Thu, 26 Jun 2026 12:00:00 +0300",
            description = null,
        )
        val expected = java.text.SimpleDateFormat(
            "EEE, dd MMM yyyy HH:mm:ss Z",
            java.util.Locale.ENGLISH,
        ).parse("Thu, 26 Jun 2026 12:00:00 +0300")!!.time

        assertEquals(expected, RssParser.toArticles(listOf(item), testSource).single().publishedAt)
    }

    @Test
    fun `ISO 8601 pubDate regression unchanged`() {
        val item = RssParser.RssItem(
            title = "ISO item",
            link = "https://example.com/iso",
            pubDate = "2026-06-26T21:51:29+0300",
            description = null,
        )
        val expected = java.text.SimpleDateFormat(
            "yyyy-MM-dd'T'HH:mm:ssZ",
            java.util.Locale.ENGLISH,
        ).parse("2026-06-26T21:51:29+0300")!!.time

        assertEquals(expected, RssParser.toArticles(listOf(item), testSource).single().publishedAt)
    }

    @Test
    fun `unparseable date falls back to ingest time`() {
        val before = System.currentTimeMillis()
        val publishedAt = articlePublishedAt("totally invalid date")
        val after = System.currentTimeMillis()

        assertTrue(publishedAt in before..after)
    }

    companion object {
        private val ISTANBUL: ZoneId = ZoneId.of("Europe/Istanbul")
    }
}
