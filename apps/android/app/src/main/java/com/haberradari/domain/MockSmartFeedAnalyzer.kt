package com.haberradari.domain

import com.haberradari.data.model.AiCuratedNewsItem
import com.haberradari.data.model.Article
import com.haberradari.data.model.ContentType
import com.haberradari.data.model.EvidenceStatus
import com.haberradari.data.model.Importance
import com.haberradari.data.model.PublishDecision
import com.haberradari.data.model.SourceEvidence
import com.haberradari.data.model.TopicQuality
import java.util.UUID

class MockSmartFeedAnalyzer {

    // Editorial Filter Keywords
    private val clickbaitNoise = listOf("şok", "flaş", "bomba", "az önce", "son dakika", "canlı", "gündem", "inanılmaz", "tüm gelişmeler")
    private val celebrityGossip = listOf("ünlü", "magazin", "aşk", "boşanma")
    private val unverifiableClaim = listOf("mi oldu?", "iddia edildi", "sosyal medyada yayıldı")
    private val genericEvergreen = listOf("haziran ayında kar mücadelesi")
    
    // Content Type Signals
    private val asayisCrimeKeywords = listOf("yakalandı", "öldürdü", "kavga", "cinayet", "uyuşturucu", "hırsızlık", "dolandırıcı", "koçbaşı", "operasyon", "şafak operasyonu", "tutuklandı", "gözaltı")
    private val politicalStatementKeywords = listOf("açıkladı:", "dedi", "konuştu", "değerlendirdi", "parti sözcüsü", "toplantısında", "ak parti", "chp", "mhp")
    private val listicleEntertainmentKeywords = listOf("sinema tarihinin", "en iyi", "en kötü", "lanetli filmler", "bunları biliyor musunuz", "liste", "önerisi")

    // Kategoriler için eşleştirme kelimeleri
    private val categoryMap = mapOf(
        "Afet" to listOf("deprem", "afet", "yangın", "sel", "sarsıntı", "tsunami", "heyelan"),
        "Ekonomi" to listOf("enflasyon", "faiz", "dolar", "borsa", "ekonomi", "merkez bankası", "tüik", "bddk", "spk"),
        "Eğitim / Kamu" to listOf("öğretmen", "sendika", "grev", "okul", "üniversite", "meb"),
        "Güvenlik" to listOf("terör", "mit", "sınır", "askeri", "savaş"), // Asayiş ayrıldı
        "Siyaset / Kamu" to listOf("seçim", "meclis", "bakanlık", "karar", "yönetmelik", "hükümet"),
        "Spor" to listOf("spor", "maç", "transfer", "şampiyon", "galatasaray", "fenerbahçe", "beşiktaş", "trabzonspor"),
        "Dünya" to listOf("dünya", "savaş", "diplomasi", "abd", "rusya", "avrupa"),
        "Asayiş" to asayisCrimeKeywords
    )

