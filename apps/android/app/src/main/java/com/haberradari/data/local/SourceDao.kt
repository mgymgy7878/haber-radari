package com.haberradari.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.haberradari.data.model.Source
import kotlinx.coroutines.flow.Flow

@Dao
interface SourceDao {
    /** Tüm kaynaklar */
    @Query("SELECT * FROM sources ORDER BY name ASC")
    fun getAllSources(): Flow<List<Source>>

    /**
     * Aktif kaynaklar — DISABLED ve kullanıcı tarafından kapatılmış olanlar hariç.
     * RSS sync yalnızca bu listeyi kullanır.
     */
    @Query("SELECT * FROM sources WHERE legalMode != 'DISABLED' AND enabled = 1")
    suspend fun getEnabledSources(): List<Source>

    /** Kaynak ekleme/güncelleme */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSource(source: Source)

    /** Toplu kaynak ekleme */
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertSources(sources: List<Source>)

    /** Kaynak ID ile getir */
    @Query("SELECT * FROM sources WHERE id = :sourceId LIMIT 1")
    suspend fun getSourceById(sourceId: String): Source?
}
