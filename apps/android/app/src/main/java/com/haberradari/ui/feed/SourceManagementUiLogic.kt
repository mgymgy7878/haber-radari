package com.haberradari.ui.feed

import com.haberradari.data.model.LegalMode
import com.haberradari.data.model.Source

/**
 * Kaynak Yönetimi v0 — legalMode etiketleri ve güvenli toggle kuralları.
 */
object SourceManagementUiLogic {

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
            "RSS metadata modu: başlık, kısa özet, link ve kaynak bilgisi."
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
        source.legalMode.blocksProductionIngest() -> "Üretim ingest: kapalı"
        source.enabled -> "Üretim ingest: açık"
        else -> "Üretim ingest: kullanıcı kapattı"
    }
}
