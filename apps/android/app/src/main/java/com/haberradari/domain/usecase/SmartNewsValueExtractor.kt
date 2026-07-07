package com.haberradari.domain.usecase

enum class KeyFactStatus {
    FOUND, MISSING
}

data class KeyFactResult(
    val status: KeyFactStatus,
    val whatHappened: String,
    val factLines: List<String>
)

object SmartNewsValueExtractor {

    // Regex for percentage: "yüzde 0,8", "%0.8", "% 5"
    private val percentRegex = Regex("(?i)(%\\s*\\d+(?:[.,]\\d+)?|yüzde\\s*\\d+(?:[.,]\\d+)?)")
    
    // Regex for points/level: "10.656 puandan", "10656 puan"
    private val pointsRegex = Regex("(?i)(\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d+)?)\\s*puan")
    
    // Regex for time: "TSİ 22.00", "saat 14:30"
    private val timeRegex = Regex("(?i)(?:TSİ\\s*)?(\\d{1,2}[:.]\\d{2})")

    fun extractKeyFacts(title: String, summary: String? = null): KeyFactResult {
        val textToSearch = "$title ${summary ?: ""}"
        val factLines = mutableListOf<String>()

        // 1. Check for percentages
        val percentMatch = percentRegex.find(textToSearch)
        if (percentMatch != null) {
            val value = percentMatch.groupValues[1]
            factLines.add("Oran/Değişim: $value")
        }

        // 2. Check for points
        val pointsMatch = pointsRegex.find(textToSearch)
        if (pointsMatch != null) {
            val value = pointsMatch.groupValues[1]
            factLines.add("Seviye: $value puan")
        }

        // 3. Check for time (TSİ)
        val timeMatch = timeRegex.find(textToSearch)
        if (timeMatch != null) {
            val value = timeMatch.groupValues[1]
            val prefix = if (textToSearch.contains("TSİ", ignoreCase = true)) "TSİ " else ""
            factLines.add("Zaman/Saat: $prefix$value")
        }

        val status = if (factLines.isNotEmpty()) KeyFactStatus.FOUND else KeyFactStatus.MISSING
        val whatHappened = title // We use title as a safe fallback for "Ne oldu?"

        return KeyFactResult(status, whatHappened, factLines)
    }
}
