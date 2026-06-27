package com.haberradari.data.remote.dto

data class AiReaderSummaryRequestDto(
    val articleId: String,
    val sourceUrl: String,
    val sourceName: String,
    val title: String,
    val description: String? = null
)
