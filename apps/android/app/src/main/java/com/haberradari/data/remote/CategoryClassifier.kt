package com.haberradari.data.remote

import com.haberradari.data.model.NewsCategory
import java.util.Locale

object CategoryClassifier {

    private val earthquakeKeywords = listOf(
        "deprem", "afad", "kandilli", "merkez üssü", "tsunami", "artçı"
    )

    private val weatherKeywords = listOf(
        "meteoroloji", "sağanak", "fırtına", "sarı kod", "turuncu kod", "kar yağışı"
    )

    /**
     * Basit kural tabanlı kategori sınıflandırıcı.
     */
    fun classify(title: String, description: String?): NewsCategory {
        val descStr = description ?: ""
        val text = "$title $descStr".lowercase(Locale("tr", "TR"))

        if (earthquakeKeywords.any { text.contains(it) }) {
            return NewsCategory.DISASTER_EARTHQUAKE
        }

        if (weatherKeywords.any { text.contains(it) }) {
            return NewsCategory.WEATHER_ALERT
        }

        return NewsCategory.GENERAL
    }
}