package com.haberradari

import com.haberradari.data.registry.AndroidSeedRegistryDeriver
import com.haberradari.data.registry.SourceRegistryDocument
import com.google.gson.Gson
import com.haberradari.data.model.LegalMode
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/**
 * Android seed — Source Registry SSOT import parity ve legal safety testleri.
 */
class AndroidSeedRegistryDeriverTest {

    private val registryJson: String by lazy {
        val candidates = listOf(
            File("src/main/assets/source-registry-v0.json"),
            File("app/src/main/assets/source-registry-v0.json"),
            File("../../api/src/source-registry/source-registry-v0.json"),
            File("../../../api/src/source-registry/source-registry-v0.json"),
        )
        val file = candidates.firstOrNull { it.exists() }
            ?: error("source-registry-v0.json test için bulunamadı")
        file.readText()
    }

    @Test
    fun `parity seed kaynak sayısı 3`() {
        val seeds = AndroidSeedRegistryDeriver.deriveDefaultSeedsFromRegistryJson(registryJson)
        val registryCount = Gson().fromJson(registryJson, SourceRegistryDocument::class.java).sources.size
        assertEquals(3, seeds.size)
        assertEquals(21, registryCount)
    }

    @Test
    fun `parity snapshot ile id name url category enabled eşleşir`() {
        val seeds = AndroidSeedRegistryDeriver.deriveDefaultSeedsFromRegistryJson(registryJson)
        for (expected in AndroidSeedRegistryDeriver.ANDROID_SEED_PARITY_SNAPSHOT_V0) {
            val source = seeds.find { it.id == expected.androidSourceId }
            assertNotNull("Seed bulunamadı: ${expected.androidSourceId}", source)
            assertEquals(expected.name, source!!.name)
            assertEquals(expected.feedUrl, source.feedUrl)
            assertEquals(expected.category, source.category)
            assertEquals(expected.enabled, source.enabled)
            assertEquals(expected.expectedLegalMode, source.legalMode)
        }
    }

    @Test
    fun `NTV ve Habertürk TITLE_LINK_ONLY`() {
        val seeds = AndroidSeedRegistryDeriver.deriveDefaultSeedsFromRegistryJson(registryJson)
        assertEquals(LegalMode.TITLE_LINK_ONLY, seeds.find { it.id == "ntv-turkiye" }?.legalMode)
        assertEquals(LegalMode.TITLE_LINK_ONLY, seeds.find { it.id == "haberturk" }?.legalMode)
    }

    @Test
    fun `BBC NEEDS_REVIEW production ingest bloklar`() {
        val seeds = AndroidSeedRegistryDeriver.deriveDefaultSeedsFromRegistryJson(registryJson)
        val bbc = seeds.find { it.id == "bbc-turkce" }
        assertNotNull(bbc)
        assertEquals(LegalMode.NEEDS_REVIEW, bbc!!.legalMode)
        assertTrue(bbc.legalMode.blocksProductionIngest())
    }

    @Test
    fun `registry 21 kaynak otomatik seed edilmez`() {
        val seeds = AndroidSeedRegistryDeriver.deriveDefaultSeedsFromRegistryJson(registryJson)
        val runtimeIds = seeds.map { it.id }.toSet()
        assertFalse(runtimeIds.contains("afad_official"))
        assertFalse(runtimeIds.contains("tcmb"))
        assertFalse(runtimeIds.contains("kap"))
        assertFalse(runtimeIds.contains("ntv_son_dakika"))
    }

    @Test
    fun `DISABLED registry kaynağı seed listesine eklenemez`() {
        val disabledJson = registryJson.replace(
            "\"legalMode\": \"TITLE_LINK_ONLY\"",
            "\"legalMode\": \"DISABLED\"",
            ignoreCase = false,
        ).let { replaced ->
            // yalnızca ntv_turkiye bloğunu DISABLED yap
            replaced.replaceFirst(
                "\"sourceId\": \"ntv_turkiye\"",
                "\"sourceId\": \"ntv_turkiye\"",
            ).replace(
                Regex("(\"sourceId\": \"ntv_turkiye\"[\\s\\S]*?)\"legalMode\": \"TITLE_LINK_ONLY\""),
                "$1\"legalMode\": \"DISABLED\"",
            )
        }
        try {
            AndroidSeedRegistryDeriver.deriveDefaultSeedsFromRegistryJson(disabledJson)
            error("DISABLED kaynak için hata bekleniyordu")
        } catch (e: IllegalStateException) {
            assertTrue(e.message!!.contains("DISABLED"))
        }
    }
}
