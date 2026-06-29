package com.haberradari.ui.feed

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.haberradari.data.model.SourceStats
import com.haberradari.data.repository.NewsRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class SourceManagementViewModel(
    private val repository: NewsRepository,
) : ViewModel() {

    val sourceStats: StateFlow<List<SourceStats>> = repository.getSourceStats()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList(),
        )

    val activeIngestCount: StateFlow<Int> = repository.getSourcesFlow()
        .map { sources -> SourceManagementUiLogic.countActiveIngestSources(sources) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0,
        )

    val totalSourceCount: StateFlow<Int> = repository.getSourcesFlow()
        .map { it.size }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0,
        )

    fun setSourceEnabled(sourceId: String, enabled: Boolean) {
        viewModelScope.launch {
            repository.setSourceEnabled(sourceId, enabled)
        }
    }
}
