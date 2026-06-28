package com.haberradari.data.network.mapper

import com.haberradari.data.model.SmartDigest
import com.haberradari.data.model.SmartDigestConfidence
import com.haberradari.data.model.SmartDigestModelProvider
import com.haberradari.data.model.SmartDigestStatus
import com.haberradari.data.network.dto.SmartDigestDto

object SmartDigestMapper {
    fun fromDto(dto: SmartDigestDto?): SmartDigest? {
        if (dto == null) return null
        val status = SmartDigestStatus.fromRaw(dto.status) ?: return null
        return SmartDigest(
            status = status,
            summary = dto.summary,
            keyPoints = dto.keyPoints?.filter { it.isNotBlank() } ?: emptyList(),
            whyItMatters = dto.whyItMatters,
            confidence = SmartDigestConfidence.fromRaw(dto.confidence) ?: SmartDigestConfidence.LOW,
            sourcePolicy = dto.sourcePolicy ?: "METADATA_ONLY",
            modelProvider = SmartDigestModelProvider.fromRaw(dto.modelProvider) ?: SmartDigestModelProvider.DISABLED,
            cacheKey = dto.cacheKey ?: "",
            generatedAt = dto.generatedAt,
            errorCode = dto.errorCode
        )
    }
}
