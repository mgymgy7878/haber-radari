package com.haberradari.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.haberradari.data.model.Article
import kotlinx.coroutines.flow.Flow

@Dao
interface ArticleDao {
    /** Tüm makaleler — yayın tarihine göre azalan sırada */
    @Query("SELECT * FROM articles ORDER BY publishedAt DESC")
    fun getAllArticles(): Flow<List<Article>>

    @Query("SELECT * FROM articles")
    suspend fun getArticlesSnapshot(): List<Article>

    @Query("DELETE FROM articles WHERE id IN (:ids)")
    suspend fun deleteByIds(ids: List<String>)

    /** Tek makale ekleme — duplicate varsa atla (contentHash UNIQUE index) */
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertArticle(article: Article)

    /** Toplu makale ekleme — duplicate'lar atlanır */
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertArticles(articles: List<Article>)

    /** contentHash ile duplicate kontrolü */
    @Query("SELECT * FROM articles WHERE contentHash = :hash LIMIT 1")
    suspend fun getByContentHash(hash: String): Article?

    /** 30 günden eski makaleleri sil (Google Play güncellik kuralı) */
    @Query("DELETE FROM articles WHERE publishedAt < :cutoffMillis")
    suspend fun deleteOlderThan(cutoffMillis: Long)

    /** URL ve Başlık bazlı duplicate temizliği (Aynı kaynakta) */
    @Query("""
        DELETE FROM articles 
        WHERE id NOT IN (
            SELECT id FROM (
                SELECT id, MAX(publishedAt) 
                FROM articles 
                GROUP BY sourceId, title
            )
        ) OR id NOT IN (
            SELECT id FROM (
                SELECT id, MAX(publishedAt) 
                FROM articles 
                GROUP BY sourceId, canonicalUrl
            )
        )
    """)
    suspend fun deleteDuplicates()

    /** Toplam makale sayısı */
    @Query("SELECT COUNT(*) FROM articles")
    suspend fun getArticleCount(): Int

}
