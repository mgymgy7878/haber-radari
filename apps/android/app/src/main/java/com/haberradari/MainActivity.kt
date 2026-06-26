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
import com.haberradari.ui.theme.HaberRadariTheme

/**
 * Ana Activity — Compose UI entry point.
 *
 * Haber kartına tıklandığında uygulama içi detay ekranı açılır.
 * "Orijinal haberi aç" denirse Chrome Custom Tab ile açar.
 */
class MainActivity : ComponentActivity() {

    private lateinit var viewModel: FeedViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as HaberRadariApp
        viewModel = FeedViewModel(app.repository)

        setContent {
            HaberRadariTheme {
                var selectedArticle by remember { mutableStateOf<Article?>(null) }

                BackHandler(enabled = selectedArticle != null) {
                    selectedArticle = null
                }

                Crossfade(targetState = selectedArticle, label = "ScreenTransition") { article ->
                    if (article == null) {
                        FeedScreen(
                            viewModel = viewModel,
                            onArticleClick = { 
                                android.util.Log.d("NewsFlow", "Card clicked, selecting article: ${it.title}")
                                selectedArticle = it 
                            }
                        )
                    } else {
                        ArticleDetailScreen(
                            article = article,
                            onBackClick = { selectedArticle = null },
                            onOpenOriginalClick = { 
                                android.util.Log.d("NewsFlow", "Opening original source for: ${it.title}")
                                openArticle(it) 
                            }
                        )
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
