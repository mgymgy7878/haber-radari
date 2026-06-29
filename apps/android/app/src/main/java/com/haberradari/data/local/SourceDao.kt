package com.haberradari.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.haberradari.data.model.LegalMode
import com.haberradari.data.model.Source
import com.haberradari.data.model.SourceAuthority
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
    @Query("SELECT * FROM sources WHERE legalMode NOT IN ('DISABLED', 'NEEDS_REVIEW') AND enabled = 1")
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

    /**
     * Registry SSOT seed metadata refresh — yalnızca güvenli alanlar.
     * [Source.enabled] güncellenmez; kullanıcı tercihi korunur.
     */
    @Query(
        """
        UPDATE sources SET
            name = :name,
            feedUrl = :feedUrl,
            legalMode = :legalMode,
            category = :category,
            authorityLevel = :authorityLevel
        WHERE id = :id
        """,
    )
    suspend fun updateSeedMetadata(
        id: String,
        name: String,
        feedUrl: String,
        legalMode: LegalMode,
        category: String,
        authorityLevel: SourceAuthority,
    )
}
