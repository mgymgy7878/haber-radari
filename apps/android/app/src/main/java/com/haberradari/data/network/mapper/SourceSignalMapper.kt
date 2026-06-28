package com.haberradari.data.network.mapper

import com.haberradari.data.model.SourceSignal
import com.haberradari.data.model.SourceSignalBand
import com.haberradari.data.network.dto.SourceSignalDto

object SourceSignalMapper {
    fun fromDto(dto: SourceSignalDto?): SourceSignal? {
        if (dto == null) return null
        return SourceSignal(
            label = dto.label,
            tierLabel = dto.tierLabel,
            scoreBand = mapBand(dto.scoreBand),
            reasons = dto.reasons?.filter { it.isNotBlank() } ?: emptyList(),
            disclaimer = dto.disclaimer
        )
    }

    private fun mapBand(value: String): SourceSignalBand = try {
        SourceSignalBand.valueOf(value)
    } catch (_: Exception) {
        SourceSignalBand.UNKNOWN
    }
}
