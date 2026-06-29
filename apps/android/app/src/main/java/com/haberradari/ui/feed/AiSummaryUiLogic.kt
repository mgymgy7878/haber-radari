package com.haberradari.ui.feed

/** TITLE_LINK_ONLY backend cleanup öncesi aiSummary null/boş güvenliği. */
object AiSummaryUiLogic {

    fun safeSummaryOrNull(raw: String?): String? =
        raw?.trim()?.takeIf { it.isNotEmpty() }

    /** Domain model için normalize — null/boş → "". */
    fun normalizeSummary(raw: String?): String = safeSummaryOrNull(raw) ?: ""

    fun shouldShowSummaryBody(raw: String?): Boolean = safeSummaryOrNull(raw) != null

    fun missingSummaryHint(): String = "Bu kaynak için özet gösterilmiyor."
}
