package com.haberradari.data.repository

import com.haberradari.data.remote.AiReaderApi
import com.haberradari.data.remote.dto.AiReaderSummaryDto
import com.haberradari.data.remote.dto.AiReaderSummaryRequestDto

interface AiReaderRepository {
    suspend fun getSummary(request: AiReaderSummaryRequestDto): Result<AiReaderSummaryDto>
}

class AiReaderRepositoryImpl(
    private val aiReaderApi: AiReaderApi
) : AiReaderRepository {
    override suspend fun getSummary(request: AiReaderSummaryRequestDto): Result<AiReaderSummaryDto> {
        // Here we could add caching or local database persistence for the summaries
        return aiReaderApi.generateSummary(request)
    }
}
