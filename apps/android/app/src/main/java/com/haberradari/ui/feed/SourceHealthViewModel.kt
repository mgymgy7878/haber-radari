package com.haberradari.ui.feed

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.haberradari.data.model.SourceStats
import com.haberradari.data.repository.NewsRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn

class SourceHealthViewModel(
    private val repository: NewsRepository
) : ViewModel() {

    val sourceStats: StateFlow<List<SourceStats>> = repository.getSourceStats()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )
}
