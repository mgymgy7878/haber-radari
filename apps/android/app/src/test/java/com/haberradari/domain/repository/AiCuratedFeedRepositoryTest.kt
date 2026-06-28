package com.haberradari.domain.repository

import com.haberradari.config.FeatureConfig
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File

/**
 * RemoteAiCuratedFeedRepository kalıcı JSON cache mekanizmasını test eder.
 *
 * Testler:
 * 1. Cache dosyası yazılmışsa getCachedFeed() doğru parse edilmiş veri döner.
 * 2. Cache dosyası yoksa getCachedFeed() null döner.
 * 3. Remote fail olduğunda ve cache varsa getCuratedFeed() cache'den döner.
 * 4. Remote fail olduğunda ve cache yoksa getCuratedFeed() exception fırlatır.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class AiCuratedFeedRepositoryTest {

    @get:Rule
    val tempFolder = TemporaryFolder()

    private lateinit var cacheDir: File
    private lateinit var repository: RemoteAiCuratedFeedRepository

    // Gerçek backend JSON'una birebir uyan minimal örnek.
    // latestRssPreview, WatchlistPreviewDto field listesine uygun yazıldı.
    private val sampleJson = """
        {
          "generatedAt": 1719572400000,
          "isDemo": false,
          "stats": {
            "totalScanned": 10,
            "candidateClusterCount": 2,
            "publishedCount": 1,
            "hiddenCount": 9,
            "watchlistCount": 0,
            "filteredCount": 0,
            "invariantOk": true
          },
          "items": [
            {
              "id": "cluster-1",
              "aiTitle": "Curated News Title 1",
              "aiSummary": "Summary 1",
              "category": "Gündem",
              "importance": "HIGH",
              "confidence": 0.9,
              "evidenceStatus": "CONFIRMED",
              "topicQuality": "HIGH",
              "contentType": "GENERAL",
              "publishDecision": "PUBLISH_MAIN",
              "publishReason": "reason",
              "warningLabel": null,
              "sourceCount": 2,
              "filteredSourceCount": 0,
              "sources": [
                {
                  "sourceName": "NTV",
                  "originalTitle": "Original Title 1",
                  "url": "http://example.com/1",
                  "publishedAt": 1719572400000,
                  "imageUrl": null,
                  "videoUrl": null
                }
              ],
              "mediaHints": null,
              "originalArticleIds": ["1", "2"],
              "smartDigest": {
                "status": "MOCKED",
                "summary": "[AI metadata özeti] Test",
                "keyPoints": ["Nokta 1"],
                "whyItMatters": "Test",
                "confidence": "MEDIUM",
                "sourcePolicy": "METADATA_ONLY",
                "modelProvider": "mock",
                "cacheKey": "cache-1",
                "generatedAt": "2026-06-28T00:00:00.000Z"
              }
            }
          ],
          "latestRssPreview": [
            {
              "id": "latest-1",
              "title": "Latest RSS 1",
              "category": "Genel",
              "publishDecision": "LATEST_RSS",
              "publishReason": null,
              "evidenceStatus": "LOW_CONFIDENCE",
              "contentType": "GENERAL",
              "topicQuality": "NORMAL",
              "sourceCount": 1,
              "reasonCode": null
            }
          ]
        }
    """.trimIndent()

    @Before
    fun setup() {
        cacheDir = tempFolder.newFolder()
        repository = RemoteAiCuratedFeedRepository(cacheDir)
        FeatureConfig.aiRemoteFeedEnabled = true
        FeatureConfig.smartFeedBaseUrl = "http://127.0.0.1:3001"
    }

    @Test
    fun `getCachedFeed returns null when cache file does not exist`() = runTest {
        val result = repository.getCachedFeed()
        assertNull(result)
    }

    @Test
    fun `getCachedFeed returns correct data when cache file exists`() = runTest {
        // Cache dosyasını önceden yaz
        val cacheFile = File(cacheDir, "smart_feed_cache.json")
        cacheFile.writeText(sampleJson)

        val result = repository.getCachedFeed()
        assertNotNull(result)
        assertEquals(1, result!!.items.size)
        assertEquals("Curated News Title 1", result.items[0].aiTitle)
        assertNotNull(result.items[0].smartDigest)
        assertEquals(com.haberradari.data.model.SmartDigestStatus.MOCKED, result.items[0].smartDigest!!.status)
        assertEquals(1, result.latestRssPreview?.size)
        assertEquals("Latest RSS 1", result.latestRssPreview!![0].title)
        assertTrue(result.isCached)
    }

    @Test
    fun `getCachedFeed marks result as cached`() = runTest {
        val cacheFile = File(cacheDir, "smart_feed_cache.json")
        cacheFile.writeText(sampleJson)

        val result = repository.getCachedFeed()
        assertNotNull(result)
        assertTrue(result!!.isCached)
    }

    @Test
    fun `getCuratedFeed falls back to cache when remote fails and cache exists`() = runTest {
        // Cache'i önceden yaz
        val cacheFile = File(cacheDir, "smart_feed_cache.json")
        cacheFile.writeText(sampleJson)

        // Geçersiz URL → network hatası
        FeatureConfig.smartFeedBaseUrl = "http://0.0.0.0:19999"

        val result = repository.getCuratedFeed(emptyList())
        assertNotNull(result)
        // Cache'den döndü
        assertTrue(result.isCached)
        assertTrue(result.isFallbackUsed)
        assertEquals("Curated News Title 1", result.items[0].aiTitle)
    }

    @Test
    fun `getCuratedFeed throws when remote fails and cache is empty`() = runTest {
        // Cache yok
        FeatureConfig.smartFeedBaseUrl = "http://0.0.0.0:19999"

        var threw = false
        try {
            repository.getCuratedFeed(emptyList())
        } catch (e: Exception) {
            threw = true
            // Hata mesajının bir şey içermesi yeterli
            assertNotNull(e.message)
        }
        assertTrue("getCuratedFeed should throw when cache is empty and remote fails", threw)
    }

    @Test
    fun `latestRssPreview items are preserved in cached result`() = runTest {
        val cacheFile = File(cacheDir, "smart_feed_cache.json")
        cacheFile.writeText(sampleJson)

        val result = repository.getCachedFeed()
        assertNotNull(result)
        val latest = result!!.latestRssPreview
        assertNotNull(latest)
        assertEquals(1, latest!!.size)
        assertEquals("latest-1", latest[0].id)
        assertEquals("Latest RSS 1", latest[0].title)
        assertEquals("LATEST_RSS", latest[0].publishDecision)
    }

    @Test
    fun `smartDigest maps on curated item but not on latestRssPreview path`() = runTest {
        val cacheFile = File(cacheDir, "smart_feed_cache.json")
        cacheFile.writeText(sampleJson)

        val result = repository.getCachedFeed()
        assertNotNull(result)
        assertNotNull(result!!.items[0].smartDigest)
        assertNotNull(result.latestRssPreview)
        assertEquals(1, result.latestRssPreview!!.size)
    }
}