    private val eventFingerprints = listOf(
        EventFingerprint(
            id = "event_canakkale_deprem",
            keywords = listOf("çanakkale", "deprem"),
            actionKeywords = listOf("oldu", "bildirildi", "sarsıntı", "meydana", "büyüklüğünde"),
            baseTitle = "Çanakkale çevresinde sarsıntı bildirildi",
            baseSummary = "Çanakkale ve çevre illerde hissedilen bir deprem meydana geldiği kaydedildi.",
            categoryFallback = "Afet"
        ),
        EventFingerprint(
            id = "event_venezuela_deprem",
            keywords = listOf("venezuela", "deprem"),
            actionKeywords = listOf("oldu", "peş peşe", "iki", "büyüklüğünde", "sarsıntı"),
            baseTitle = "Venezuela'da peş peşe sarsıntılar meydana geldi",
            baseSummary = "Venezuela'da kısa aralıklarla birden fazla sarsıntı kaydedildi.",
            categoryFallback = "Afet"
        ),
        EventFingerprint(
            id = "event_tcmb_faiz",
            keywords = listOf("merkez bankası", "faiz", "tcmb"),
            actionKeywords = listOf("kararı", "açıklandı", "arttırdı", "sabit tuttu", "beklenti"),
            baseTitle = "Merkez Bankası yeni faiz kararını veya verilerini paylaştı",
            baseSummary = "TCMB tarafından piyasaların yakından takip ettiği faiz ve enflasyon verilerine dair yeni açıklamalar yapıldı.",
            categoryFallback = "Ekonomi"
        ),
        EventFingerprint(
            id = "event_ogretmen_grev",
            keywords = listOf("öğretmenler", "açlık grevi"),
            actionKeywords = listOf("sonlandırdı", "başladı", "grev"),
            baseTitle = "Öğretmenler açlık grevini sonlandırdı",
            baseSummary = "Bir süredir devam eden öğretmen grevi ve eylemleri hakkında yeni bir gelişme yaşandı.",
            categoryFallback = "Eğitim / Kamu"
        )
    )

    data class EventFingerprint(
        val id: String,
        val keywords: List<String>,
        val actionKeywords: List<String>,
        val baseTitle: String,
        val baseSummary: String,
        val categoryFallback: String
    )

    data class AnalysisResult(
        val items: List<AiCuratedNewsItem>,
        val totalAnalyzed: Int,
        val publishedCount: Int,
        val hiddenCount: Int
    )

