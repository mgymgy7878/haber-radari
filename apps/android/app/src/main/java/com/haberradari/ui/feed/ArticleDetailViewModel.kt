package com.haberradari.ui.feed

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.haberradari.data.model.Article
import com.haberradari.data.remote.dto.AiReaderSummaryDto
import com.haberradari.data.remote.dto.AiReaderSummaryRequestDto
import com.haberradari.data.repository.AiReaderRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface AiSummaryState {
    object Idle : AiSummaryState
    object Loading : AiSummaryState
    data class Success(val summary: AiReaderSummaryDto) : AiSummaryState
    data class Error(val message: String) : AiSummaryState
}

class ArticleDetailViewModel(
    private val aiReaderRepository: AiReaderRepository
) : ViewModel() {

    private val _summaryState = MutableStateFlow<AiSummaryState>(AiSummaryState.Idle)
    val summaryState: StateFlow<AiSummaryState> = _summaryState.asStateFlow()

    fun getSummary(article: Article) {
        if (_summaryState.value is AiSummaryState.Loading) return
        
        _summaryState.value = AiSummaryState.Loading

        viewModelScope.launch {
            val request = AiReaderSummaryRequestDto(
                articleId = article.id,
                sourceUrl = article.originalUrl,
                sourceName = article.sourceName,
                title = article.title,
                description = article.description
            )
            val result = aiReaderRepository.getSummary(request)
            result.fold(
                onSuccess = {
                    _summaryState.value = AiSummaryState.Success(it)
                },
                onFailure = { error ->
                    _summaryState.value = AiSummaryState.Error(error.message ?: "Özet alınırken bir hata oluştu.")
                }
            )
        }
    }
}
