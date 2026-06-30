package com.haberradari.domain.policy

import java.util.Locale

/**
 * Deprem haberleri ana akış eşiği — yalnızca izinli metadata (title/category/source) kullanılır.
 * Body/html/description parse edilmez.
 */
object EarthquakeMagnitudePolicy {

    const val EARTHQUAKE_MAIN_FEED_MIN_MAGNITUDE = 5.0

    const val REASON_MAGNITUDE_BELOW_THRESHOLD = "EARTHQUAKE_MAGNITUDE_BELOW_THRESHOLD"
    const val REASON_MAGNITUDE_UNKNOWN = "EARTHQUAKE_MAGNITUDE_UNKNOWN"
    const val REASON_PUBLIC_SAFETY_EXCEPTION = "PUBLIC_SAFETY_EXCEPTION"

    private val earthquakeSignals = listOf(
        "deprem",
        "earthquake",
        "quake",
        "usgs",
        "afad",
        "emsc",
        "kandilli",
        "sarsıntı",
        "sarsinti",
        "merkez üssü",
        "merkez ussu",
        "aftershock",
        "artçı",
        "artci",
    )

    private val earthquakeCategories = setOf(
        "afet",
        "disaster_earthquake",
        "disaster",
        "earthquake",
    )

    private val usStyleMagnitude = Regex(
        """\b[mM][wWbB]?\s*(\d+(?:\.\d+)?)""",
    )
    private val magnitudeKeyword = Regex(
        """(?i)magnitude\s+(\d+(?:\.\d+)?)""",
    )
    private val turkishBuyukluk = Regex(
        """(\d+(?:\.\d+)?)\s*büyüklüğünde""",
        RegexOption.IGNORE_CASE,
    )
    private val turkishBuyuklukShort = Regex(
        """(\d+(?:\.\d+)?)\s*büyüklük""",
        RegexOption.IGNORE_CASE,
    )

    sealed class MainFeedEligibility {
        data object Eligible : MainFeedEligibility()
        data class WatchlistOnly(val reasonCode: String) : MainFeedEligibility()
    }

    fun isEarthquakeSignal(
        title: String,
        category: String? = null,
        sourceNames: List<String> = emptyList(),
    ): Boolean {
        val normalizedCategory = category?.trim()?.lowercase(Locale.ROOT).orEmpty()
        if (normalizedCategory in earthquakeCategories) return true

        val haystack = buildString {
            append(title.lowercase(Locale("tr", "TR")))
            if (normalizedCategory.isNotEmpty()) {
                append(' ')
                append(normalizedCategory)
            }
            sourceNames.forEach { name ->
                append(' ')
                append(name.lowercase(Locale("tr", "TR")))
            }
        }
        return earthquakeSignals.any { haystack.contains(it) }
    }

    /**
     * Magnitude yalnızca [title] üzerinden parse edilir — description/body kullanılmaz.
     */
    fun parseMagnitude(title: String): Double? {
        val normalized = title.replace(',', '.')
        usStyleMagnitude.find(normalized)?.groupValues?.getOrNull(1)?.toDoubleOrNull()?.let { return it }
        magnitudeKeyword.find(normalized)?.groupValues?.getOrNull(1)?.toDoubleOrNull()?.let { return it }
        turkishBuyukluk.find(normalized)?.groupValues?.getOrNull(1)?.toDoubleOrNull()?.let { return it }
        turkishBuyuklukShort.find(normalized)?.groupValues?.getOrNull(1)?.toDoubleOrNull()?.let { return it }
        return null
    }

    fun evaluateMainFeedEligibility(
        title: String,
        category: String? = null,
        sourceNames: List<String> = emptyList(),
        existingReasonCode: String? = null,
    ): MainFeedEligibility {
        if (existingReasonCode == REASON_PUBLIC_SAFETY_EXCEPTION) {
            return MainFeedEligibility.Eligible
        }
        if (!isEarthquakeSignal(title, category, sourceNames)) {
            return MainFeedEligibility.Eligible
        }
        val magnitude = parseMagnitude(title)
            ?: return MainFeedEligibility.WatchlistOnly(REASON_MAGNITUDE_UNKNOWN)
        return if (magnitude >= EARTHQUAKE_MAIN_FEED_MIN_MAGNITUDE) {
            MainFeedEligibility.Eligible
        } else {
            MainFeedEligibility.WatchlistOnly(REASON_MAGNITUDE_BELOW_THRESHOLD)
        }
    }

    fun isMainFeedEligible(
        title: String,
        category: String? = null,
        sourceNames: List<String> = emptyList(),
        existingReasonCode: String? = null,
    ): Boolean = evaluateMainFeedEligibility(title, category, sourceNames, existingReasonCode) is MainFeedEligibility.Eligible
}
