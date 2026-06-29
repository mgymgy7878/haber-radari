package com.haberradari

import com.haberradari.data.local.ArticleDao
import com.haberradari.data.local.FeedHealthDao
import com.haberradari.data.local.SourceDao
import com.haberradari.data.model.Article
import com.haberradari.data.model.FeedHealth
import com.haberradari.data.model.LegalMode
import com.haberradari.data.model.Source
import com.haberradari.data.model.SourceAuthority
import com.haberradari.data.repository.NewsRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Disabled Source state overwriting risk test.
 * 
 * Verifies that seedDefaultSources() does NOT overwrite user-disabled source state
 * if called multiple times (e.g. on every FeedViewModel refresh).
 */
class DefaultSourceSeedTest {

    // In-memory fake to simulate Room's OnConflictStrategy.IGNORE behavior
    class FakeSourceDao : SourceDao {
        val sources = mutableMapOf<String, Source>()

        override fun getAllSources(): Flow<List<Source>> = flowOf(sources.values.toList())

        override suspend fun getEnabledSources(): List<Source> {
            return sources.values.filter { it.enabled && !it.legalMode.blocksProductionIngest() }
        }

        override suspend fun insertSource(source: Source) {
            // IGNORE behavior: do not insert if it already exists
            if (!sources.containsKey(source.id)) {
                sources[source.id] = source
            }
        }

        override suspend fun insertSources(sourcesList: List<Source>) {
            // IGNORE behavior
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
        
        fun forceUpdateSource(source: Source) {
            // Helper to simulate a manual Room UPDATE
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
        override fun getArticleCountsBySourceFlow(): Flow<List<com.haberradari.data.model.SourceArticleCount>> = flowOf(emptyList())
    }
    
    class FakeFeedHealthDao : FeedHealthDao {
        override suspend fun upsertHealth(health: FeedHealth) {}
        override suspend fun getHealthForSource(sourceId: String): FeedHealth? = null
        override suspend fun getAllHealth(): List<FeedHealth> = emptyList()
        override fun getAllHealthFlow(): Flow<List<FeedHealth>> = flowOf(emptyList())
    }

    private val testSeedLoader: suspend () -> List<Source> = {
        listOf(
            Source(
                id = "ntv-turkiye",
                name = "NTV Türkiye",
                feedUrl = "https://www.ntv.com.tr/turkiye.rss",
                legalMode = LegalMode.TITLE_LINK_ONLY,
                category = "türkiye",
                authorityLevel = SourceAuthority.GENERAL_MEDIA,
            ),
        )
    }

    @Test
    fun `seedDefaultSources does not overwrite disabled source state`() = runBlocking {
        val fakeDao = FakeSourceDao()
        val repo = NewsRepository(
            FakeArticleDao(),
            fakeDao,
            FakeFeedHealthDao(),
            defaultSeedLoader = testSeedLoader,
        )
        
        // 1. Initial seed (first app run)
        repo.seedDefaultSources()
        val defaultSource = fakeDao.sources["ntv-turkiye"]
        assertNotNull(defaultSource)
        assertTrue("Source should initially be enabled", defaultSource!!.enabled)
        
        // 2. User disables the source
        fakeDao.forceUpdateSource(defaultSource.copy(enabled = false))
        
        // 3. Seed again (e.g. FeedViewModel refresh)
        repo.seedDefaultSources()
        
        // 4. Verification: The user's disabled choice MUST NOT be overwritten
        val updatedSource = fakeDao.sources["ntv-turkiye"]
        assertNotNull(updatedSource)
        assertFalse(
            "User's disabled state must be preserved, not overwritten by default seed", 
            updatedSource!!.enabled
        )
    }
}
