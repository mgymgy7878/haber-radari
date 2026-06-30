package com.haberradari

import com.google.gson.Gson
import com.google.gson.JsonObject
import com.haberradari.data.model.LegalMode
import com.haberradari.data.model.SourceAuthority
import com.haberradari.data.registry.AndroidSeedRegistryDeriver
import com.haberradari.data.remote.RssParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/**
 * Global resmi kaynak seed v0 — PR #67 teknik audit + PR #68 ToS gate.
 */
class GlobalOfficialFeedSeedV0Test {

    private val registryJson: String by lazy {
        val file = File("app/src/main/assets/source-registry-v0.json").takeIf { it.exists() }
            ?: File("src/main/assets/source-registry-v0.json")
        file.readText()
    }

    private val seeds by lazy {
        AndroidSeedRegistryDeriver.deriveDefaultSeedsFromRegistryJson(registryJson)
    }

    private val riskyTerms = listOf(
        "doğrulandı",
        "kesin doğru",
        "yalan haber",
        "kanıtlandı",
    )

    @Test
    fun `global official seeds present with evidence feed URLs`() {
        val fed = seeds.find { it.id == "fed-press" }
        val eu = seeds.find { it.id == "eu-commission-press" }
        val usgs = seeds.find { it.id == "usgs-earthquakes" }

        assertEquals("https://www.federalreserve.gov/feeds/press_all.xml", fed?.feedUrl)
        assertEquals("https://ec.europa.eu/commission/presscorner/api/rss", eu?.feedUrl)
        assertEquals(
            "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.atom",
            usgs?.feedUrl,
        )
    }

    @Test
    fun `legalMode assignments match PR 68`() {
        assertEquals(LegalMode.TITLE_LINK_ONLY, seeds.find { it.id == "fed-press" }?.legalMode)
        assertEquals(LegalMode.TITLE_LINK_ONLY, seeds.find { it.id == "eu-commission-press" }?.legalMode)
        assertEquals(LegalMode.RSS_METADATA_ONLY, seeds.find { it.id == "usgs-earthquakes" }?.legalMode)
    }

    @Test
    fun `default enabled Fed and EU disabled USGS enabled`() {
        assertFalse(seeds.find { it.id == "fed-press" }!!.enabled)
        assertFalse(seeds.find { it.id == "eu-commission-press" }!!.enabled)
        assertTrue(seeds.find { it.id == "usgs-earthquakes" }!!.enabled)
    }

    @Test
    fun `official authority tier for global seeds`() {
        for (id in listOf("fed-press", "eu-commission-press", "usgs-earthquakes")) {
            assertEquals(SourceAuthority.OFFICIAL_PRIMARY, seeds.find { it.id == id }?.authorityLevel)
        }
    }

    @Test
    fun `excluded sources not in runtime seed`() {
        val runtimeIds = seeds.map { it.id }.toSet()
        val excluded = listOf(
            "ecb-press", "ecb_press",
            "cisa-news", "cisa_news",
            "who-news", "who_news",
            "reuters", "ap", "afp", "nyt",
        )
        for (id in excluded) {
            assertFalse("Unexpected seed: $id", runtimeIds.contains(id))
        }
    }

    @Test
    fun `BBC NEEDS_REVIEW unchanged`() {
        val bbc = seeds.find { it.id == "bbc-turkce" }
        assertEquals(LegalMode.NEEDS_REVIEW, bbc?.legalMode)
        assertTrue(bbc!!.legalMode.blocksProductionIngest())
    }

    @Test
    fun `registry forbidden fields include article body fields for global seeds`() {
        val document = Gson().fromJson(registryJson, JsonObject::class.java)
        val sources = document.getAsJsonArray("sources")
        for (registryId in listOf("fed_press", "eu_commission_press", "usgs_earthquakes")) {
            val entry = sources.first {
                it.asJsonObject.get("sourceId").asString == registryId
            }.asJsonObject
            val forbidden = entry.getAsJsonArray("forbiddenFields").map { it.asString }
            assertTrue(forbidden.contains("body"))
            assertTrue(forbidden.contains("articleSummary"))
            assertTrue(forbidden.contains("rawHtml"))
        }
    }

    @Test
    fun `TITLE_LINK_ONLY global feed does not persist description`() {
        val fed = seeds.first { it.id == "fed-press" }
        val item = RssParser.RssItem(
            title = "Fed statement",
            link = "https://www.federalreserve.gov/newsevents/pressreleases/test.htm",
            pubDate = "Thu, 25 Jun 2026 15:00:00 GMT",
            description = "Short duplicate title text",
        )
        val article = RssParser.toArticles(listOf(item), fed).single()
        assertNull(article.description)
    }

    @Test
    fun `USGS Atom plain text summary also null`() {
        val usgs = seeds.first { it.id == "usgs-earthquakes" }
        val item = RssParser.RssItem(
            title = "M 3.0 - California",
            link = "https://earthquake.usgs.gov/earthquakes/eventpage/test2",
            pubDate = "2026-06-30T10:00:00Z",
            description = "10 km NE of Sample City",
        )
        val article = RssParser.toArticles(listOf(item), usgs).single()
        assertNull(article.description)
    }

    @Test
    fun `EU Commission TITLE_LINK_ONLY does not persist description`() {
        val eu = seeds.first { it.id == "eu-commission-press" }
        val item = RssParser.RssItem(
            title = "Commission press release",
            link = "https://ec.europa.eu/commission/presscorner/detail/en/test",
            pubDate = "Mon, 30 Jun 2026 12:00:00 GMT",
            description = "Paragraph summary that must not appear in UI.",
        )
        val article = RssParser.toArticles(listOf(item), eu).single()
        assertNull(article.description)
    }

    @Test
    fun `USGS Atom ISO instant date parses`() {
        val usgs = seeds.first { it.id == "usgs-earthquakes" }
        val item = RssParser.RssItem(
            title = "M 2.1 - Test",
            link = "https://earthquake.usgs.gov/earthquakes/eventpage/test",
            pubDate = "2026-06-30T09:31:12.865Z",
            description = "<dl><dt>Time</dt><dd>2026-06-30</dd></dl>",
        )
        val article = RssParser.toArticles(listOf(item), usgs).single()
        assertTrue(article.publishedAt > 0)
        assertNull(article.description)
    }

    @Test
    fun `product language avoids verification claims in seed names`() {
        val names = seeds.joinToString(" ") { it.name }
        riskyTerms.forEach { term ->
            assertFalse(names.lowercase().contains(term))
        }
    }
}
