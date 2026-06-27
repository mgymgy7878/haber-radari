package com.haberradari.data.model

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

enum class ArticleVisibility {
    VISIBLE,
    SUPPRESSED,
    BOOSTED,
    NEEDS_REVIEW
}

/**
 * Haber makalesi Room entity.
 *
 * KASITLI OLARAK BULUNMAYAN ALANLAR:
 * - body
 * - fullText
 * - contentHtml
 * - articleText
 * - scrapedText
 *
 * Bu alanlar ADR kararı gereği asla eklenmeyecektir.
 * Bkz: LegalContentMode.NO_FULL_TEXT
 * Bkz: ArticleModelGuardTest (reflection ile doğrulama)
 *
 * @property sourceName Google Play kaynak atfı zorunluluğu — her haberde gösterilir
 * @property originalUrl Orijinal haber linki — her haberde gösterilir
 * @property contentHash SHA-256(title + canonicalUrl) — duplicate tespiti için
 */
@Entity(
    tableName = "articles",
    indices = [
        Index(value = ["contentHash"], unique = true),
        Index(value = ["sourceId"]),
        Index(value = ["publishedAt"])
    ]
)
data class Article(
    @PrimaryKey
    val id: String,

    /** Haber başlığı — her zaman zorunlu */
    val title: String,

    /**
     * Kısa açıklama / RSS description.
     * Yalnızca legalMode = RSS_METADATA_ONLY veya LICENSED ise dolu.
     * TITLE_LINK_ONLY modunda null olmalıdır.
     */
    val description: String? = null,

    /** Kaynak adı — Google Play kaynak atfı zorunluluğu */
    val sourceName: String,

    /** Source tablosuna referans */
    val sourceId: String,

    /** Orijinal haber linki — kullanıcı tıklayınca bu URL açılır */
    val originalUrl: String,

    /** Normalize edilmiş URL — dedup karşılaştırması için */
    val canonicalUrl: String,

    /** SHA-256(title + canonicalUrl) — duplicate tespiti */
    val contentHash: String,

    /** Yayın zamanı (epoch millis) */
    val publishedAt: Long,

    /** Fetch zamanı (epoch millis) */
    val fetchedAt: Long,

    /** RSS'den gelen thumbnail URL (varsa) */
    val imageUrl: String? = null,

    // --- AI Reader & Visibility Fields (v0 Contract) ---
    val visibility: ArticleVisibility = ArticleVisibility.NEEDS_REVIEW,
    val visibilityReason: String? = null,
    val shortAiSummary: String? = null,
    val detailedAiSummary: String? = null,
    val whyItMatters: String? = null,
    val publicInterestReason: String? = null,
    val emotionalTone: String? = null
)
