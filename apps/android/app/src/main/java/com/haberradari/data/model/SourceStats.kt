package com.haberradari.data.model

data class SourceArticleCount(
    val sourceId: String,
    val count: Int
)

data class SourceStats(
    val source: Source,
    val health: FeedHealth?,
    val articleCount: Int
)
