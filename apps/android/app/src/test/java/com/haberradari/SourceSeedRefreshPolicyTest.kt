package com.haberradari

import com.haberradari.data.local.ArticleDao
import com.haberradari.data.local.FeedHealthDao
import com.haberradari.data.local.SourceDao
import com.haberradari.data.model.Article
import com.haberradari.data.model.FeedHealth
import com.haberradari.data.model.LegalMode
import com.haberradari.data.model.Source
import com.haberradari.data.model.SourceAuthority
import com.haberradari.data.registry.AndroidSeedRegistryDeriver
import com.haberradari.data.registry.SourceSeedRefreshPolicy
import com.haberradari.data.repository.NewsRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/**
 * Room seed refresh policy — PR #45 teknik borcu (OnConflictStrategy.IGNORE legalMode drift).
 */
class SourceSeedRefreshPolicyTest {

    private val registryJson: String by lazy {
        val candidates = listOf(
            File("src/main/assets/source-registry-v0.json"),
            File("app/src/main/assets/source-registry-v0.json"),
            File("../../api/src/source-registry/source-registry-v0.json"),
            File("../../../api/src/source-registry/source-registry-v0.json"),
        )
        val file = candidates.firstOrNull { it.exists() }
            ?: error("source-registry-v0.json test için bulunamadı")
        file.readText()
    }

    private val registrySeeds: List<Source> by lazy {
        AndroidSeedRegistryDeriver.deriveDefaultSeedsFromRegistryJson(registryJson)
    }

    private val seedLoader: suspend () -> List<Source> = { registrySeeds }

    class FakeSourceDao : SourceDao {
        val sources = mutableMapOf<String, Source>()

        override fun getAllSources(): Flow<List<Source>> = flowOf(sources.values.toList())

        override suspend fun getEnabledSources(): List<Source> {
            return sources.values.filter { it.enabled && !it.legalMode.blocksProductionIngest() }
        }

        override suspend fun insertSource(source: Source) {
            if (!sources.containsKey(source.id)) {
                sources[source.id] = source
            }
        }

        override suspend fun insertSources(sourcesList: List<Source>) {
            for (s in sourcesList) {
                if (!sources.containsKey(s.id)) {
                    sources[s.id] = s
                }
            }
        }

        override suspend fun getSourceById(sourceId: String): Source? = sources[sourceId]

        override suspend fun updateSeedMetadata(
            id: String,
            name: String,
            feedUrl: String,
            legalMode: LegalMode,
            category: String,
            authorityLevel: SourceAuthority,
        ) {
            val existing = sources[id] ?: return
            sources[id] = existing.copy(
                name = name,
                feedUrl = feedUrl,
                legalMode = legalMode,
                category = category,
                authorityLevel = authorityLevel,
            )
        }

        override suspend fun updateSourceEnabled(id: String, enabled: Boolean) {
            val existing = sources[id] ?: return
            sources[id] = existing.copy(enabled = enabled)
        }

        fun seedExisting(source: Source) {
            sources[source.id] = source
        }
    }

    class FakeArticleDao : ArticleDao {
        override fun getAllArticles(): Flow<List<Article>> = flowOf(emptyList())
        override suspend fun insertArticle(article: Article) {}
        override suspend fun insertArticles(articles: List<Article>) {}
        override suspend fun getByContentHash(hash: String): Article? = null
        override suspend fun deleteOlderThan(cutoffMillis: Long) {}
        override suspend fun deleteDuplicates() {}
        override suspend fun getArticleCount(): Int = 0
        override fun getArticleCountsBySourceFlow(): Flow<List<com.haberradari.data.model.SourceArticleCount>> =
            flowOf(emptyList())
    }

    class FakeFeedHealthDao : FeedHealthDao {
        override suspend fun upsertHealth(health: FeedHealth) {}
        override suspend fun getHealthForSource(sourceId: String): FeedHealth? = null
        override suspend fun getAllHealth(): List<FeedHealth> = emptyList()
        override fun getAllHealthFlow(): Flow<List<FeedHealth>> = flowOf(emptyList())
    }

    private fun repository(dao: FakeSourceDao) = NewsRepository(
        FakeArticleDao(),
        dao,
        FakeFeedHealthDao(),
        defaultSeedLoader = seedLoader,
    )

    private fun legacySource(
        id: String,
        legalMode: LegalMode = LegalMode.RSS_METADATA_ONLY,
        enabled: Boolean = true,
    ): Source {
        val seed = registrySeeds.first { it.id == id }
        return seed.copy(legalMode = legalMode, enabled = enabled)
    }

    @Test
    fun `fresh install parity seed kaynak sayısı 3 ve legalMode doğru`() = runBlocking {
        val dao = FakeSourceDao()
        repository(dao).seedDefaultSources()

        assertEquals(3, dao.sources.size)
        assertEquals(LegalMode.TITLE_LINK_ONLY, dao.sources["ntv-turkiye"]?.legalMode)
        assertEquals(LegalMode.TITLE_LINK_ONLY, dao.sources["haberturk"]?.legalMode)
        assertEquals(LegalMode.NEEDS_REVIEW, dao.sources["bbc-turkce"]?.legalMode)
        assertFalse(dao.sources.containsKey("afad-official"))
    }

