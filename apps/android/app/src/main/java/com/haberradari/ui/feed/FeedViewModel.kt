package com.haberradari.ui.feed

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.haberradari.data.model.Article
import com.haberradari.data.repository.NewsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch
import com.haberradari.data.model.AiCuratedNewsItem
import com.haberradari.domain.repository.AiCuratedFeedRepository
import com.haberradari.domain.repository.FeedSource

/**
 * Feed ekranı ViewModel.
 *
 * UiState sealed class ile Loading / Empty / Error / Success durumlarını yönetir.
 */
data class FeedUiState(
    val curatedItems: List<AiCuratedNewsItem>? = null,
    val latestRssPreview: List<com.haberradari.domain.repository.WatchlistPreviewItem>? = null,
    val isInitialLoading: Boolean = true,
    val isReadingCache: Boolean = false,
    val isRemoteLoading: Boolean = false,
    val lastError: String? = null,
    val isShowingCachedData: Boolean = false,
    val cacheAgeText: String? = null,
    val totalAnalyzed: Int = 0,
    val publishedCount: Int = 0,
    val hiddenCount: Int = 0,
    val candidateClusterCount: Int = 0,
    val invariantOk: Boolean? = null,
    val invariantError: String? = null,
    val source: com.haberradari.domain.repository.FeedSource? = null,
    val isFallbackUsed: Boolean = false,
    val fallbackReason: String? = null,
    val watchlistPreview: List<com.haberradari.domain.repository.WatchlistPreviewItem>? = null,
    val rawPreview: List<com.haberradari.domain.repository.WatchlistPreviewItem>? = null,
    val noisePreview: List<com.haberradari.domain.repository.WatchlistPreviewItem>? = null,
    val articles: List<Article> = emptyList()
)

