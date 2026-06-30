package com.haberradari.data.registry

import android.content.Context
import com.google.gson.Gson
import com.haberradari.data.model.LegalMode
import com.haberradari.data.model.Source
import com.haberradari.data.model.SourceAuthority

/**
 * Android seed — Source Registry SSOT türetimi (parity v0).
 *
 * Registry’deki 21 kaynak otomatik seed edilmez; yalnızca [ANDROID_SEED_RUNTIME_BINDINGS].
 * `publishEligible` tek başına enable kriteri değildir — [ANDROID_SEED_RUNTIME_ENABLE_V0] kullanılır.
 */
object AndroidSeedRegistryDeriver {

    const val REGISTRY_ASSET_PATH = "source-registry-v0.json"

    data class AndroidSeedBinding(
        val androidSourceId: String,
        val registrySourceId: String,
    )

    /** Frozen Android seed parity listesi — binding listesindeki kaynaklar seed edilir (v0: 3). */
    val ANDROID_SEED_RUNTIME_BINDINGS: List<AndroidSeedBinding> = listOf(
        AndroidSeedBinding(androidSourceId = "ntv-turkiye", registrySourceId = "ntv_turkiye"),
        AndroidSeedBinding(androidSourceId = "bbc-turkce", registrySourceId = "bbc_turkce"),
        AndroidSeedBinding(androidSourceId = "haberturk", registrySourceId = "haberturk"),
    )

    /**
     * PR #59 audit: feedUrl 404 — binding geçici kaldırıldı.
     * Mevcut kurulumlarda kalan satırlar seed refresh'te kapatılır (registry kaydı kalır).
     */
    val ANDROID_SEED_RETIRED_RUNTIME_IDS_V0: Set<String> = setOf(
        "afad-official",
    )

    /**
     * Runtime seed enable matrisi — `publishEligible` DEĞİL.
     * Kaynak DB’de görünür; NEEDS_REVIEW/DISABLED fetch DAO/parser tarafından bloklanır.
     */
    val ANDROID_SEED_RUNTIME_ENABLE_V0: Map<String, Boolean> = mapOf(
        "ntv-turkiye" to true,
        "bbc-turkce" to true,
        "haberturk" to true,
    )

    /** Kategori parity — registry Title case, Android seed lowercase Türkçe. */
    val ANDROID_SEED_CATEGORY_OVERRIDES_V0: Map<String, String> = mapOf(
        "ntv-turkiye" to "türkiye",
        "bbc-turkce" to "dünya",
        "haberturk" to "genel",
    )

    /** Pre-migration parity referansı (id/name/url/category/enabled); legalMode registry’den gelir. */
    val ANDROID_SEED_PARITY_SNAPSHOT_V0: List<SeedParityExpectation> = listOf(
        SeedParityExpectation(
            androidSourceId = "ntv-turkiye",
            registrySourceId = "ntv_turkiye",
            name = "NTV Türkiye",
            feedUrl = "https://www.ntv.com.tr/turkiye.rss",
            category = "türkiye",
            enabled = true,
            expectedLegalMode = LegalMode.TITLE_LINK_ONLY,
        ),
        SeedParityExpectation(
            androidSourceId = "bbc-turkce",
            registrySourceId = "bbc_turkce",
            name = "BBC Türkçe",
            feedUrl = "https://feeds.bbci.co.uk/turkce/rss.xml",
            category = "dünya",
            enabled = true,
            expectedLegalMode = LegalMode.NEEDS_REVIEW,
        ),
        SeedParityExpectation(
            androidSourceId = "haberturk",
            registrySourceId = "haberturk",
            name = "Habertürk",
            feedUrl = "https://www.haberturk.com/rss",
            category = "genel",
            enabled = true,
            expectedLegalMode = LegalMode.TITLE_LINK_ONLY,
        ),
    )

    data class SeedParityExpectation(
        val androidSourceId: String,
        val registrySourceId: String,
        val name: String,
        val feedUrl: String,
        val category: String,
        val enabled: Boolean,
        val expectedLegalMode: LegalMode,
        val expectedAuthorityLevel: SourceAuthority = SourceAuthority.GENERAL_MEDIA,
    )

    private val gson = Gson()

    fun deriveDefaultSeeds(context: Context): List<Source> {
        val json = context.assets.open(REGISTRY_ASSET_PATH).bufferedReader().use { it.readText() }
        return deriveDefaultSeedsFromRegistryJson(json)
    }

    fun deriveDefaultSeedsFromRegistryJson(json: String): List<Source> {
        val document = gson.fromJson(json, SourceRegistryDocument::class.java)
        require(document.version == "v0") { "Beklenmeyen registry sürümü: ${document.version}" }
        val byId = document.sources.associateBy { it.sourceId }

        return ANDROID_SEED_RUNTIME_BINDINGS.map { binding ->
            val entry = byId[binding.registrySourceId]
                ?: error("Registry SSOT kaydı eksik: ${binding.registrySourceId}")
            val legalMode = mapRegistryLegalMode(entry.legalMode)
            assertSeedLegalSafety(binding.androidSourceId, legalMode)

            val feedUrl = entry.feedUrl?.trim().orEmpty()
            require(feedUrl.isNotEmpty()) { "feedUrl eksik: ${binding.registrySourceId}" }

            val enabled = ANDROID_SEED_RUNTIME_ENABLE_V0[binding.androidSourceId]
                ?: error("Enable matrisi eksik: ${binding.androidSourceId}")

            Source(
                id = binding.androidSourceId,
                name = entry.sourceName,
                feedUrl = feedUrl,
                legalMode = legalMode,
                enabled = enabled,
                category = ANDROID_SEED_CATEGORY_OVERRIDES_V0[binding.androidSourceId]
                    ?: entry.category?.lowercase() ?: "genel",
                authorityLevel = mapAuthorityTier(entry.authorityTier),
            )
        }
    }

    fun mapRegistryLegalMode(mode: String): LegalMode = when (mode) {
        "DISABLED" -> LegalMode.DISABLED
        "NEEDS_REVIEW" -> LegalMode.NEEDS_REVIEW
        "TITLE_LINK_ONLY" -> LegalMode.TITLE_LINK_ONLY
        "RSS_METADATA_ONLY" -> LegalMode.RSS_METADATA_ONLY
        "LICENSED" -> LegalMode.LICENSED
        else -> error("Geçersiz registry legalMode: $mode")
    }

    private fun mapAuthorityTier(tier: String?): SourceAuthority = when (tier) {
        "OFFICIAL" -> SourceAuthority.OFFICIAL_PRIMARY
        else -> SourceAuthority.GENERAL_MEDIA
    }

    private fun assertSeedLegalSafety(androidSourceId: String, legalMode: LegalMode) {
        if (legalMode == LegalMode.DISABLED) {
            error("DISABLED kaynak Android seed parity listesinde olamaz: $androidSourceId")
        }
    }
}
