package com.haberradari.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.haberradari.data.model.FeedHealth

@Dao
interface FeedHealthDao {
    /** Belirli kaynağın feed sağlık durumu */
    @Query("SELECT * FROM feed_health WHERE sourceId = :sourceId LIMIT 1")
    suspend fun getHealthForSource(sourceId: String): FeedHealth?

    /** Feed sağlık kaydını güncelle veya ekle */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertHealth(health: FeedHealth)

    /** Tüm feed sağlık kayıtları */
    @Query("SELECT * FROM feed_health")
    suspend fun getAllHealth(): List<FeedHealth>
}
