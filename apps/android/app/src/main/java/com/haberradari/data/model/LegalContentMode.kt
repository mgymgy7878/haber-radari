package com.haberradari.data.model

/**
 * Yasal içerik saklama politikası.
 *
 * ADR kararı gereği uygulama hiçbir koşulda tam metin (full text) saklamaz.
 * Bu enum, bu kararın kod tabanında açık ve denetlenebilir olmasını sağlar.
 *
 * Article modelinde body, fullText, contentHtml, articleText, scrapedText
 * gibi alanlar KASITLI olarak bulunmaz.
 */
enum class LegalContentMode {
    /**
     * Tam metin asla saklanmaz.
     * Bu, tüm LegalMode değerleri için geçerli olan üst kural budur.
     */
    NO_FULL_TEXT
}
