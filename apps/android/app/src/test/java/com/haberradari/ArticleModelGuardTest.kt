package com.haberradari

import com.haberradari.data.model.Article
import org.junit.Assert.*
import org.junit.Test

/**
 * Article modeli statik guard testi.
 *
 * Bu test, Article sınıfında tam metin alanlarının
 * KAZARA eklenmesini engelleyen bir güvenlik bariyeridir.
 *
 * ADR kararı gereği aşağıdaki alanlar ASLA Article'da bulunmamalıdır:
 * - body
 * - fullText
 * - contentHtml
 * - articleText
 * - scrapedText
 *
 * Bu test CI/CD'de çalışarak gelecekteki değişiklikleri kontrol eder.
 */
class ArticleModelGuardTest {

    /** Yasaklı alan adları — tam metin saklama yasağı */
    private val forbiddenFieldNames = listOf(
        "body",
        "fullText",
        "full_text",
        "contentHtml",
        "content_html",
        "articleText",
        "article_text",
        "scrapedText",
        "scraped_text",
        "htmlContent",
        "html_content",
        "rawContent",
        "raw_content",
        "fullBody",
        "full_body"
    )

    @Test
    fun `Article class must not contain full text fields`() {
        val articleFields = Article::class.java.declaredFields
            .map { it.name }
            .filter { !it.startsWith("$") } // Kotlin metadata alanlarını atla

        for (forbidden in forbiddenFieldNames) {
            assertFalse(
                "Article sınıfında yasaklı alan bulundu: '$forbidden'. " +
                    "ADR kararı gereği tam metin alanları eklenemez. " +
                    "Bkz: LegalContentMode.NO_FULL_TEXT",
                articleFields.any { it.equals(forbidden, ignoreCase = true) }
            )
        }
    }

    @Test
    fun `Article class has required legal fields`() {
        val fieldNames = Article::class.java.declaredFields
            .map { it.name }
            .toSet()

        // Google Play kaynak atfı zorunluluğu
        assertTrue("sourceName alanı zorunludur", "sourceName" in fieldNames)
        assertTrue("originalUrl alanı zorunludur", "originalUrl" in fieldNames)
        assertTrue("publishedAt alanı zorunludur", "publishedAt" in fieldNames)
        assertTrue("title alanı zorunludur", "title" in fieldNames)
        assertTrue("contentHash alanı zorunludur", "contentHash" in fieldNames)
    }

    @Test
    fun `Article field count is reasonable - no unexpected fields`() {
        val fieldCount = Article::class.java.declaredFields
            .filter { !it.name.startsWith("$") }
            .size

        // Article şu anda 11 alan içeriyor
        // Yeni alan eklendiğinde bu test güncellenmeli — bilinçli karar gerekli
        assertTrue(
            "Article alanı sayısı beklenenden fazla ($fieldCount). " +
                "Yeni alan mı eklendi? Tam metin alanı olmadığından emin olun.",
            fieldCount <= 15
        )
    }
}