    @Test
    fun `existing install legalMode RSS_METADATA_ONLY iken refresh TITLE_LINK_ONLY yapar`() = runBlocking {
        val dao = FakeSourceDao()
        dao.seedExisting(legacySource("ntv-turkiye", LegalMode.RSS_METADATA_ONLY))
        dao.seedExisting(legacySource("haberturk", LegalMode.RSS_METADATA_ONLY))
        dao.seedExisting(legacySource("bbc-turkce", LegalMode.RSS_METADATA_ONLY))

        repository(dao).seedDefaultSources()

        assertEquals(LegalMode.TITLE_LINK_ONLY, dao.sources["ntv-turkiye"]?.legalMode)
        assertEquals(LegalMode.TITLE_LINK_ONLY, dao.sources["haberturk"]?.legalMode)
        assertEquals(LegalMode.NEEDS_REVIEW, dao.sources["bbc-turkce"]?.legalMode)
    }

    @Test
    fun `user enabled false tercihi refresh sonrası korunur`() = runBlocking {
        val dao = FakeSourceDao()
        dao.seedExisting(legacySource("ntv-turkiye", enabled = false))
        dao.seedExisting(legacySource("haberturk"))
        dao.seedExisting(legacySource("bbc-turkce"))

        repository(dao).seedDefaultSources()

        assertFalse(dao.sources["ntv-turkiye"]!!.enabled)
        assertTrue(dao.sources["haberturk"]!!.enabled)
    }

    @Test
    fun `registry 21 kaynak otomatik DB ye eklenmez`() = runBlocking {
        val dao = FakeSourceDao()
        dao.seedExisting(legacySource("ntv-turkiye"))
        repository(dao).seedDefaultSources()

        assertEquals(3, dao.sources.size)
        assertFalse(dao.sources.containsKey("afad-official"))
        assertFalse(dao.sources.containsKey("tcmb"))
        assertFalse(dao.sources.containsKey("deprem_afad"))
    }

    @Test
    fun `retired AFAD seed mevcut kurulumda kapatılır`() = runBlocking {
        val dao = FakeSourceDao()
        dao.seedExisting(
            Source(
                id = "afad-official",
                name = "AFAD",
                feedUrl = "https://www.afad.gov.tr/rss",
                legalMode = LegalMode.RSS_METADATA_ONLY,
                enabled = true,
                category = "afet",
                authorityLevel = SourceAuthority.OFFICIAL_PRIMARY,
            ),
        )
        dao.seedExisting(legacySource("ntv-turkiye"))
        dao.seedExisting(legacySource("haberturk"))
        dao.seedExisting(legacySource("bbc-turkce"))

        repository(dao).seedDefaultSources()

        assertFalse(dao.sources["afad-official"]!!.enabled)
    }

    @Test
    fun `BBC NEEDS_REVIEW ingest bloklu kalır`() = runBlocking {
        val dao = FakeSourceDao()
        repository(dao).seedDefaultSources()

        val bbc = dao.sources["bbc-turkce"]
        assertNotNull(bbc)
        assertTrue(bbc!!.legalMode.blocksProductionIngest())
        assertFalse(dao.getEnabledSources().any { it.id == "bbc-turkce" })
    }

    @Test
    fun `refresh idempotent ikinci çağrıda değişiklik yok`() = runBlocking {
        val dao = FakeSourceDao()
        dao.seedExisting(legacySource("ntv-turkiye", LegalMode.RSS_METADATA_ONLY))
        dao.seedExisting(legacySource("haberturk", LegalMode.RSS_METADATA_ONLY))
        dao.seedExisting(legacySource("bbc-turkce", LegalMode.RSS_METADATA_ONLY))

        val repo = repository(dao)
        repo.seedDefaultSources()
        val afterFirst = dao.sources.values.map { it.copy() }.associateBy { it.id }

        repo.seedDefaultSources()
        val afterSecond = dao.sources.values.map { it.copy() }.associateBy { it.id }

        assertEquals(afterFirst, afterSecond)
    }

    @Test
    fun `mergePreservingUserPreferences yalnızca enabled korur`() {
        val registrySeed = registrySeeds.first { it.id == "ntv-turkiye" }
        val existing = registrySeed.copy(enabled = false, legalMode = LegalMode.RSS_METADATA_ONLY)

        val merged = SourceSeedRefreshPolicy.mergePreservingUserPreferences(existing, registrySeed)

        assertFalse(merged.enabled)
        assertEquals(LegalMode.TITLE_LINK_ONLY, merged.legalMode)
        assertEquals(registrySeed.name, merged.name)
    }

    @Test
    fun `refreshable seed ids frozen binding ile sınırlı`() {
        assertEquals(3, SourceSeedRefreshPolicy.REFRESHABLE_SEED_IDS.size)
        assertTrue(SourceSeedRefreshPolicy.REFRESHABLE_SEED_IDS.contains("ntv-turkiye"))
        assertFalse(SourceSeedRefreshPolicy.REFRESHABLE_SEED_IDS.contains("afad-official"))
        assertFalse(SourceSeedRefreshPolicy.REFRESHABLE_SEED_IDS.contains("tcmb"))
    }
}
