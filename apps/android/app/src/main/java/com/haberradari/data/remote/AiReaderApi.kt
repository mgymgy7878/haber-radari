package com.haberradari.data.remote

import com.haberradari.data.remote.dto.AiReaderSummaryDto
import com.haberradari.data.remote.dto.AiReaderSummaryRequestDto

interface AiReaderApi {
    suspend fun generateSummary(request: AiReaderSummaryRequestDto): Result<AiReaderSummaryDto>
}