    fun analyzeAndCluster(articles: List<Article>): AnalysisResult {
        if (articles.isEmpty()) return AnalysisResult(emptyList(), 0, 0, 0)

        val clustered = mutableListOf<AiCuratedNewsItem>()
        val processedArticleIds = mutableSetOf<String>()

        // 1. Olay (Event) Bazlı Kümeleme
        for (fingerprint in eventFingerprints) {
            val matchingArticles = articles.filter { article ->
                if (processedArticleIds.contains(article.id)) return@filter false
                
                val text = (article.title + " " + (article.description ?: "")).lowercase()
                
                val hasAllKeywords = fingerprint.keywords.all { text.contains(it) }
                val hasAction = fingerprint.actionKeywords.any { text.contains(it) }

                hasAllKeywords && hasAction
            }

            if (matchingArticles.isNotEmpty()) {
                val (validArticles, noisyArticles) = matchingArticles.partition { article ->
                    val titleLower = article.title.lowercase()
                    !hasNoiseFilters(titleLower) && titleLower.length > 20
                }

                val evidenceArticles = validArticles.ifEmpty { matchingArticles }
                val sourceCount = evidenceArticles.size
                
                val status = when {
                    sourceCount >= 3 -> EvidenceStatus.CONFIRMED
                    sourceCount == 2 -> EvidenceStatus.PARTIAL
                    else -> EvidenceStatus.SINGLE_SOURCE
                }

                var confidence = when (status) {
                    EvidenceStatus.CONFIRMED -> 0.85f
                    EvidenceStatus.PARTIAL -> 0.70f
                    EvidenceStatus.SINGLE_SOURCE -> 0.50f
                    else -> 0.40f
                }
                
                if (noisyArticles.isNotEmpty()) {
                    confidence -= 0.1f
                }

                val bestTitle = evidenceArticles.firstOrNull()?.title ?: fingerprint.baseTitle
                val contentType = determineContentType(bestTitle)
                val category = determineCategory(bestTitle, contentType) ?: fingerprint.categoryFallback
                
                val combinedText = (bestTitle + " " + fingerprint.baseSummary).lowercase()
                val isEarthquake = combinedText.contains("deprem") || combinedText.contains("sarsıntı")
                val magnitude = if (isEarthquake) extractEarthquakeMagnitude(combinedText) else null
                val isStrongEarthquake = magnitude != null && magnitude >= 5.0
                val containsCasualties = combinedText.contains("can kaybı") || combinedText.contains("can kaybi") || 
                                         combinedText.contains("öldü") || combinedText.contains("ölü") || 
                                         combinedText.contains("yaralı") || combinedText.contains("yaralandı") || 
                                         combinedText.contains("vefat") || combinedText.contains("hayatını")
                
                val isOfficialSource = evidenceArticles.any { 
                    it.sourceId.lowercase() in listOf("afad", "usgs", "tcmb", "kap", "spk")
                }

                val topicQuality = determineTopicQuality(category, contentType, sourceCount)
                val importance = determineImportance(status, topicQuality, bestTitle)
                val publishDecision = determinePublishDecision(
                    status, importance, category, contentType, topicQuality,
                    isOfficialSource, isStrongEarthquake, containsCasualties, isEarthquake
                )
                val publishReason = determinePublishReason(
                    publishDecision, status, topicQuality, sourceCount,
                    isOfficialSource, isStrongEarthquake
                )

                clustered.add(
                    AiCuratedNewsItem(
                        id = UUID.randomUUID().toString(),
                        aiTitle = bestTitle,
                        aiSummary = fingerprint.baseSummary,
                        category = category,
                        importance = importance,
                        confidence = confidence.coerceIn(0.1f, 0.99f),
                        sourceCount = sourceCount,
                        uniqueSourceCount = evidenceArticles.map { it.sourceName }.distinct().size,
                        sources = evidenceArticles.map { it.toSourceEvidence() },
                        mediaHints = null,
                        originalArticleIds = evidenceArticles.map { it.id },
                        evidenceStatus = status,
                        clusterReason = "Olay parmak izi eşleşmesi (${fingerprint.keywords.joinToString()})",
                        warningLabel = getWarningLabel(publishDecision, status, topicQuality, isOfficialSource),
                        isDemo = true,
                        filteredSourceCount = noisyArticles.size,
                        publishDecision = publishDecision,
                        topicQuality = topicQuality,
                        contentType = contentType,
                        publishReason = publishReason
                    )
                )

                processedArticleIds.addAll(matchingArticles.map { it.id })
            }
        }

        // 2. Kalan (Eşleşmeyen) Haberleri Filtrele ve Tekli Göster
        val remaining = articles.filter { !processedArticleIds.contains(it.id) }
        
        remaining.forEach { article ->
            val titleLower = article.title.lowercase()
            val hasNoise = hasNoiseFilters(titleLower)
            val isShort = titleLower.length <= 20
            val isNoisy = hasNoise || isShort
            
            val status = if (isNoisy) EvidenceStatus.LOW_CONFIDENCE else EvidenceStatus.SINGLE_SOURCE
            
            val contentType = determineContentType(article.title)
            val category = determineCategory(article.title, contentType) ?: "Diğer"
            
            val combinedText = (article.title + " " + (article.description ?: "")).lowercase()
            val isEarthquake = combinedText.contains("deprem") || combinedText.contains("sarsıntı")
            val magnitude = if (isEarthquake) extractEarthquakeMagnitude(combinedText) else null
            val isStrongEarthquake = magnitude != null && magnitude >= 5.0
            val containsCasualties = combinedText.contains("can kaybı") || combinedText.contains("can kaybi") || 
                                     combinedText.contains("öldü") || combinedText.contains("ölü") || 
                                     combinedText.contains("yaralı") || combinedText.contains("yaralandı") || 
                                     combinedText.contains("vefat") || combinedText.contains("hayatını")
            
            val isOfficialSource = article.sourceId.lowercase() in listOf("afad", "usgs", "tcmb", "kap", "spk")

            val topicQuality = determineTopicQuality(category, contentType, 1)
            val importance = determineImportance(status, topicQuality, article.title)
            
            val publishDecision = if (isNoisy) {
                PublishDecision.FILTERED_OUT
            } else {
                determinePublishDecision(
                    status, importance, category, contentType, topicQuality,
                    isOfficialSource, isStrongEarthquake, containsCasualties, isEarthquake
                )
            }
            val publishReason = determinePublishReason(
                publishDecision, status, topicQuality, 1,
                isOfficialSource, isStrongEarthquake
            )
            
            clustered.add(
                AiCuratedNewsItem(
                    id = UUID.randomUUID().toString(),
                    aiTitle = article.title,
                    aiSummary = article.description ?: "Bu olayın kısa sentezi bulunmuyor.",
                    category = category,
                    importance = importance,
                    confidence = if (isNoisy) 0.3f else 0.5f,
                    sourceCount = 1,
                    sources = listOf(article.toSourceEvidence()),
                    mediaHints = null,
                    originalArticleIds = listOf(article.id),
                    evidenceStatus = status,
                    clusterReason = "Olay eşleşmesi bulunamadı",
                    warningLabel = getWarningLabel(publishDecision, status, topicQuality, isOfficialSource),
                    isDemo = true,
                    filteredSourceCount = 0,
                    publishDecision = publishDecision,
                    topicQuality = topicQuality,
                    contentType = contentType,
                    publishReason = publishReason
                )
            )
        }

        // Sıralama
        val sortedList = clustered.sortedWith(
            compareBy<AiCuratedNewsItem> { it.evidenceStatus == EvidenceStatus.LOW_CONFIDENCE }
                .thenByDescending { it.publishDecision == PublishDecision.PUBLISH_MAIN }
                .thenByDescending { it.evidenceStatus == EvidenceStatus.CONFIRMED && it.importance == Importance.HIGH } // HIGH + CONFIRMED
                .thenByDescending { it.evidenceStatus == EvidenceStatus.PARTIAL && it.importance == Importance.HIGH } // HIGH + PARTIAL
                .thenByDescending { it.topicQuality == TopicQuality.CRITICAL && it.evidenceStatus == EvidenceStatus.SINGLE_SOURCE } // CRITICAL Single
                .thenByDescending { it.importance }
                .thenByDescending { it.confidence }
        )
        
        val publishedCount = sortedList.count { it.publishDecision == PublishDecision.PUBLISH_MAIN }
        val hiddenCount = sortedList.count { it.publishDecision != PublishDecision.PUBLISH_MAIN }

        return AnalysisResult(
            items = sortedList,
            totalAnalyzed = articles.size,
            publishedCount = publishedCount,
            hiddenCount = hiddenCount
        )
    }

