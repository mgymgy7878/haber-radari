package com.haberradari.data.remote

import com.haberradari.data.model.Article
import com.haberradari.data.model.ArticleVisibility

/**
 * AI Reader + Human Value Filter v0
 * 
 * Bu sınıf haberleri yasal/güvenlik sınırları çerçevesinde değerlendirerek görünürlük (visibility)
 * politikasını belirler. Kalıcı silme yerine bastırma (suppress) ve öne çıkarma (boost) yapar.
 */
object HumanValueClassifier {

    fun determineVisibility(article: Article): ArticleVisibilityResult {
        val title = article.title.lowercase()
        val desc = article.description?.lowercase() ?: ""
        val textToAnalyze = "$title $desc"

        // 1. Kaza/Cinayet/Trajedi Kontrolü
        val isTragedy = TragedyCrimeFilter.isTragedyOrCrime(textToAnalyze)
        
        // 2. Kamu Yararı (Public Interest) İstisnası
        val hasPublicInterest = PublicInterestExceptionClassifier.hasPublicInterest(textToAnalyze)

        // 3. Pozitif / İlham Verici Haber Kontrolü
        val isPositive = PositiveNewsBooster.isPositiveNews(textToAnalyze)

        // 4. Clickbait Kontrolü
        val isClickbait = ClickbaitFilter.isClickbait(article.title)

        // Karar Ağacı
        if (isTragedy && !hasPublicInterest) {
            return ArticleVisibilityResult(
                visibility = ArticleVisibility.SUPPRESSED,
                visibilityReason = "Tragedy/Crime filter (No public interest exception)"
            )
        }

        if (isClickbait) {
            return ArticleVisibilityResult(
                visibility = ArticleVisibility.SUPPRESSED,
                visibilityReason = "Clickbait filter"
            )
        }

        if (isPositive) {
            return ArticleVisibilityResult(
                visibility = ArticleVisibility.BOOSTED,
                visibilityReason = "Positive/Inspirational news booster"
            )
        }

        if (isTragedy && hasPublicInterest) {
            return ArticleVisibilityResult(
                visibility = ArticleVisibility.VISIBLE, // veya NEEDS_REVIEW
                visibilityReason = "Tragedy/Crime filter overridden by Public Interest exception"
            )
        }

        return ArticleVisibilityResult(
            visibility = ArticleVisibility.VISIBLE,
            visibilityReason = "Default visibility"
        )
    }
}

data class ArticleVisibilityResult(
    val visibility: ArticleVisibility,
    val visibilityReason: String
)

object TragedyCrimeFilter {
    private val tragedyKeywords = listOf(
        "kaza", "cinayet", "ölüm", "kavga", "saldırı", "taciz", "şiddet", "dehşet", "kan donduran", "intihar"
    )

    fun isTragedyOrCrime(text: String): Boolean {
        return tragedyKeywords.any { text.contains(it) }
    }
}

object PublicInterestExceptionClassifier {
    private val publicInterestKeywords = listOf(
        "bakan", "cumhurbaşkanı", "belediye başkanı", "valilik", "tbmm", 
        "mahkeme", "yasa", "karar", "afet", "deprem", "ulaşım", "ekonomi", 
        "kamu düzeni", "polis", "güvenlik", "tski"
    )

    fun hasPublicInterest(text: String): Boolean {
        return publicInterestKeywords.any { text.contains(it) }
    }
}

object PositiveNewsBooster {
    private val positiveKeywords = listOf(
        "bilim", "teknoloji", "tedavi", "başarı", "ödül", "ilham verici",
        "keşif", "burs", "eğitim", "doğa", "çevre", "fırsat", "girişim", "şampiyon"
    )

    fun isPositiveNews(text: String): Boolean {
        return positiveKeywords.any { text.contains(it) }
    }
}

/**
 * AI Reader için Contract / TODO.
 * Production API entegrasyonu bu PR kapsamında yapılmayacak.
 */
interface AiSummaryService {
    suspend fun generateSummary(url: String, title: String): AiSummaryResult
}

data class AiSummaryResult(
    val shortAiSummary: String,
    val detailedAiSummary: String,
    val whyItMatters: String,
    val publicInterestReason: String,
    val emotionalTone: String
)
