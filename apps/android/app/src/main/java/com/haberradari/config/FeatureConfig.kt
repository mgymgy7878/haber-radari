package com.haberradari.config

import com.haberradari.BuildConfig

object FeatureConfig {
    /**
     * AI Reader (haber detayında buton ile özet) özelliği.
     * İkincil özellik olduğu için varsayılan olarak kapalı.
     */
    val isAiReaderEnabled: Boolean = false

    val allowIncompleteClusters = true // false in prod

    // Debug flags
    val smartFeedWatchlistPreviewEnabled = true

    /**
     * AI Curated Feed (ana akıllı liste) özelliği genel anahtarı.
     */
    val aiCuratedFeedEnabled: Boolean = true

    /**
     * Smart Feed API base URL — debug: BuildConfig HTTP localhost; release: HTTPS veya boş (remote kapalı).
     * Testler bu alanı geçici olarak override edebilir.
     */
    var smartFeedBaseUrl: String = BuildConfig.SMART_FEED_BASE_URL

    /**
     * Release: yalnızca HTTPS base URL yapılandırıldığında remote feed açık.
     * Debug: varsayılan açık (local HTTP + adb reverse).
     */
    var aiRemoteFeedEnabled: Boolean = resolveRemoteFeedEnabledDefault()

    /**
     * Eğer true ise ve Remote bağlantı başarısız olursa, Mock analizörüne (Fallback) düşer.
     */
    var aiRemoteFallbackToMockEnabled: Boolean = false

    const val smartFeedRawSourceExplorerEnabled = true // Sadece debug ekranları için

    /**
     * Eğer true ise, cihaz içinde çalışan MockSmartFeedAnalyzer kullanılır.
     */
    val aiLocalMockAnalyzerEnabled: Boolean = false

    fun resolveRemoteFeedEnabledDefault(): Boolean {
        if (BuildConfig.DEBUG) return true
        return isHttpsSmartFeedUrl(smartFeedBaseUrl)
    }

    fun isHttpsSmartFeedUrl(url: String): Boolean {
        val trimmed = url.trim()
        return trimmed.startsWith("https://", ignoreCase = true)
    }

    fun assertReleaseSmartFeedUrlPolicy() {
        if (BuildConfig.DEBUG) return
        val url = smartFeedBaseUrl.trim()
        require(url.isEmpty() || isHttpsSmartFeedUrl(url)) {
            "Release build yalnızca HTTPS smart feed base URL kabul eder; yapılandır: -PprodSmartFeedBaseUrl=https://..."
        }
        require(!url.startsWith("http://", ignoreCase = true)) {
            "Release build cleartext HTTP smart feed URL kullanamaz"
        }
    }
}
