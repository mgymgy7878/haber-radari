package com.haberradari.ui.feed

import com.haberradari.data.model.AiCuratedNewsItem
import com.haberradari.data.model.EvidenceStatus

object CuratedSourceLabels {
    fun articleSourceSummary(articleCount: Int, uniqueSourceCount: Int): String {
        return when {
            articleCount <= 0 -> "Kaynak yok"
            articleCount == uniqueSourceCount -> "$articleCount kaynak"
            else -> "$articleCount haber · $uniqueSourceCount benzersiz kaynak"
        }
    }

    fun evidenceSummary(evidenceStatus: EvidenceStatus, uniqueSourceCount: Int): String {
        val base = when (evidenceStatus) {
            EvidenceStatus.CONFIRMED ->
                if (uniqueSourceCount >= 2) "Sinyal: çoklu kaynak" else "Kaynak sinyali güçlü"
            EvidenceStatus.PARTIAL -> "Sinyal: kısmi kaynak profili"
            EvidenceStatus.SINGLE_SOURCE -> "Sinyal: tek kaynak"
            EvidenceStatus.LOW_CONFIDENCE -> "Sinyal: düşük profil"
            EvidenceStatus.FILTERED -> "Sinyal: filtrelendi"
        }
        return if (evidenceStatus == EvidenceStatus.SINGLE_SOURCE && uniqueSourceCount == 1) {
            "$base (aynı kaynaktan birden fazla haber olabilir)"
        } else {
            base
        }
    }

    fun detailSourcesHeading(articleCount: Int): String = "Kaynak haberler ($articleCount)"

    fun detailUniqueSourceLine(uniqueSourceCount: Int): String = "Benzersiz kaynak: $uniqueSourceCount"
}

object CuratedItemIntegrity {
    /** Detail ekranına giden item'ın kaynakları yalnızca kendi cluster'ından gelmeli. */
    fun sourcesBelongToItem(item: AiCuratedNewsItem): Boolean {
        if (item.sources.isEmpty()) return true
        return item.sources.all { source ->
            source.originalTitle.isNotBlank() && source.url.isNotBlank()
        }
    }

    fun detailTitleMatchesLeadSource(item: AiCuratedNewsItem): Boolean {
        val lead = item.sources.firstOrNull() ?: return true
        return item.aiTitle == lead.originalTitle
    }
}
