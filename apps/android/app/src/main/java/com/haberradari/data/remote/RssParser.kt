package com.haberradari.data.remote

import com.haberradari.data.model.Article
import com.haberradari.data.model.LegalMode
import com.haberradari.data.model.Source
import java.net.URI
import java.security.MessageDigest
import java.util.UUID

/**
 * RSS XML'den Article listesi üreten parser.
 *
 * Android'in yerleşik XML parsing yeteneklerini kullanır (XmlPullParser).
 * Harici bağımlılık gerektirmez.
 *
 * DEĞİŞMEZ KURALLAR:
 * - DISABLED kaynaklar parse edilmez
 * - TITLE_LINK_ONLY modunda description null bırakılır
 * - Tam metin (body/fullText/html) asla çıkartılmaz
 * - Her Article için sourceName, originalUrl, publishedAt zorunludur
 */
object RssParser {

    /**
     * Ham RSS item — parse sonucu.
     * Henüz legalMode filtresi uygulanmamış durum.
     */
    data class RssItem(
        val title: String,
        val link: String,
        val pubDate: String,
        val description: String?,
        val imageUrl: String? = null
    )

    /**
     * RSS XML'i parse eder ve RssItem listesi döner.
     * Bozuk veya boş XML'de boş liste döner — crash yapmaz.
     */
    fun parseXml(xml: String): List<RssItem> {
        val items = mutableListOf<RssItem>()
        // Regex-based lightweight parser (XmlPullParser context gerektirdiğinden
        // unit test uyumluluğu için regex kullanıyoruz)
        val itemBlocks = Regex("<(?:item|entry)[\\s\\S]*?</(?:item|entry)>", RegexOption.IGNORE_CASE)
            .findAll(xml)
            .toList()

        for (block in itemBlocks) {
            val blockText = block.value
            val title = extractTag(blockText, "title") ?: continue
            val link = extractLink(blockText) ?: continue

            val pubDate = extractTag(blockText, "pubDate") 
                ?: extractTag(blockText, "published") 
                ?: extractTag(blockText, "updated") 
                ?: ""

            var description = extractTag(blockText, "description") 
                ?: extractTag(blockText, "summary") 
                ?: extractTag(blockText, "content")
            
            description = description?.trim()?.let {
                if (it.length > 500) it.substring(0, 500) + "..." else it
            }

            items.add(
                RssItem(
                    title = title.trim(),
                    link = link.trim(),
                    pubDate = pubDate,
                    description = description,
                    imageUrl = extractMediaUrl(blockText)
                )
            )
        }
        return items
    }

    /**
     * RssItem listesini Article listesine dönüştürür.
     * LegalMode kurallarını uygular.
     *
     * @param items Parse edilmiş RSS item'ları
     * @param source Kaynak bilgisi (legalMode kontrolü)
     * @return Article listesi — DISABLED kaynaklarda boş liste
     */
    fun toArticles(items: List<RssItem>, source: Source): List<Article> {
        // DISABLED / NEEDS_REVIEW kaynaktan asla makale üretme
        if (source.legalMode.blocksProductionIngest()) {
            return emptyList()
        }

        val now = System.currentTimeMillis()

        return items.mapNotNull { item ->
            val canonicalUrl = normalizeUrl(item.link)
            val hash = computeContentHash(item.title, canonicalUrl)
            val publishedAt = parseDate(item.pubDate) ?: now

            // TITLE_LINK_ONLY modunda description saklanmaz
            val description = when (source.legalMode) {
                LegalMode.TITLE_LINK_ONLY -> null
                else -> item.description
            }

            Article(
                id = UUID.randomUUID().toString(),
                title = item.title,
                description = description,
                sourceName = source.name,
                sourceId = source.id,
                originalUrl = item.link,
                canonicalUrl = canonicalUrl,
                contentHash = hash,
                publishedAt = publishedAt,
                fetchedAt = now,
                imageUrl = item.imageUrl
            )
        }
    }

    // --- URL Normalizasyonu ---

