package com.haberradari.ui.feed

import com.haberradari.data.model.AiCuratedNewsItem
import com.haberradari.data.model.EvidenceStatus
import com.haberradari.data.model.Importance
import com.haberradari.data.model.PublishDecision
import com.haberradari.data.model.SmartDigest
import com.haberradari.data.model.SmartDigestStatus
import com.haberradari.data.model.SourceSignal
import com.haberradari.data.model.SourceSignalBand

/** v0.6.6 — güven, kaynak şeffaflığı ve digest durum etiketleri. */
object TrustTransparencyUiLogic {

    const val SOURCE_SIGNAL_DISCLAIMER =
        "Bu sinyal haberin doğruluğunu tek başına garanti etmez."

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
        "Tek kaynak / kaynak sinyali"

    /** API/mock gibi kaynaklardan gelen metinleri güvenli ürün diline çevirir (davranış değişmez). */
    fun sanitizeTrustDisplayText(text: String): String = text
        .replace(
            "Ana akışa alınma nedeni: Çok kaynaklı doğrulama",
            "Ana akışa alınma nedeni: Çok kaynaklı kaynak sinyali",
        )
        .replace("Çok kaynaklı doğrulama", "Çok kaynaklı kaynak sinyali")
        .replace(
            "Doğrulama bekleniyor (Tek kaynaklı)",
            "Ek kaynak sinyali bekleniyor (tek kaynaklı)",
        )
        .replace(
            "Kritik olay (tek kaynaklı): Doğrulama bekleniyor.",
            "Kritik olay (tek kaynaklı): Ek kaynak sinyali bekleniyor.",
        )
        .replace("Doğrulama bekleniyor", "Ek kaynak sinyali bekleniyor")
        .replace(Regex("(?i)kanıt:"), "Sinyal:")

    fun mapReasonCodeToSafeUiString(reasonCode: String?): String? {
        if (reasonCode == null) return null
        
        val code = reasonCode.substringAfterLast(": ").trim() // In case it's prefixed
        
        return when (code) {
            "SHOW_MONITORING_THRESHOLD", "SHOW_MONITORING_NOISE_DOWNGRADE" -> "Haber değeri orta seviyede; gelişen kayıt olarak izleniyor."
            "SHOW_MAIN_THRESHOLD", "SHOW_MAIN_HIGH_VALUE", "SHOW_MAIN_OFFICIAL_OVERRIDE", "SHOW_MAIN_OFFICIAL_CRITICAL", "SHOW_MAIN_PERSONALIZED" -> "Haber değeri yüksek olduğu için öncelikli akışa alındı."
            "HIDE_LOW_VALUE", "LOW_VALUE_THRESHOLD", "HIDE_LOW_VALUE_DUE_TO_NOISE" -> "Düşük haber değeri nedeniyle ana akıştan çıkarıldı."
            "HIDE_CLICKBAIT", "NOISE_CLICKBAIT_HARD_HIDE" -> "Clickbait riski nedeniyle ana akıştan çıkarıldı."
            "HIDE_LEGAL_BLOCKED", "LEGAL_BLOCKED_DISABLED", "LEGAL_BLOCKED_NEEDS_REVIEW", "LEGAL_BLOCKED_UNLICENSED_AGENCY" -> "Kaynak kullanım durumu uygun olmadığı için gösterilmedi."
            "OFFICIAL_PUBLIC_SOURCE_CRITICAL" -> "Resmi/kurumsal kaynak ve yüksek haber değeri sinyali."
            "SOURCE_PROFILE_ELIGIBLE_SINGLE_SOURCE" -> "Kaynak profili uygun; tek kaynaklı gelişen kayıt."
            "ECONOMY_MARKET_SIGNAL" -> "Ekonomi/piyasa etkisi nedeniyle öne çıkarıldı."
            "MULTI_SOURCE_SIGNAL" -> "Birden fazla kaynakta benzer kayıt var."
            "LOW_VALUE" -> "Düşük haber değeri nedeniyle izlemeye alındı."
            "CLICKBAIT_RISK" -> "Clickbait riski nedeniyle ana akıştan çıkarıldı."
            else -> "Kaynak sinyali ve haber değeri eşiklerine göre izlemeye alındı."
        }
    }

    data class WhyShownLine(val label: String, val value: String)

    fun whyShownLines(item: AiCuratedNewsItem): List<WhyShownLine> {
        val lines = mutableListOf<WhyShownLine>()
        lines += WhyShownLine("Yayın kararı", publishDecisionLabel(item.publishDecision))
        item.publishReason?.takeIf { it.isNotBlank() }?.let {
            lines += WhyShownLine("Neden", sanitizeTrustDisplayText(it))
        }
        lines += WhyShownLine("Önem", importanceLabel(item.importance))
        lines += WhyShownLine(
            "Kaynak kapsamı",
            CuratedSourceLabels.articleSourceSummary(item.sourceCount, item.uniqueSourceCount)
        )
        lines += WhyShownLine(
            "Kaynak sinyali",
            CuratedSourceLabels.evidenceSummary(item.evidenceStatus, item.uniqueSourceCount)
        )
        if (item.clusterReason.isNotBlank()) {
            lines += WhyShownLine("Küme notu", item.clusterReason)
        }
        item.warningLabel?.takeIf { it.isNotBlank() }?.let {
            lines += WhyShownLine("Uyarı", sanitizeTrustDisplayText(it))
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

    fun sourceSignalFeedChipLabel(signal: SourceSignal?): String? {
        if (signal == null) return null
        return "Kaynak sinyali: ${scoreBandShortLabel(signal.scoreBand)}"
    }

    fun scoreBandShortLabel(band: SourceSignalBand): String = when (band) {
        SourceSignalBand.HIGH -> "yüksek profil"
        SourceSignalBand.MEDIUM -> "orta profil"
        SourceSignalBand.LOW -> "düşük profil"
        SourceSignalBand.UNKNOWN -> "belirsiz profil"
    }

    fun sourceSignalWhyShownLines(signal: SourceSignal?): List<WhyShownLine> {
        if (signal == null) return emptyList()
        val lines = mutableListOf<WhyShownLine>()
        lines += WhyShownLine(signal.label, signal.tierLabel)
        lines += WhyShownLine("Sinyal bandı", scoreBandShortLabel(signal.scoreBand))
        signal.reasons.take(3).forEachIndexed { index, reason ->
            lines += WhyShownLine("Sinyal notu ${index + 1}", reason)
        }
        return lines
    }

    fun containsUnsafeSourceSignalLanguage(text: String): Boolean {
        val lower = text.lowercase()
        val banned = listOf(
            "kesin doğru",
            "güvenilir haber",
            "yalan haber",
            "yalan",
            "manipülasyon",
            "onaylandı",
            "kanıtlandı",
            "doğrulandı",
            "teyit edildi",
        )
        return banned.any { lower.contains(it) }
    }
}
