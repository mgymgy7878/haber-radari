package com.haberradari.ui.feed

import com.haberradari.domain.repository.AiCuratedFeedResult

/**
 * Feed refresh / offline-cache davranışı — test edilebilir saf mantık.
 */
object FeedRefreshUiLogic {

    enum class RefreshOutcome {
        SUCCESS,
        FAILED_SHOWING_CACHE,
        FAILED_NO_CACHE,
        SKIPPED_NO_ACTIVE_SOURCES,
    }

    fun shouldSkipNetworkRefresh(enabledSourceCount: Int): Boolean = enabledSourceCount <= 0

    fun noActiveSourcesMessage(): String =
        "Aktif kaynak yok. Kaynak Yönetimi ekranından en az bir kaynak açın."

    fun cachedContentBannerMessage(cacheAgeText: String?): String {
        val age = cacheAgeText?.takeIf { it.isNotBlank() }?.let { " ($it)" }.orEmpty()
        return "Son kayıtlı haberler gösteriliyor.$age"
    }

    fun cachedErrorBannerMessage(cacheAgeText: String?): String {
        val age = cacheAgeText?.takeIf { it.isNotBlank() }?.let { " ($it)" }.orEmpty()
        return "Bağlantı alınamadı; son kayıtlı haberler gösteriliyor.$age"
    }

    fun errorWithCachedContentMessage(errorMessage: String, cacheAgeText: String?): String {
        val age = cacheAgeText?.takeIf { it.isNotBlank() }?.let { " ($it)" }.orEmpty()
        return "Bağlantı alınamadı; son kayıtlı haberler gösteriliyor.$age Hata: $errorMessage"
    }

    /**
     * Fetch/refresh hatasında mevcut UI içeriğini korur; yalnızca hata alanlarını günceller.
     */
    fun mergeErrorPreservingContent(state: FeedUiState, errorMessage: String): FeedUiState {
        val hasContent = state.hasFeedData() || state.articles.isNotEmpty()
        return if (hasContent) {
            state.copy(
                lastError = errorMessage,
                isShowingCachedData = true,
                isInitialLoading = false,
                isRemoteLoading = false,
                refreshOutcome = RefreshOutcome.FAILED_SHOWING_CACHE,
            )
        } else {
            state.copy(
                lastError = errorMessage,
                isInitialLoading = false,
                isRemoteLoading = false,
                refreshOutcome = RefreshOutcome.FAILED_NO_CACHE,
            )
        }
    }

    fun applyCachedSnapshot(
        state: FeedUiState,
        cached: AiCuratedFeedResult,
        errorMessage: String?,
        formatCacheAge: (Long) -> String,
    ): FeedUiState = state.copy(
        curatedItems = cached.items,
        latestRssPreview = cached.latestRssPreview,
        isInitialLoading = false,
        isRemoteLoading = false,
        lastError = errorMessage,
        isShowingCachedData = true,
        cacheAgeText = formatCacheAge(cached.generatedAt),
        totalAnalyzed = cached.totalScanned,
        publishedCount = cached.publishedCount,
        hiddenCount = cached.hiddenCount,
        candidateClusterCount = cached.candidateClusterCount,
        invariantOk = cached.invariantOk,
        invariantError = cached.invariantError,
        source = cached.source,
        isFallbackUsed = errorMessage != null || cached.isFallbackUsed,
        fallbackReason = cached.fallbackReason ?: errorMessage,
        watchlistPreview = cached.watchlistPreview,
        rawPreview = cached.rawPreview,
        noisePreview = cached.noisePreview,
        lastUpdatedAt = cached.generatedAt,
        refreshOutcome = if (errorMessage != null) {
            RefreshOutcome.FAILED_SHOWING_CACHE
        } else {
            RefreshOutcome.SUCCESS
        },
    )

    fun formatRefreshOutcomeLabel(outcome: RefreshOutcome?): String? = when (outcome) {
        RefreshOutcome.SUCCESS -> "Yenileme tamamlandı"
        RefreshOutcome.FAILED_SHOWING_CACHE -> "Yenileme başarısız — önbellek korundu"
        RefreshOutcome.FAILED_NO_CACHE -> "Yenileme başarısız"
        RefreshOutcome.SKIPPED_NO_ACTIVE_SOURCES -> "Yenileme atlandı — aktif kaynak yok"
        null -> null
    }
}
