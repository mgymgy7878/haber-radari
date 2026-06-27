package com.haberradari.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Haber kaynağı tanımı.
 *
 * @property legalMode Bu kaynağın yasal içerik çekme modu
 * @property enabled Kullanıcı tarafından kapatılabilir
 */
@Entity(tableName = "sources")
data class Source(
    @PrimaryKey
    val id: String,

    /** Gösterim adı */
    val name: String,

    /** RSS feed URL'si */
    val feedUrl: String,

    /** Yasal içerik modu — varsayılan: RSS_METADATA_ONLY */
    val legalMode: LegalMode = LegalMode.RSS_METADATA_ONLY,

    /** Kullanıcı tarafından açık/kapalı */
    val enabled: Boolean = true,

    /** Haber kategorisi */
    val category: String = "genel",
    
    /** Kaynağın otorite seviyesi */
    val authorityLevel: SourceAuthority = SourceAuthority.GENERAL_MEDIA
)