    private fun hasNoiseFilters(titleLower: String): Boolean {
        return clickbaitNoise.any { titleLower.contains(it) } ||
               unverifiableClaim.any { titleLower.contains(it) } ||
               genericEvergreen.any { titleLower.contains(it) }
    }
    
    private fun determineContentType(title: String): ContentType {
        val titleLower = title.lowercase()
        if (listicleEntertainmentKeywords.any { titleLower.contains(it) }) return ContentType.LISTICLE_OR_ENTERTAINMENT
        if (celebrityGossip.any { titleLower.contains(it) }) return ContentType.LISTICLE_OR_ENTERTAINMENT
        if (politicalStatementKeywords.any { titleLower.contains(it) }) return ContentType.POLITICAL_STATEMENT
        if (asayisCrimeKeywords.any { titleLower.contains(it) }) return ContentType.ASAYIS_CRIME
        return ContentType.NEWS_EVENT
    }

    private fun determineCategory(title: String, contentType: ContentType): String? {
        if (contentType == ContentType.LISTICLE_OR_ENTERTAINMENT) return "Kültür / Eğlence"
        if (contentType == ContentType.ASAYIS_CRIME) return "Asayiş"
        
        val titleLower = title.lowercase()
        for ((category, keywords) in categoryMap) {
            if (keywords.any { titleLower.contains(it) }) {
                // "Yangınlar, kazalar: Sinema tarihinin filmleri" -> Afet olmasın diye contentType kontrolü yapıyoruz.
                if (category == "Afet" && contentType != ContentType.NEWS_EVENT) {
                    continue
                }
                return category
            }
        }
        return null
    }
    
