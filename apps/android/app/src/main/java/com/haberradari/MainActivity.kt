package com.haberradari

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.browser.customtabs.CustomTabsIntent
import com.haberradari.data.model.Article
import com.haberradari.ui.feed.FeedScreen
import com.haberradari.ui.feed.FeedViewModel
import com.haberradari.ui.theme.HaberRadariTheme

/**
 * Ana Activity — Compose UI entry point.
 *
 * Haber kartına tıklandığında orijinal haberi
 * Chrome Custom Tab ile açar (uygulama içi tarayıcı).
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
                FeedScreen(
                    viewModel = viewModel,
                    onArticleClick = { article -> openArticle(article) }
                )
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
