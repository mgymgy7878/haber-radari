package com.haberradari.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Feed sağlık durumu kaydı.
 * Her RSS kaynağının son fetch sonucunu takip eder.
 */
@Entity(tableName = "feed_health")
data class FeedHealth(
    /** Source tablosuna FK */
    @PrimaryKey
    val sourceId: String,

    /** Son başarılı fetch zamanı (epoch millis) */
    val lastSuccessAt: Long? = null,

    /** Son hata zamanı (epoch millis) */
    val lastErrorAt: Long? = null,

    /** Son hata mesajı */
    val lastErrorMessage: String? = null,

    /** Üst üste başarısız fetch sayısı */
    val consecutiveFailures: Int = 0
)
