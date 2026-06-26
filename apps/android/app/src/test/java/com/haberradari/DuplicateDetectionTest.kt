package com.haberradari

import com.haberradari.data.remote.RssParser
import org.junit.Assert.*
import org.junit.Test

/**
 * Duplicate detection testleri.
 *
 * Doğrulama:
 * - Aynı title + canonicalUrl → aynı contentHash
 * - Farklı title → farklı contentHash
 * - URL normalizasyon (trailing slash, http vs https)
 */
class DuplicateDetectionTest {

    @Test
    fun `same title and URL produce same hash`() {
        val hash1 = RssParser.computeContentHash(
            "Test Haber Başlığı",
            "https://example.com/haber/test"
        )
        val hash2 = RssParser.computeContentHash(
            "Test Haber Başlığı",
            "https://example.com/haber/test"
        )
        assertEquals(hash1, hash2)
    }

    @Test
    fun `different titles produce different hashes`() {
        val hash1 = RssParser.computeContentHash(
            "Haber A",
            "https://example.com/haber/test"
        )
        val hash2 = RssParser.computeContentHash(
            "Haber B",
            "https://example.com/haber/test"
        )
        assertNotEquals(hash1, hash2)
    }

    @Test
    fun `different URLs produce different hashes`() {
        val hash1 = RssParser.computeContentHash(
            "Aynı Başlık",
            "https://example.com/haber/1"
        )
        val hash2 = RssParser.computeContentHash(
            "Aynı Başlık",
            "https://example.com/haber/2"
        )
        assertNotEquals(hash1, hash2)
    }

    @Test
    fun `hash is valid SHA-256 hex string`() {
        val hash = RssParser.computeContentHash("Test", "https://example.com")
        assertEquals(64, hash.length) // SHA-256 = 64 hex chars
        assertTrue(hash.matches(Regex("[0-9a-f]+")))
    }

    // --- URL Normalizasyon ---

    @Test
    fun `trailing slash is removed`() {
        val normalized = RssParser.normalizeUrl("https://example.com/haber/")
        assertEquals("https://example.com/haber", normalized)
    }

    @Test
    fun `http is converted to https`() {
        val normalized = RssParser.normalizeUrl("http://example.com/haber")
        assertEquals("https://example.com/haber", normalized)
    }

    @Test
    fun `host is lowercased`() {
        val normalized = RssParser.normalizeUrl("https://EXAMPLE.COM/Haber")
        assertEquals("https://example.com/Haber", normalized)
    }

    @Test
    fun `same URL with different schemes normalize to same value`() {
        val http = RssParser.normalizeUrl("http://example.com/haber")
        val https = RssParser.normalizeUrl("https://example.com/haber")
        assertEquals(http, https)
    }

    @Test
    fun `same URL with and without trailing slash normalize to same value`() {
        val withSlash = RssParser.normalizeUrl("https://example.com/haber/")
        val withoutSlash = RssParser.normalizeUrl("https://example.com/haber")
        assertEquals(withSlash, withoutSlash)
    }

    @Test
    fun `normalized URLs produce same hash`() {
        val url1 = RssParser.normalizeUrl("http://Example.COM/haber/")
        val url2 = RssParser.normalizeUrl("https://example.com/haber")
        val hash1 = RssParser.computeContentHash("Başlık", url1)
        val hash2 = RssParser.computeContentHash("Başlık", url2)
        assertEquals(hash1, hash2)
    }
}
