package com.haberradari.ui.feed

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.haberradari.data.model.SourceStats
import com.haberradari.data.repository.NewsRepository
import com.haberradari.domain.repository.AiCuratedFeedRepository
import com.haberradari.domain.repository.WatchlistPreviewItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DiagnosticsUiState(
    val sourceStats: List<SourceStats> = emptyList(),
    val totalSources: Int = 0,
    val activeSources: Int = 0,
    val disabledSources: Int = 0,
    val needsReviewSources: Int = 0,
    val lastRefreshAt: Long? = null,
    val isCache: Boolean = false,
    val recentDecisions: List<WatchlistPreviewItem> = emptyList(),
    val isLoading: Boolean = false
)

class DiagnosticsViewModel(
    private val newsRepository: NewsRepository,
    private val aiFeedRepository: AiCuratedFeedRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DiagnosticsUiState())
    val uiState: StateFlow<DiagnosticsUiState> = _uiState.asStateFlow()

    init {
        observeSourceStats()
        loadRecentDecisions()
    }

    private fun observeSourceStats() {
        viewModelScope.launch {
            newsRepository.getSourceStats().collect { stats ->
                val total = stats.size
                val active = stats.count { it.source.enabled && !it.source.legalMode.blocksProductionIngest() }
                val disabled = stats.count { !it.source.enabled }
                val needsReview = stats.count { it.source.legalMode.blocksProductionIngest() }
                
                _uiState.value = _uiState.value.copy(
                    sourceStats = stats,
                    totalSources = total,
                    activeSources = active,
                    disabledSources = disabled,
                    needsReviewSources = needsReview
                )
            }
        }
    }

    private fun loadRecentDecisions() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                val cached = aiFeedRepository.getCachedFeed()
                if (cached != null) {
                    val allDecisions = (cached.watchlistPreview.orEmpty() + 
                                       cached.rawPreview.orEmpty() + 
                                       cached.noisePreview.orEmpty())
                        .distinctBy { it.id }
                        .sortedByDescending { it.publishedAt }
                    
                    _uiState.value = _uiState.value.copy(
                        recentDecisions = allDecisions,
                        lastRefreshAt = cached.generatedAt,
                        isCache = true,
                        isLoading = false
                    )
                } else {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }
}
