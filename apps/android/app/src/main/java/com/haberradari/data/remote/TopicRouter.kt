package com.haberradari.data.remote

import com.haberradari.data.model.Article
import com.haberradari.data.model.NewsCategory
import com.haberradari.data.model.Source
import com.haberradari.data.model.SourceAuthority

object TopicRouter {

    fun shouldShowArticle(article: Article, source: Source?): Boolean {
        val authority = source?.authorityLevel ?: SourceAuthority.GENERAL_MEDIA
        val category = CategoryClassifier.classify(article.title, article.description)

        // Routing Rule 1: Earthquake & Weather
        if (category == NewsCategory.DISASTER_EARTHQUAKE || category == NewsCategory.WEATHER_ALERT) {
            if (authority == SourceAuthority.GENERAL_MEDIA) {
                val isClickbait = ClickbaitFilter.isClickbait(article.title)
                // If it is clickbait on a disaster/weather topic by GENERAL_MEDIA, hide it completely.
                if (isClickbait) {
                    return false
                }
                // Else it's valid information, keep it
                return true
            }
            // If it's an OFFICIAL source, always keep it.
            return true
        }

        // For GENERAL category: standard clickbait filter applies
        return !ClickbaitFilter.isClickbait(article.title)
    }
}