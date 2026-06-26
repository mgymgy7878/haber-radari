package com.haberradari.data.repository

import com.haberradari.data.local.ArticleDao
import com.haberradari.data.local.FeedHealthDao
import com.haberradari.data.local.SourceDao
import com.haberradari.data.model.Article
import com.haberradari.data.model.FeedHealth
import com.haberradari.data.model.LegalMode
import com.haberradari.data.model.Source
import com.haberradari.data.remote.RssParser
import io.ktor.client.HttpClient
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.statement.bodyAsText
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext

/**
 * Haber repository — RSS çekme, parse ve yerel cache yönetimi.
 *
 * DEĞİŞMEZ KURALLAR:
 * - Yalnızca RSS metadata çeker; tam metin çekmez
 * - DISABLED kaynakları atlar
 * - TITLE_LINK_ONLY modunda description saklamaz
 * - Scraping yapmaz
 * - LLM/AI özet üretmez
 */
class NewsRepository(
    private val articleDao: ArticleDao,
    private val sourceDao: SourceDao,
    private val feedHealthDao: FeedHealthDao,
    private val httpClient: HttpClient = HttpClient()
) {
    /** Makale akışı — UI bu Flow'u observe eder */
    fun getArticles(): Flow<List<Article>> = articleDao.getAllArticles()

    /**
     * Tüm aktif kaynakları çek, parse et ve Room'a yaz.
     * DISABLED ve kullanıcı-kapalı kaynaklar atlanır.
     *
     * @return Başarıyla eklenen yeni makale sayısı
     */
    suspend fun refreshFeeds(): Int = withContext(Dispatchers.IO) {
        val enabledSources = sourceDao.getEnabledSources()
        android.util.Log.d("NewsFlow", "NewsRepository refreshFeeds started with ${enabledSources.size} sources")
        var newArticlesCount = 0

        for (source in enabledSources) {
            // DISABLED kaynak kontrolü (double-check — DAO zaten filtreliyor)
            if (source.legalMode == LegalMode.DISABLED) continue

            try {
                val xml = fetchRssXml(source.feedUrl)
                val rssItems = RssParser.parseXml(xml)
                val articles = RssParser.toArticles(rssItems, source)

                val startDb = System.currentTimeMillis()
                // Duplicate'lar INSERT IGNORE ile otomatik atlanır
                articleDao.insertArticles(articles)
                android.util.Log.d("NewsFlow", "DB insert end for ${source.name}: ${System.currentTimeMillis() - startDb} ms")
                newArticlesCount += articles.size

                // Feed health güncelle — başarılı
                feedHealthDao.upsertHealth(
                    FeedHealth(
                        sourceId = source.id,
                        lastSuccessAt = System.currentTimeMillis(),
                        consecutiveFailures = 0
                    )
                )
            } catch (e: Exception) {
                // Feed health güncelle — hatalı
                val currentHealth = feedHealthDao.getHealthForSource(source.id)
                feedHealthDao.upsertHealth(
                    FeedHealth(
                        sourceId = source.id,
                        lastSuccessAt = currentHealth?.lastSuccessAt,
                        lastErrorAt = System.currentTimeMillis(),
                        lastErrorMessage = e.message ?: "Bilinmeyen hata",
                        consecutiveFailures = (currentHealth?.consecutiveFailures ?: 0) + 1
                    )
                )
            }
        }

        // 30 günden eski makaleleri temizle (Google Play güncellik kuralı)
        val thirtyDaysAgo = System.currentTimeMillis() - (30L * 24 * 60 * 60 * 1000)
        articleDao.deleteOlderThan(thirtyDaysAgo)

        return@withContext newArticlesCount
    }

    /**
     * Varsayılan RSS kaynaklarını veritabanına yükler (ilk çalıştırma).
     * Mevcut kaynakları ezmez (REPLACE strategy ile günceller).
     */
    suspend fun seedDefaultSources() = withContext(Dispatchers.IO) {
        val defaults = listOf(
            Source(
                id = "ntv-turkiye",
                name = "NTV Türkiye",
                feedUrl = "https://www.ntv.com.tr/turkiye.rss",
                legalMode = LegalMode.RSS_METADATA_ONLY,
                category = "türkiye"
            ),
            Source(
                id = "bbc-turkce",
                name = "BBC Türkçe",
                feedUrl = "https://feeds.bbci.co.uk/turkce/rss.xml",
                legalMode = LegalMode.RSS_METADATA_ONLY,
                category = "dünya"
            ),
            Source(
                id = "haberturk",
                name = "Habertürk",
                feedUrl = "https://www.haberturk.com/rss",
                legalMode = LegalMode.RSS_METADATA_ONLY,
                category = "genel"
            )
        )
        sourceDao.insertSources(defaults)
    }

    /**
     * RSS XML'i HTTP ile çeker.
     * Timeout: 12 saniye.
     */
    private suspend fun fetchRssXml(url: String): String {
        val response = httpClient.get(url) {
            header("Accept", "application/rss+xml, application/xml, text/xml")
            header("User-Agent", "HaberRadari/0.1 (RSS Reader)")
        }
        return response.bodyAsText()
    }
}
