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
import org.junit.Assert.assertTrue
import org.junit.Test

class SourceManagementRepositoryTest {

    class TrackingSourceDao : SourceDao {
        val sources = mutableMapOf<String, Source>()

        fun seed(source: Source) {
            sources[source.id] = source
        }

        override fun getAllSources(): Flow<List<Source>> = flowOf(sources.values.toList())

        override suspend fun getEnabledSources(): List<Source> =
            sources.values.filter { it.enabled && !it.legalMode.blocksProductionIngest() }

        override suspend fun insertSource(source: Source) {
            sources[source.id] = source
        }

        override suspend fun insertSources(sourcesList: List<Source>) {
            sourcesList.forEach { insertSource(it) }
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
        }

        override suspend fun updateSourceEnabled(id: String, enabled: Boolean) {
            sources[id]?.let { sources[id] = it.copy(enabled = enabled) }
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

    private fun repository(dao: TrackingSourceDao) = NewsRepository(
        FakeArticleDao(),
        dao,
        FakeFeedHealthDao(),
        defaultSeedLoader = { emptyList() },
    )

    @Test
    fun `setSourceEnabled updates enabled for TITLE_LINK_ONLY`() = runBlocking {
        val dao = TrackingSourceDao()
        dao.seed(
            Source(
                id = "ntv",
                name = "NTV",
                feedUrl = "https://ntv.com/rss",
                legalMode = LegalMode.TITLE_LINK_ONLY,
                enabled = true,
                category = "türkiye",
            ),
        )
        val repo = repository(dao)

        repo.setSourceEnabled("ntv", false)

        assertFalse(dao.sources["ntv"]!!.enabled)
    }

    @Test
    fun `setSourceEnabled ignores NEEDS_REVIEW`() = runBlocking {
        val dao = TrackingSourceDao()
        dao.seed(
            Source(
                id = "bbc",
                name = "BBC",
                feedUrl = "https://bbc.com/rss",
                legalMode = LegalMode.NEEDS_REVIEW,
                enabled = true,
                category = "dünya",
            ),
        )
        val repo = repository(dao)

        repo.setSourceEnabled("bbc", false)

        assertTrue(dao.sources["bbc"]!!.enabled)
    }

    @Test
    fun `setSourceEnabled ignores DISABLED`() = runBlocking {
        val dao = TrackingSourceDao()
        dao.seed(
            Source(
                id = "off",
                name = "Off",
                feedUrl = "https://off.com/rss",
                legalMode = LegalMode.DISABLED,
                enabled = false,
                category = "genel",
            ),
        )
        val repo = repository(dao)

        repo.setSourceEnabled("off", true)

        assertFalse(dao.sources["off"]!!.enabled)
    }
}
