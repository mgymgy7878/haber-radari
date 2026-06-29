package com.haberradari.data.model

/**
 * Bir haber kaynağının yasal içerik çekme modunu tanımlar.
 *
 * Bu enum, hangi tür içeriğin çekilebileceğini ve saklanabileceğini
 * kaynak bazında kontrol eder. ADR kararı gereği tam metin (full text)
 * hiçbir modda saklanmaz.
 *
 * @see LegalContentMode
 */
enum class LegalMode {
    /**
     * RSS'den gelen metadata saklanır:
     * başlık + kısa açıklama (description/summary) + link + kaynak + tarih.
     * Tam metin (body/fullText/contentHtml) ASLA saklanmaz.
     */
    RSS_METADATA_ONLY,

    /**
     * Yalnızca başlık + link + kaynak + tarih saklanır.
     * Açıklama/summary bile saklanmaz — en kısıtlı mod.
     */
    TITLE_LINK_ONLY,

    /**
     * Sözleşmeli kaynak — genişletilmiş içerik izinli.
     * v1+ için ayrılmıştır; şu anda RSS_METADATA_ONLY gibi davranır.
     * Tam metin yine saklanmaz (ADR kararı).
     */
    LICENSED,

    /**
     * Hukuki inceleme bekliyor — production ingest/fetch kapalı.
     * Kaynak seed listesinde görünebilir (parity) ancak RSS sync atlanır.
     */
    NEEDS_REVIEW,

    /**
     * Bu kaynaktan hiç veri çekilmez.
     * Kaynak listesinde görünür ama fetch atlanır.
     */
    DISABLED;

    /** Production RSS fetch/ingest için kapalı modlar. */
    fun blocksProductionIngest(): Boolean =
        this == DISABLED || this == NEEDS_REVIEW
}
