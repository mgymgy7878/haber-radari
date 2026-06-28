package com.haberradari.data.model

/** v0.6.7 — UI-safe kaynak sinyali; mutlak doğruluk iddiası değildir. */
enum class SourceSignalBand {
    HIGH,
    MEDIUM,
    LOW,
    UNKNOWN
}

data class SourceSignal(
    val label: String,
    val tierLabel: String,
    val scoreBand: SourceSignalBand,
    val reasons: List<String>,
    val disclaimer: String
)