    /**
     * URL'yi normalize eder — duplicate karşılaştırması için.
     * - Trailing slash kaldırır
     * - HTTP → HTTPS dönüştürür
     * - Fragment (#) kaldırır
     * - Küçük harfe çevirir (host kısmı)
     * - İzleme (tracking) parametrelerini temizler
     */
    fun normalizeUrl(url: String): String {
        return try {
            val uri = URI(url.trim())
            val scheme = (uri.scheme ?: "https").lowercase().let {
                if (it == "http") "https" else it
            }
            val host = (uri.host ?: "").lowercase()
            val path = (uri.path ?: "").trimEnd('/')
            
            // Query parametrelerini temizle (utm_, fbclid, gclid vb.)
            val trackingParams = setOf("utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid")
            val cleanQuery = uri.query?.split("&")?.mapNotNull { param ->
                val parts = param.split("=", limit = 2)
                if (parts.isNotEmpty() && trackingParams.contains(parts[0].lowercase())) {
                    null
                } else {
                    param
                }
            }?.joinToString("&")?.takeIf { it.isNotEmpty() }
            
            val queryPart = cleanQuery?.let { "?$it" } ?: ""
            "$scheme://$host$path$queryPart"
        } catch (_: Exception) {
            url.trim().trimEnd('/').lowercase()
        }
    }

    // --- Content Hash ---

    /**
     * SHA-256(title + canonicalUrl) → hex string.
     * Duplicate tespiti için kullanılır.
     */
    fun computeContentHash(title: String, canonicalUrl: String): String {
        val input = "$title|$canonicalUrl"
        val digest = MessageDigest.getInstance("SHA-256")
        return digest.digest(input.toByteArray(Charsets.UTF_8))
            .joinToString("") { "%02x".format(it) }
    }

    // --- Yardımcı Fonksiyonlar ---

    private fun extractTag(block: String, tag: String): String? {
        // CDATA desteği
        val cdataPattern = Regex(
            "<$tag[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)]]>\\s*</$tag>",
            RegexOption.IGNORE_CASE
        )
        cdataPattern.find(block)?.let {
            return decodeXmlEntities(it.groupValues[1])
        }

        // Normal tag
        val pattern = Regex("<$tag[^>]*>([\\s\\S]*?)</$tag>", RegexOption.IGNORE_CASE)
        return pattern.find(block)?.let {
            val content = it.groupValues[1].trim()
            if (content.isNotEmpty()) decodeXmlEntities(content) else null
        }
    }

    private fun extractLink(block: String): String? {
        // RSS standardı: <link>http...</link>
        val textLink = extractTag(block, "link")
        if (!textLink.isNullOrBlank()) return textLink

        // Atom standardı: <link rel="alternate" href="..." /> veya <link href="..." />
        val linkPattern = Regex("<link[^>]*href=[\"']([^\"']+)[\"'][^>]*>", RegexOption.IGNORE_CASE)
        val matches = linkPattern.findAll(block).toList()
        
        // Önce rel="alternate" olanı ara
        val alternate = matches.find { it.value.contains("rel=[\"']alternate[\"']".toRegex(RegexOption.IGNORE_CASE)) }
        if (alternate != null) {
            return alternate.groupValues[1]
        }
        // Bulunamazsa ilk href'i dön
        return matches.firstOrNull()?.groupValues?.get(1)
    }

    private fun extractMediaUrl(block: String): String? {
        // <media:content url="..."> veya <enclosure url="...">
        val mediaPattern = Regex(
            """(?:media:content|enclosure)[^>]*url=["']([^"']+)["']""",
            RegexOption.IGNORE_CASE
        )
        return mediaPattern.find(block)?.groupValues?.get(1)
    }

    private fun decodeXmlEntities(text: String): String {
        return text
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", "\"")
            .replace("&#39;", "'")
            .replace("&apos;", "'")
    }

    private fun parseDate(dateStr: String): Long? {
        if (dateStr.isBlank()) return null
        return try {
            // RFC 2822 format (RSS standard)
            java.text.SimpleDateFormat(
                "EEE, dd MMM yyyy HH:mm:ss Z",
                java.util.Locale.ENGLISH
            ).parse(dateStr)?.time
        } catch (_: Exception) {
            try {
                // ISO 8601 fallback
                java.text.SimpleDateFormat(
                    "yyyy-MM-dd'T'HH:mm:ssZ",
                    java.util.Locale.ENGLISH
                ).parse(dateStr)?.time
            } catch (_: Exception) {
                null
            }
        }
    }
}