    private fun determineTopicQuality(category: String?, contentType: ContentType, sourceCount: Int): TopicQuality {
        if (contentType == ContentType.LISTICLE_OR_ENTERTAINMENT) return TopicQuality.NOISE
        if (contentType == ContentType.ASAYIS_CRIME) return TopicQuality.LOW_VALUE
        
        return when (category) {
            "Afet", "Güvenlik" -> TopicQuality.CRITICAL
            "Ekonomi" -> if (sourceCount >= 2) TopicQuality.HIGH_VALUE else TopicQuality.CRITICAL // MB kararları critical olabilir
            "Siyaset / Kamu" -> if (contentType == ContentType.POLITICAL_STATEMENT) TopicQuality.NORMAL else TopicQuality.HIGH_VALUE
            else -> TopicQuality.NORMAL
        }
    }

    private fun determineImportance(status: EvidenceStatus, quality: TopicQuality, title: String): Importance {
        if (quality == TopicQuality.NOISE || quality == TopicQuality.LOW_VALUE) return Importance.LOW
        
        return when (status) {
            EvidenceStatus.CONFIRMED -> if (quality == TopicQuality.CRITICAL || quality == TopicQuality.HIGH_VALUE) Importance.HIGH else Importance.MEDIUM
            EvidenceStatus.PARTIAL -> Importance.MEDIUM
            EvidenceStatus.SINGLE_SOURCE -> if (quality == TopicQuality.CRITICAL) Importance.MEDIUM else Importance.LOW
            else -> Importance.LOW
        }
    }

    private fun extractEarthquakeMagnitude(text: String): Double? {
        val pattern = java.util.regex.Pattern.compile("(\\d+(?:[,.]\\d+)?)\\s*(?:büyüklüğünde|magnitüd|ml|mw|md|magnitude|deprem)", java.util.regex.Pattern.CASE_INSENSITIVE)
        var matcher = pattern.matcher(text)
        if (matcher.find()) {
            val valStr = matcher.group(1)?.replace(',', '.') ?: return null
            return valStr.toDoubleOrNull()
        }
        val pattern2 = java.util.regex.Pattern.compile("(?:büyüklüğünde|magnitüd|ml|mw|md|magnitude)\\s*(\\d+(?:[,.]\\d+)?)", java.util.regex.Pattern.CASE_INSENSITIVE)
        matcher = pattern2.matcher(text)
        if (matcher.find()) {
            val valStr = matcher.group(1)?.replace(',', '.') ?: return null
            return valStr.toDoubleOrNull()
        }
        val pattern3 = java.util.regex.Pattern.compile("m\\s*:\\s*(\\d+(?:[,.]\\d+)?)", java.util.regex.Pattern.CASE_INSENSITIVE)
        matcher = pattern3.matcher(text)
        if (matcher.find()) {
            val valStr = matcher.group(1)?.replace(',', '.') ?: return null
            return valStr.toDoubleOrNull()
        }
        val pattern4 = java.util.regex.Pattern.compile("m\\s*(\\d+(?:[,.]\\d+)?)\\s+deprem", java.util.regex.Pattern.CASE_INSENSITIVE)
        matcher = pattern4.matcher(text)
        if (matcher.find()) {
            val valStr = matcher.group(1)?.replace(',', '.') ?: return null
            return valStr.toDoubleOrNull()
        }
        return null
    }

