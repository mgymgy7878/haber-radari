package com.haberradari.data.remote

object ClickbaitFilter {
    private val clickbaitPattern = Regex(
        "(?i)(?:^|\\s)(mi oldu|aciklandi mi|belli oldu mu|ne zaman|saat kacta|hangi kanalda|kimdir|ne kadar|neden oldu|ne oldu|neden ayrildi|nerede deprem oldu)(?:\\s|\\?|$)|" +
        "(?i)(?:^|\\s)(soke eden|sasirtti|oyle bir sey dedi ki|gorenleri|inanamayacaksiniz)(?:\\s|$|\\p{Punct})|" +
        "(?i)^[\\s\\S]{0,40}\\?$"
    )

    fun isClickbait(title: String): Boolean {
        if (title.isBlank()) return false
        
        // Normalize Turkish characters for regex matching to avoid encoding issues
        val normalizedTitle = title
            .replace("ç", "c").replace("Ç", "c")
            .replace("ğ", "g").replace("Ğ", "g")
            .replace("ı", "i").replace("İ", "i")
            .replace("ö", "o").replace("Ö", "o")
            .replace("ş", "s").replace("Ş", "s")
            .replace("ü", "u").replace("Ü", "u")
            
        return clickbaitPattern.containsMatchIn(normalizedTitle)
    }
}