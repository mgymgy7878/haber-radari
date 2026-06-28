package com.haberradari.config

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
     * Eğer true ise, mobil uygulama doğrudan backend API'ye bağlanıp JSON çekmeye çalışır.
     */
    var aiRemoteFeedEnabled: Boolean = true

    /**
     * Eğer true ise ve Remote bağlantı başarısız olursa, Mock analizörüne (Fallback) düşer.
     */
    var aiRemoteFallbackToMockEnabled: Boolean = false

    const val smartFeedRawSourceExplorerEnabled = true // Sadece debug ekranları için

    /**
     * Eğer true ise, cihaz içinde çalışan MockSmartFeedAnalyzer kullanılır.
     */
    val aiLocalMockAnalyzerEnabled: Boolean = false

    /**
     * Smart Feed API Base URL. (Debug için localhost/127.0.0.1 kullanılır. adb reverse tcp:3001 tcp:3001 gerektirir)
     */
    var smartFeedBaseUrl: String = "http://127.0.0.1:3001"
}
