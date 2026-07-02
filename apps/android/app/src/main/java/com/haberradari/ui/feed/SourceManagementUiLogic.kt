package com.haberradari.ui.feed

import com.haberradari.data.model.FeedHealth
import com.haberradari.data.model.LegalMode
import com.haberradari.data.model.Source
import com.haberradari.data.model.SourceStats
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Kaynak Yönetimi v0 — legalMode etiketleri, sağlık detayları ve güvenli toggle kuralları.
 */
object SourceManagementUiLogic {

    const val SOURCE_HEALTH_DISCLAIMER =
        "Kaynak sağlığı haberin doğruluğunu tek başına garanti etmez."

    private const val MAX_ERROR_SUMMARY_LENGTH = 120

    private val displayDateFormat = SimpleDateFormat("dd MMM yyyy HH:mm", Locale("tr", "TR"))

    data class SourceHealthDetails(
        val statusMessage: String,
        val whyNotInFeed: String?,
        val lastSuccessLabel: String?,
        val lastErrorLabel: String?,
        val lastErrorSummary: String?,
        val consecutiveFailuresLabel: String?,
        val articleCountLabel: String,
    )

    /** Kullanıcı enabled switch — DISABLED/NEEDS_REVIEW hariç. */
    fun isUserToggleAllowed(legalMode: LegalMode): Boolean =
        !legalMode.blocksProductionIngest()

    fun countActiveIngestSources(sources: List<Source>): Int =
        sources.count { it.enabled && !it.legalMode.blocksProductionIngest() }

    fun legalModeShortLabel(legalMode: LegalMode): String = when (legalMode) {
        LegalMode.TITLE_LINK_ONLY -> "Başlık + link"
        LegalMode.RSS_METADATA_ONLY -> "Metadata"
        LegalMode.LICENSED -> "Lisanslı"
        LegalMode.NEEDS_REVIEW -> "İnceleme bekliyor"
        LegalMode.DISABLED -> "Kapalı"
    }

    fun legalModeDescription(legalMode: LegalMode): String = when (legalMode) {
        LegalMode.TITLE_LINK_ONLY ->
            "Başlık + orijinal link modu. Kısa açıklama saklanmaz."
        LegalMode.RSS_METADATA_ONLY ->
            "RSS metadata modu: başlık, RSS metadata, link ve kaynak bilgisi."
        LegalMode.LICENSED ->
            "Lisanslı kaynak profili. Tam metin saklanmaz."
        LegalMode.NEEDS_REVIEW ->
            "İnceleme bekliyor; üretim akışına alınmaz."
        LegalMode.DISABLED ->
            "Kapalı; lisans/uygunluk olmadan kullanılmaz."
    }

    fun sourceProfileHint(source: Source): String = when (source.legalMode) {
        LegalMode.TITLE_LINK_ONLY ->
            "Kaynak profili: dar mod — başlık ve orijinal kaynağa yönlendirme."
        LegalMode.RSS_METADATA_ONLY ->
            "Kaynak profili: metadata özeti + orijinal link."
        LegalMode.LICENSED ->
            "Kaynak profili: lisanslı metadata."
        LegalMode.NEEDS_REVIEW ->
            "Kaynak sinyali görünür; RSS üretim ingest kapalı."
        LegalMode.DISABLED ->
            "Kaynak sinyali kayıtlı; ingest kapalı."
    }

    fun toggleBlockedReason(legalMode: LegalMode): String? = when (legalMode) {
        LegalMode.DISABLED -> "Bu kaynak kapalıdır; açılamaz."
        LegalMode.NEEDS_REVIEW -> "İnceleme bekliyor; üretim ingest açılamaz."
        else -> null
    }

    fun ingestStatusLabel(source: Source): String = when {
        source.legalMode.blocksProductionIngest() -> "Üretim Ingest Kapalı"
        source.enabled -> "Üretim Ingest Açık"
        else -> "Üretim Ingest Kapalı"
    }

    fun buildSourceHealthDetails(stat: SourceStats): SourceHealthDetails {
        val source = stat.source
        val health = stat.health
        return SourceHealthDetails(
            statusMessage = sourceHealthStatusMessage(stat),
            whyNotInFeed = whyNotInFeedExplanation(stat),
            lastSuccessLabel = formatTimestampLabel("Son başarılı yenileme", health?.lastSuccessAt),
            lastErrorLabel = formatTimestampLabel("Son hata", health?.lastErrorAt),
            lastErrorSummary = sanitizeErrorMessage(health?.lastErrorMessage),
            consecutiveFailuresLabel = formatConsecutiveFailures(health),
            articleCountLabel = "Kayıtlı haber: ${stat.articleCount}",
        )
    }

    fun sourceHealthStatusMessage(stat: SourceStats): String {
        val source = stat.source
        val health = stat.health
        return when {
            source.legalMode == LegalMode.NEEDS_REVIEW ->
                "İnceleme bekliyor; üretim akışına alınmaz."
            source.legalMode == LegalMode.DISABLED ->
                "Kapalı; lisans/uygunluk olmadan kullanılmaz."
            !source.enabled ->
                "Bu kaynak kapalı; akışa haber eklemez."
            (health?.consecutiveFailures ?: 0) > 0 ->
                "Son yenilemelerde hata alındı; son kayıtlı haberler korunur."
            stat.articleCount == 0 ->
                "Bu kaynaktan henüz kayıtlı haber yok. Yenileme sonrası tekrar kontrol et."
            else ->
                "Kaynak son yenilemede veri sağladı."
        }
    }

    /** Kaynak bazlı — neden akışa yeni haber gelmeyebilir? */
    fun whyNotInFeedExplanation(stat: SourceStats): String? {
        val source = stat.source
        val health = stat.health
        return when {
            source.legalMode.blocksProductionIngest() ->
                "İnceleme bekliyor; üretim akışına alınmaz."
            !source.enabled ->
                "Bu kaynak kapalı; akışa haber eklemez."
            (health?.consecutiveFailures ?: 0) > 0 ->
                "Son yenilemelerde hata alındı; yeni haber eklenmeyebilir."
            stat.articleCount == 0 && source.enabled ->
                "Bu kaynaktan henüz kayıtlı haber yok. Yenileme sonrası tekrar kontrol et."
            else -> null
        }
    }

    fun isSourceHealthy(health: FeedHealth?): Boolean =
        health != null && health.consecutiveFailures == 0 && health.lastSuccessAt != null

    fun formatTimestampLabel(prefix: String, epochMillis: Long?): String? {
        epochMillis ?: return null
        return "$prefix: ${displayDateFormat.format(Date(epochMillis))}"
    }

    fun formatConsecutiveFailures(health: FeedHealth?): String? {
        val failures = health?.consecutiveFailures ?: return null
        if (failures <= 0) return null
        return "Ardışık hata: $failures"
    }

    /** Stack trace ve aşırı uzun teknik mesajları kullanıcıya göstermeden kısaltır. */
    fun sanitizeErrorMessage(raw: String?): String? {
        if (raw.isNullOrBlank()) return null
        val firstLine = raw.lineSequence().first().trim()
        val withoutStack = firstLine.substringBefore(" at com.")
            .substringBefore(" at java.")
            .substringBefore(" at android.")
            .trim()
        if (withoutStack.isEmpty()) return null
        return if (withoutStack.length <= MAX_ERROR_SUMMARY_LENGTH) {
            withoutStack
        } else {
            withoutStack.take(MAX_ERROR_SUMMARY_LENGTH - 1) + "…"
        }
    }
}
