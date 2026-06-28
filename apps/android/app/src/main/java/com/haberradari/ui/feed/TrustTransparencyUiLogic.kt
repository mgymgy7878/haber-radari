package com.haberradari.ui.feed

import com.haberradari.data.model.AiCuratedNewsItem
import com.haberradari.data.model.EvidenceStatus
import com.haberradari.data.model.Importance
import com.haberradari.data.model.PublishDecision
import com.haberradari.data.model.SmartDigest
import com.haberradari.data.model.SmartDigestStatus

/** v0.6.6 — güven, kaynak şeffaflığı ve digest durum etiketleri. */
object TrustTransparencyUiLogic {

    fun shouldShowSmartDigestBlock(publishDecision: PublishDecision): Boolean =
        publishDecision == PublishDecision.PUBLISH_MAIN

    fun digestStatusChipLabel(digest: SmartDigest?): String = when (digest?.status) {
        null -> "AI özeti: kapalı"
        SmartDigestStatus.DISABLED -> "AI özeti: kapalı"
        SmartDigestStatus.MOCKED -> "AI özeti: test"
        SmartDigestStatus.CACHED -> "AI özeti: önbellekten"
        SmartDigestStatus.GENERATED -> "AI özeti"
        SmartDigestStatus.FAILED -> "AI özeti: alınamadı"
    }

    fun digestStatusShortNote(digest: SmartDigest?): String? = when (digest?.status) {
        SmartDigestStatus.FAILED -> "Özet şu an üretilemedi; haber kartı ve kaynaklar görüntülenmeye devam eder."
        SmartDigestStatus.DISABLED -> "AI özeti bu yapılandırmada kapalı."
        else -> null
    }

    /** FAILED digest feed kartını gizlemez. */
    fun feedCardRemainsVisibleOnDigestFailure(): Boolean = true

    fun shouldShowSingleSourceWarning(uniqueSourceCount: Int, evidenceStatus: EvidenceStatus): Boolean =
        uniqueSourceCount <= 1 || evidenceStatus == EvidenceStatus.SINGLE_SOURCE

    fun singleSourceWarningText(): String =
        "Tek kaynak — çoklu doğrulama yok; orijinal haberi kontrol edin."

    data class WhyShownLine(val label: String, val value: String)

    fun whyShownLines(item: AiCuratedNewsItem): List<WhyShownLine> {
        val lines = mutableListOf<WhyShownLine>()
        lines += WhyShownLine("Yayın kararı", publishDecisionLabel(item.publishDecision))
        item.publishReason?.takeIf { it.isNotBlank() }?.let {
            lines += WhyShownLine("Neden", it)
        }
        lines += WhyShownLine("Önem", importanceLabel(item.importance))
        lines += WhyShownLine(
            "Kaynak kapsamı",
            CuratedSourceLabels.articleSourceSummary(item.sourceCount, item.uniqueSourceCount)
        )
        lines += WhyShownLine(
            "Kanıt durumu",
            CuratedSourceLabels.evidenceSummary(item.evidenceStatus, item.uniqueSourceCount)
        )
        if (item.clusterReason.isNotBlank()) {
            lines += WhyShownLine("Küme notu", item.clusterReason)
        }
        item.warningLabel?.takeIf { it.isNotBlank() }?.let {
            lines += WhyShownLine("Uyarı", it)
        }
        return lines
    }

    fun publishDecisionLabel(decision: PublishDecision): String = when (decision) {
        PublishDecision.PUBLISH_MAIN -> "Ana akış"
        PublishDecision.WATCHLIST_ONLY -> "İzleme listesi"
        PublishDecision.FILTERED_OUT -> "Filtrelendi"
        PublishDecision.RAW_ONLY -> "Ham önizleme"
    }

    fun importanceLabel(importance: Importance): String = when (importance) {
        Importance.HIGH -> "Yüksek"
        Importance.MEDIUM -> "Orta"
        Importance.LOW -> "Düşük"
    }
}
