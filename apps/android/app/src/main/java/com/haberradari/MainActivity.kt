package com.haberradari

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.animation.Crossfade
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.haberradari.data.model.Article
import com.haberradari.data.model.AiCuratedNewsItem
import com.haberradari.ui.feed.ArticleDetailScreen
import com.haberradari.ui.feed.AiCuratedDetailScreen
import com.haberradari.ui.feed.FeedScreen
import com.haberradari.ui.feed.FeedViewModel
import com.haberradari.ui.feed.SourceManagementScreen
import com.haberradari.ui.feed.SourceManagementViewModel
import com.haberradari.ui.feed.DiagnosticsViewModel
import com.haberradari.config.FeatureConfig
import com.haberradari.domain.repository.MockAiCuratedFeedRepository
import com.haberradari.domain.repository.RemoteAiCuratedFeedRepository
import com.haberradari.ui.feed.ArticleDetailViewModel
import com.haberradari.ui.theme.HaberRadariTheme

sealed class Screen {
    object Feed : Screen()
    data class Detail(val article: Article) : Screen()
    data class CuratedDetail(val item: AiCuratedNewsItem) : Screen()
    object Health : Screen()
    object Diagnostics : Screen()
}

/**
 * Ana Activity — Compose UI entry point.
 *
 * Haber kartına tıklandığında uygulama içi detay ekranı açılır.
 * "Orijinal haberi aç" denirse Chrome Custom Tab ile açar.
 */
class MainActivity : ComponentActivity() {

    private lateinit var feedViewModel: FeedViewModel
    private lateinit var sourceManagementViewModel: SourceManagementViewModel
    private lateinit var diagnosticsViewModel: DiagnosticsViewModel
    private lateinit var articleDetailViewModel: ArticleDetailViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        android.util.Log.d("NewsFlow", "MainActivity onCreate started: ${System.currentTimeMillis()}")
        enableEdgeToEdge()

        val app = application as HaberRadariApp
        val aiRepo = if (FeatureConfig.aiRemoteFeedEnabled) {
            val remoteRepo = RemoteAiCuratedFeedRepository(applicationContext.cacheDir)
            val mockRepo = MockAiCuratedFeedRepository()
            
            object : com.haberradari.domain.repository.AiCuratedFeedRepository {
                override suspend fun getCuratedFeed(
                    localArticlesFallback: List<Article>?,
                    forceRefresh: Boolean
                ): com.haberradari.domain.repository.AiCuratedFeedResult {
                    return try {
                        remoteRepo.getCuratedFeed(localArticlesFallback, forceRefresh)
                    } catch (e: Exception) {
                        android.util.Log.e("NewsFlow", "Remote Feed failed, falling back to mock: ${e.message}")
                        if (FeatureConfig.aiRemoteFallbackToMockEnabled) {
                            mockRepo.getCuratedFeed(localArticlesFallback).copy(
                                source = com.haberradari.domain.repository.FeedSource.FALLBACK_MOCK,
                                isFallbackUsed = true,
                                fallbackReason = e.message ?: "Bilinmeyen Hata"
                            )
                        } else {
                            throw e
                        }
                    }
                }

                override suspend fun getCachedFeed(): com.haberradari.domain.repository.AiCuratedFeedResult? {
                    return remoteRepo.getCachedFeed()
                }
            }
        } else {
            MockAiCuratedFeedRepository()
        }
        feedViewModel = FeedViewModel(app.repository, aiRepo)
        sourceManagementViewModel = SourceManagementViewModel(app.repository)
        diagnosticsViewModel = DiagnosticsViewModel(app.repository, aiRepo)
        articleDetailViewModel = ArticleDetailViewModel(app.aiReaderRepository)

        setContent {
            HaberRadariTheme {
                var currentScreen by remember { mutableStateOf<Screen>(Screen.Feed) }

                BackHandler(enabled = currentScreen != Screen.Feed) {
                    currentScreen = Screen.Feed
                }

                Crossfade(targetState = currentScreen, label = "ScreenTransition") { screen ->
                    when (screen) {
                        is Screen.Feed -> {
                            FeedScreen(
                                viewModel = feedViewModel,
                                onOpenDetail = { 
                                    android.util.Log.d("NewsFlow", "Card clicked, selecting article: ${it.title}")
                                    currentScreen = Screen.Detail(it) 
                                },
                                onOpenCuratedDetail = {
                                    android.util.Log.d(
                                        "NewsFlow",
                                        "Curated detail id=${it.id} articles=${it.sourceCount} unique=${it.uniqueSourceCount} lead=${it.aiTitle}"
                                    )
                                    currentScreen = Screen.CuratedDetail(it)
                                },
                                onOpenHealth = {
                                    currentScreen = Screen.Health
                                },
                                onOpenDiagnostics = {
                                    currentScreen = Screen.Diagnostics
                                }
                            )
                        }
                        is Screen.Detail -> {
                            ArticleDetailScreen(
                                article = screen.article,
                                viewModel = articleDetailViewModel,
                                onBackClick = { currentScreen = Screen.Feed },
                                onOpenOriginal = { 
                                    android.util.Log.d("NewsFlow", "Opening original source for: ${it.title}")
                                    openArticleUrl(it.originalUrl) 
                                }
                            )
                        }
                        is Screen.CuratedDetail -> {
                            AiCuratedDetailScreen(
                                item = screen.item,
                                onBack = { currentScreen = Screen.Feed },
                                onOpenSource = { url ->
                                    android.util.Log.d("NewsFlow", "Opening original source from curated list: $url")
                                    openArticleUrl(url)
                                }
                            )
                        }
                        is Screen.Health -> {
                            SourceManagementScreen(
                                viewModel = sourceManagementViewModel,
                                onBackClick = { currentScreen = Screen.Feed },
                            )
                        }
                        is Screen.Diagnostics -> {
                            com.haberradari.ui.feed.DiagnosticsScreen(
                                viewModel = diagnosticsViewModel,
                                onBackClick = { currentScreen = Screen.Feed }
                            )
                        }
                    }
                }
            }
        }
    }

    /**
     * Orijinal haberi Chrome Custom Tab ile aç.
     * Custom Tab desteklenmiyorsa standart tarayıcı açılır.
     */
    private fun openArticleUrl(url: String) {
        try {
            val customTabsIntent = CustomTabsIntent.Builder()
                .setShowTitle(true)
                .build()
            customTabsIntent.launchUrl(this, Uri.parse(url))
        } catch (_: Exception) {
            // Custom Tab başarısızsa standart intent ile aç
            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            startActivity(browserIntent)
        }
    }
}