class FeedViewModel(
    private val repository: NewsRepository,
    private val aiFeedRepository: AiCuratedFeedRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(FeedUiState())
    val uiState: StateFlow<FeedUiState> = _uiState.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    init {
        loadCachedData()
        observeArticles()
        refresh()
    }

    private fun loadCachedData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isReadingCache = true)
            try {
                val cached = aiFeedRepository.getCachedFeed()
                if (cached != null) {
                    _uiState.value = _uiState.value.copy(
                        curatedItems = cached.items,
                        latestRssPreview = cached.latestRssPreview,
                        isInitialLoading = false,
                        isReadingCache = false,
                        isShowingCachedData = true,
                        cacheAgeText = formatCacheAge(cached.generatedAt),
                        totalAnalyzed = cached.totalScanned,
                        publishedCount = cached.publishedCount,
                        hiddenCount = cached.hiddenCount,
                        candidateClusterCount = cached.candidateClusterCount,
                        invariantOk = cached.invariantOk,
                        invariantError = cached.invariantError,
                        source = cached.source,
                        isFallbackUsed = cached.isFallbackUsed,
                        fallbackReason = cached.fallbackReason,
                        watchlistPreview = cached.watchlistPreview,
                        rawPreview = cached.rawPreview,
                        noisePreview = cached.noisePreview
                    )
                } else {
                    _uiState.value = _uiState.value.copy(isReadingCache = false)
                }
            } catch (e: Exception) {
                android.util.Log.e("FeedViewModel", "Failed to load cached feed: ${e.message}")
                _uiState.value = _uiState.value.copy(isReadingCache = false)
            }
        }
    }

    /**
     * Room'daki makale değişikliklerini gözlemle.
     * Flow sayesinde yeni makale eklendiğinde UI otomatik güncellenir.
     */
    private fun observeArticles() {
        viewModelScope.launch {
            repository.getArticles()
                .catch { e ->
                    val errorMsg = mapErrorMessage(e)
                    _uiState.value = _uiState.value.copy(
                        lastError = errorMsg,
                        isInitialLoading = false
                    )
                }
                .collect { articles ->
                    _uiState.value = _uiState.value.copy(articles = articles)
                    fetchCuratedFeed(articles)
                }
        }
    }

    private suspend fun fetchCuratedFeed(articles: List<Article>) {
        _uiState.value = _uiState.value.copy(isRemoteLoading = true)
        try {
            val result = aiFeedRepository.getCuratedFeed(articles)

            _uiState.value = _uiState.value.copy(
                curatedItems = result.items,
                latestRssPreview = result.latestRssPreview,
                isInitialLoading = false,
                lastError = null,
                isShowingCachedData = result.isCached,
                cacheAgeText = if (result.isCached) formatCacheAge(result.generatedAt) else null,
                totalAnalyzed = result.totalScanned,
                publishedCount = result.publishedCount,
                hiddenCount = result.hiddenCount,
                candidateClusterCount = result.candidateClusterCount,
                invariantOk = result.invariantOk,
                invariantError = result.invariantError,
                source = result.source,
                isFallbackUsed = result.isFallbackUsed,
                fallbackReason = result.fallbackReason,
                watchlistPreview = result.watchlistPreview,
                rawPreview = result.rawPreview,
                noisePreview = result.noisePreview
            )
        } catch (e: Exception) {
            val errorMsg = mapErrorMessage(e)

            val cached = aiFeedRepository.getCachedFeed()
            if (cached != null) {
                _uiState.value = _uiState.value.copy(
                    curatedItems = cached.items,
                    latestRssPreview = cached.latestRssPreview,
                    isInitialLoading = false,
                    lastError = errorMsg,
                    isShowingCachedData = true,
                    cacheAgeText = formatCacheAge(cached.generatedAt),
                    totalAnalyzed = cached.totalScanned,
                    publishedCount = cached.publishedCount,
                    hiddenCount = cached.hiddenCount,
                    candidateClusterCount = cached.candidateClusterCount,
                    invariantOk = cached.invariantOk,
                    invariantError = cached.invariantError,
                    source = cached.source,
                    isFallbackUsed = true,
                    fallbackReason = cached.fallbackReason ?: e.message,
                    watchlistPreview = cached.watchlistPreview,
                    rawPreview = cached.rawPreview,
                    noisePreview = cached.noisePreview
                )
            } else {
                _uiState.value = _uiState.value.copy(
                    isInitialLoading = false,
                    lastError = errorMsg
                )
            }
        } finally {
            _uiState.value = _uiState.value.copy(isRemoteLoading = false)
        }
    }

    fun refresh() {
        android.util.Log.d("NewsFlow", "refreshFeeds start: ${System.currentTimeMillis()}")
        viewModelScope.launch {
            _isRefreshing.value = true
            // İçeriği temizleme — rapid refresh sırasında gövde görünür kalmalı
            _uiState.value = _uiState.value.copy(lastError = null, isRemoteLoading = true)
            try {
                // Ensure default sources are seeded before refresh
                repository.seedDefaultSources()
                repository.refreshFeeds()
                android.util.Log.d("NewsFlow", "refreshFeeds end: ${System.currentTimeMillis()}")
                fetchCuratedFeed(_uiState.value.articles)
            } catch (e: Exception) {
                val errorMsg = mapErrorMessage(e)
                val cached = aiFeedRepository.getCachedFeed()
                if (cached != null) {
                    _uiState.value = _uiState.value.copy(
                        curatedItems = cached.items,
                        latestRssPreview = cached.latestRssPreview,
                        lastError = errorMsg,
                        isInitialLoading = false,
                        isRemoteLoading = false,
                        isShowingCachedData = true,
                        cacheAgeText = formatCacheAge(cached.generatedAt),
                        totalAnalyzed = cached.totalScanned,
                        publishedCount = cached.publishedCount,
                        hiddenCount = cached.hiddenCount,
                        watchlistPreview = cached.watchlistPreview,
                        rawPreview = cached.rawPreview
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        lastError = errorMsg,
                        isInitialLoading = false,
                        isRemoteLoading = false
                    )
                }
            } finally {
                _isRefreshing.value = false
            }
        }
    }

    private fun formatCacheAge(timestamp: Long): String {
        val diffMs = System.currentTimeMillis() - timestamp
        val diffMins = java.util.concurrent.TimeUnit.MILLISECONDS.toMinutes(diffMs)
        return when {
            diffMins < 1 -> "Az önce güncellendi"
            diffMins < 60 -> "$diffMins dakika önce güncellendi"
            else -> {
                val diffHours = java.util.concurrent.TimeUnit.MILLISECONDS.toHours(diffMs)
                if (diffHours < 24) {
                    "$diffHours saat önce güncellendi"
                } else {
                    val diffDays = java.util.concurrent.TimeUnit.MILLISECONDS.toDays(diffMs)
                    "$diffDays gün önce güncellendi"
                }
            }
        }
    }

    private fun mapErrorMessage(e: Throwable): String {
        val msg = e.message ?: ""
        return if (e is java.io.IOException || msg.contains("unexpected end of stream") || msg.contains("connect") || msg.contains("timeout")) {
            "Backend bağlantısı kesildi veya API yanıtı tamamlanamadı."
        } else {
            e.message ?: "Haberler yenilenirken bir hata oluştu"
        }
    }
}

