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
import com.haberradari.ui.feed.ArticleDetailScreen
import com.haberradari.ui.feed.FeedScreen
import com.haberradari.ui.feed.FeedViewModel
import com.haberradari.ui.feed.SourceHealthScreen
import com.haberradari.ui.feed.SourceHealthViewModel
import com.haberradari.ui.theme.HaberRadariTheme

sealed class Screen {
    object Feed : Screen()
    data class Detail(val article: Article) : Screen()
    object Health : Screen()
}

/**
 * Ana Activity — Compose UI entry point.
 *
 * Haber kartına tıklandığında uygulama içi detay ekranı açılır.
 * "Orijinal haberi aç" denirse Chrome Custom Tab ile açar.
 */
class MainActivity : ComponentActivity() {

    private lateinit var feedViewModel: FeedViewModel
    private lateinit var healthViewModel: SourceHealthViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        android.util.Log.d("NewsFlow", "MainActivity onCreate started: ${System.currentTimeMillis()}")
        enableEdgeToEdge()

        val app = application as HaberRadariApp
        feedViewModel = FeedViewModel(app.repository)
        healthViewModel = SourceHealthViewModel(app.repository)

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
                                onOpenHealth = {
                                    currentScreen = Screen.Health
                                }
                            )
                        }
                        is Screen.Detail -> {
                            ArticleDetailScreen(
                                article = screen.article,
                                onBackClick = { currentScreen = Screen.Feed },
                                onOpenOriginal = { 
                                    android.util.Log.d("NewsFlow", "Opening original source for: ${it.title}")
                                    openArticle(it) 
                                }
                            )
                        }
                        is Screen.Health -> {
                            SourceHealthScreen(
                                viewModel = healthViewModel,
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
    private fun openArticle(article: Article) {
        try {
            val customTabsIntent = CustomTabsIntent.Builder()
                .setShowTitle(true)
                .build()
            customTabsIntent.launchUrl(this, Uri.parse(article.originalUrl))
        } catch (_: Exception) {
            // Custom Tab başarısızsa standart intent ile aç
            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(article.originalUrl))
            startActivity(browserIntent)
        }
    }
}
