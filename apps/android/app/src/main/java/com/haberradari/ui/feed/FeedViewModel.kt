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

/**
 * Feed ekranı ViewModel.
 *
 * UiState sealed class ile Loading / Empty / Error / Success durumlarını yönetir.
 */
class FeedViewModel(
    private val repository: NewsRepository
) : ViewModel() {

    /** UI durumu */
    sealed class UiState {
        data object Loading : UiState()
        data object Empty : UiState()
        data class Error(val message: String) : UiState()
        data class Success(val articles: List<Article>) : UiState()
    }

    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    init {
        observeArticles()
        refresh()
    }

    /**
     * Room'daki makale değişikliklerini gözlemle.
     * Flow sayesinde yeni makale eklendiğinde UI otomatik güncellenir.
     */
    private fun observeArticles() {
        viewModelScope.launch {
            repository.getArticles()
                .catch { e ->
                    _uiState.value = UiState.Error(
                        e.message ?: "Haberler yüklenirken bir hata oluştu"
                    )
                }
                .collect { articles ->
                    _uiState.value = if (articles.isEmpty()) {
                        UiState.Empty
                    } else {
                        UiState.Success(articles)
                    }
                }
        }
    }

    /**
     * Manuel veya otomatik yenileme.
     * Pull-to-refresh ve ilk yükleme burayı çağırır.
     */
    fun refresh() {
        viewModelScope.launch {
            _isRefreshing.value = true
            try {
                repository.refreshFeeds()
            } catch (e: Exception) {
                // Flow observer zaten Error state'i yakalar
                // Burada sadece refreshing durumunu sıfırla
                if (_uiState.value !is UiState.Success) {
                    _uiState.value = UiState.Error(
                        e.message ?: "Haberler yenilenirken bir hata oluştu"
                    )
                }
            } finally {
                _isRefreshing.value = false
            }
        }
    }
}
