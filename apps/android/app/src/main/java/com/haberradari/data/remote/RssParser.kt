package com.haberradari.data.remote

import com.haberradari.data.model.Article
import com.haberradari.data.model.LegalMode
import com.haberradari.data.model.Source
import java.net.URI
import java.security.MessageDigest
import java.time.ZoneId
import java.util.Locale
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

    /** Global official afet seed — Atom summary/description UI/cache'e taşınmaz. */
    const val USGS_EARTHQUAKES_SOURCE_ID = "usgs-earthquakes"

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

            // TITLE_LINK_ONLY → description yok; USGS (resmi afet) → description her zaman yok
            val description = when {
                source.legalMode == LegalMode.TITLE_LINK_ONLY -> null
                source.id == USGS_EARTHQUAKES_SOURCE_ID -> null
                source.legalMode == LegalMode.RSS_METADATA_ONLY ->
                    item.description?.takeUnless { it.contains('<') }
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
        parseRfc2822Date(dateStr)?.let { return it }
        parseIso8601Date(dateStr)?.let { return it }
        return parseTurkishDateTime(dateStr)
    }

    private fun parseRfc2822Date(dateStr: String): Long? = try {
        java.text.SimpleDateFormat(
            "EEE, dd MMM yyyy HH:mm:ss Z",
            Locale.ENGLISH,
        ).parse(dateStr)?.time
    } catch (_: Exception) {
        null
    }

    private fun parseIso8601Date(dateStr: String): Long? {
        val trimmed = dateStr.trim()
        try {
            return java.time.Instant.parse(trimmed).toEpochMilli()
        } catch (_: Exception) {
            // fallback: offset without fractional seconds
        }
        return try {
            java.text.SimpleDateFormat(
                "yyyy-MM-dd'T'HH:mm:ssZ",
                Locale.ENGLISH,
            ).parse(trimmed)?.time
        } catch (_: Exception) {
            null
        }
    }

    /**
     * Resmi kurum Atom feed'leri (ör. TCMB): `18 Haz 2026 14:00:00`
     * Timezone belirtilmezse Europe/Istanbul varsayılır (deterministic).
     */
    private fun parseTurkishDateTime(dateStr: String): Long? {
        val match = TURKISH_DATE_TIME_PATTERN.matchEntire(dateStr.trim()) ?: return null
        val day = match.groupValues[1].toIntOrNull() ?: return null
        val month = resolveTurkishMonth(match.groupValues[2]) ?: return null
        val year = match.groupValues[3].toIntOrNull() ?: return null
        val hour = match.groupValues[4].toIntOrNull() ?: return null
        val minute = match.groupValues[5].toIntOrNull() ?: return null
        val second = match.groupValues[6].toIntOrNull() ?: return null

        return try {
            java.time.LocalDateTime.of(year, month, day, hour, minute, second)
                .atZone(TURKISH_FEED_ZONE)
                .toInstant()
                .toEpochMilli()
        } catch (_: Exception) {
            null
        }
    }

    private fun resolveTurkishMonth(token: String): Int? {
        val key = normalizeTurkishMonthToken(token)
        return TURKISH_MONTH_TO_NUMBER[key]
    }

    private fun normalizeTurkishMonthToken(token: String): String {
        return token.trim().trimEnd('.').lowercase(Locale.ROOT)
            .replace('ı', 'i')
            .replace('ğ', 'g')
            .replace('ü', 'u')
            .replace('ö', 'o')
            .replace('ç', 'c')
            .replace('ş', 's')
    }

    private val TURKISH_FEED_ZONE: ZoneId = ZoneId.of("Europe/Istanbul")

    private val TURKISH_DATE_TIME_PATTERN =
        Regex("""^(\d{1,2})\s+(\S+)\s+(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$""")

    private val TURKISH_MONTH_TO_NUMBER: Map<String, Int> = mapOf(
        "oca" to 1, "ocak" to 1,
        "sub" to 2, "subat" to 2,
        "mar" to 3, "mart" to 3,
        "nis" to 4, "nisan" to 4,
        "may" to 5, "mayis" to 5,
        "haz" to 6, "haziran" to 6,
        "tem" to 7, "temmuz" to 7,
        "agu" to 8, "agustos" to 8,
        "eyl" to 9, "eylul" to 9,
        "eki" to 10, "ekim" to 10,
        "kas" to 11, "kasim" to 11,
        "ara" to 12, "aralik" to 12,
    )
}
