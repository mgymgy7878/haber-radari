package com.haberradari.data.repository

import com.haberradari.data.local.ArticleDao
import com.haberradari.data.local.FeedHealthDao
import com.haberradari.data.local.SourceDao
import com.haberradari.data.model.Article
import com.haberradari.data.model.FeedHealth
import com.haberradari.data.model.Source
import com.haberradari.data.registry.SourceSeedRefreshPolicy
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
    private val httpClient: HttpClient = HttpClient(),
    private val defaultSeedLoader: suspend () -> List<Source>,
) {
    /** Makale akışı — UI bu Flow'u observe eder */
    fun getArticles(): Flow<List<Article>> = articleDao.getAllArticles()

    /** Kaynak, sağlık ve makale sayısı istatistikleri (Birleştirilmiş Flow) */
    fun getSourceStats(): Flow<List<com.haberradari.data.model.SourceStats>> = kotlinx.coroutines.flow.combine(
        sourceDao.getAllSources(),
        feedHealthDao.getAllHealthFlow(),
        articleDao.getArticleCountsBySourceFlow()
    ) { sources, healths, counts ->
        sources.map { source ->
            val health = healths.find { it.sourceId == source.id }
            val count = counts.find { it.sourceId == source.id }?.count ?: 0
            com.haberradari.data.model.SourceStats(source, health, count)
        }
    }

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
            // DISABLED / NEEDS_REVIEW double-check — DAO zaten filtreliyor
            if (source.legalMode.blocksProductionIngest()) continue

            try {
                val xml = fetchRssXml(source.feedUrl)
                val rssItems = RssParser.parseXml(xml)
                val rawArticles = RssParser.toArticles(rssItems, source)

                // AI Reader & Human Value Filter v0: Apply visibility rules
                val articles = rawArticles.map { article ->
                    val result = com.haberradari.data.remote.HumanValueClassifier.determineVisibility(article)
                    article.copy(
                        visibility = result.visibility,
                        visibilityReason = result.visibilityReason
                    )
                }

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

        // Veritabanındaki eski ve yeni yinelenen haberleri temizle
        articleDao.deleteDuplicates()



        return@withContext newArticlesCount
    }

    /** Kaynak akışı — UI routing için kullanılır */
    fun getSourcesFlow(): Flow<List<Source>> = sourceDao.getAllSources()

    /**
     * Kullanıcı kaynak aç/kapat tercihi.
     * DISABLED / NEEDS_REVIEW kaynaklarda enabled değişmez.
     */
    suspend fun setSourceEnabled(sourceId: String, enabled: Boolean) = withContext(Dispatchers.IO) {
        val existing = sourceDao.getSourceById(sourceId) ?: return@withContext
        if (existing.legalMode.blocksProductionIngest()) return@withContext
        sourceDao.updateSourceEnabled(sourceId, enabled)
    }

    /**
     * Varsayılan RSS kaynaklarını veritabanına yükler.
     *
     * 1. Eksik seed satırları INSERT IGNORE ile eklenir (fresh install).
     * 2. Mevcut frozen seed satırlarında registry metadata refresh edilir;
     *    kullanıcı [Source.enabled] tercihi korunur.
     */
    suspend fun seedDefaultSources() = withContext(Dispatchers.IO) {
        val registrySeeds = defaultSeedLoader()
        sourceDao.insertSources(registrySeeds)
        refreshExistingSeedMetadata(registrySeeds)
    }

    private suspend fun refreshExistingSeedMetadata(registrySeeds: List<Source>) {
        for (seed in registrySeeds) {
            if (seed.id !in SourceSeedRefreshPolicy.REFRESHABLE_SEED_IDS) continue
            val existing = sourceDao.getSourceById(seed.id) ?: continue
            if (!SourceSeedRefreshPolicy.needsMetadataRefresh(existing, seed)) continue
            val merged = SourceSeedRefreshPolicy.mergePreservingUserPreferences(existing, seed)
            sourceDao.updateSeedMetadata(
                id = merged.id,
                name = merged.name,
                feedUrl = merged.feedUrl,
                legalMode = merged.legalMode,
                category = merged.category,
                authorityLevel = merged.authorityLevel,
            )
        }
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