    private fun determinePublishDecision(
        status: EvidenceStatus,
        importance: Importance,
        category: String?,
        contentType: ContentType,
        quality: TopicQuality,
        isOfficialSource: Boolean,
        isStrongEarthquake: Boolean,
        containsCasualties: Boolean,
        isEarthquake: Boolean
    ): PublishDecision {
        
        // 1. Noise ve Low Value kesinlikle ana akışta yok
        if (quality == TopicQuality.NOISE || quality == TopicQuality.LOW_VALUE) {
            return if (contentType == ContentType.LISTICLE_OR_ENTERTAINMENT) PublishDecision.FILTERED_OUT else PublishDecision.RAW_ONLY
        }
        
        if (status == EvidenceStatus.LOW_CONFIDENCE || status == EvidenceStatus.FILTERED) {
            return PublishDecision.FILTERED_OUT
        }

        // 2. Çok kaynaklı doğrulama
        if (status == EvidenceStatus.CONFIRMED || status == EvidenceStatus.PARTIAL) {
            // Demeç bile olsa 2+ kaynak ve orta/yüksek önemse girebilir
            return if (importance == Importance.HIGH || importance == Importance.MEDIUM) {
                PublishDecision.PUBLISH_MAIN
            } else {
                PublishDecision.WATCHLIST_ONLY
            }
        }

        // 3. Tek Kaynaklı (SINGLE_SOURCE) İstisnaları
        // Siyasi açıklamalar KESİNLİKLE Watchlist
        if (contentType == ContentType.POLITICAL_STATEMENT) {
            return PublishDecision.WATCHLIST_ONLY
        }
        
        if (isStrongEarthquake) {
            return PublishDecision.PUBLISH_MAIN
        }
        
        if (isOfficialSource && quality != TopicQuality.NOISE && quality != TopicQuality.LOW_VALUE) {
            if (isEarthquake && !isStrongEarthquake && !containsCasualties) {
                return PublishDecision.WATCHLIST_ONLY
            }
            return PublishDecision.PUBLISH_MAIN
        }
        
        // Sadece CRITICAL olaylar tek kaynakla ana akışa sızabilir
        return if (quality == TopicQuality.CRITICAL) {
            if (isEarthquake && !isStrongEarthquake && !containsCasualties) {
                PublishDecision.WATCHLIST_ONLY
            } else {
                PublishDecision.PUBLISH_MAIN
            }
        } else {
            PublishDecision.WATCHLIST_ONLY
        }
    }
    
    private fun determinePublishReason(
        decision: PublishDecision,
        status: EvidenceStatus,
        quality: TopicQuality,
        sourceCount: Int,
        isOfficialSource: Boolean,
        isStrongEarthquake: Boolean
    ): String? {
        if (decision != PublishDecision.PUBLISH_MAIN) return null
        
        return if (isOfficialSource) {
            "Ana akışa alınma nedeni: Resmi kaynaktan tek kaynaklı önemli duyuru"
        } else if (status == EvidenceStatus.SINGLE_SOURCE && (quality == TopicQuality.CRITICAL || isStrongEarthquake)) {
            "Ana akışa alınma nedeni: Tek kaynaklı ama kritik olay bildirimi"
        } else if (sourceCount >= 2) {
            "Ana akışa alınma nedeni: Çok kaynaklı kaynak sinyali"
        } else {
            null
        }
    }

    private fun getWarningLabel(
        decision: PublishDecision,
        status: EvidenceStatus,
        quality: TopicQuality,
        isOfficialSource: Boolean
    ): String? {
        if (decision == PublishDecision.PUBLISH_MAIN && status == EvidenceStatus.SINGLE_SOURCE) {
            return if (isOfficialSource) "Tek Kaynak (Resmi Duyuru)" else "Tek kaynak / kaynak sinyali"
        }
        if (status == EvidenceStatus.LOW_CONFIDENCE) {
            return "Bu haberin başlığı çok genel veya belirsiz ifadeler içeriyor."
        }
        return null
    }

    private fun Article.toSourceEvidence() = SourceEvidence(
        sourceName = this.sourceName,
        originalTitle = this.title,
        url = this.originalUrl,
        publishedAt = this.publishedAt,
        imageUrl = this.imageUrl,
        videoUrl = null
    )
}
