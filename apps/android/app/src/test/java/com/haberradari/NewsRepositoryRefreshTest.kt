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
import org.junit.Assert.assertEquals
import org.junit.Test

class NewsRepositoryRefreshTest {

    class EmptyEnabledSourceDao : SourceDao {
        override fun getAllSources(): Flow<List<Source>> = flowOf(emptyList())
        override suspend fun getEnabledSources(): List<Source> = emptyList()
        override suspend fun insertSource(source: Source) {}
        override suspend fun insertSources(sourcesList: List<Source>) {}
        override suspend fun getSourceById(sourceId: String): Source? = null
        override suspend fun updateSeedMetadata(
            id: String,
            name: String,
            feedUrl: String,
            legalMode: LegalMode,
            category: String,
            authorityLevel: SourceAuthority,
        ) {}
        override suspend fun updateSourceEnabled(id: String, enabled: Boolean) {}
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

    @Test
    fun `refreshFeeds skips network when no enabled sources`() = runBlocking {
        val repo = NewsRepository(
            FakeArticleDao(),
            EmptyEnabledSourceDao(),
            FakeFeedHealthDao(),
        ) { emptyList() }

        val inserted = repo.refreshFeeds()
        assertEquals(0, inserted)
    }

    @Test
    fun `countEnabledIngestSources returns zero when none enabled`() = runBlocking {
        val repo = NewsRepository(
            FakeArticleDao(),
            EmptyEnabledSourceDao(),
            FakeFeedHealthDao(),
        ) { emptyList() }

        assertEquals(0, repo.countEnabledIngestSources())
    }
}
