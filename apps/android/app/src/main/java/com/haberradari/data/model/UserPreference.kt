package com.haberradari.data.model

/**
 * Kullanıcı tercihleri — DataStore Preferences ile yönetilir (Room entity değil).
 *
 * Bu data class DataStore'daki key-value çiftlerinin tip güvenli temsilidir.
 */
data class UserPreference(
    /** Periyodik RSS sync açık mı */
    val autoSyncEnabled: Boolean = true,

    /** Sync periyodu (dakika) */
    val syncIntervalMinutes: Int = 30,

    /** Karanlık tema tercihi */
    val darkModeEnabled: Boolean = false,

    /** 30 günden eski haberleri otomatik sil */
    val autoDeleteOldArticles: Boolean = true
) {
    companion object {
        // DataStore key sabitleri
        const val KEY_AUTO_SYNC = "auto_sync_enabled"
        const val KEY_SYNC_INTERVAL = "sync_interval_minutes"
        const val KEY_DARK_MODE = "dark_mode_enabled"
        const val KEY_AUTO_DELETE = "auto_delete_old_articles"
    }
}
