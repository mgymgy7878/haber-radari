package com.haberradari.config

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/**
 * B5 HTTPS / cleartext hardening — kaynak manifest, NSC ve BuildConfig policy testleri.
 */
class ReleaseNetworkSecurityHardeningTest {

    private fun appModuleFile(relative: String): File {
        val candidates = listOf(
            File("src/$relative"),
            File("app/src/$relative"),
        )
        return candidates.firstOrNull { it.exists() }
            ?: error("Dosya bulunamadı: $relative (cwd=${File(".").absolutePath})")
    }

    private fun appGradleFile(): File {
        val candidates = listOf(
            File("app/build.gradle.kts"),
            File("build.gradle.kts"),
        )
        return candidates.firstOrNull { it.exists() && it.readText().contains("SMART_FEED_BASE_URL") }
            ?: candidates.firstOrNull { it.exists() }
            ?: error("build.gradle.kts bulunamadı")
    }

    @Test
    fun `main manifest cleartext traffic flag removed`() {
        val manifest = appModuleFile("main/AndroidManifest.xml").readText()
        assertFalse(
            "Main manifest usesCleartextTraffic=true içermemeli",
            manifest.contains("usesCleartextTraffic=\"true\""),
        )
        assertTrue(
            "Main manifest networkSecurityConfig referansı olmalı",
            manifest.contains("networkSecurityConfig=\"@xml/network_security_config\""),
        )
    }

    @Test
    fun `main NSC denies cleartext globally`() {
        val nsc = appModuleFile("main/res/xml/network_security_config.xml").readText()
        assertTrue(nsc.contains("cleartextTrafficPermitted=\"false\""))
        assertFalse(nsc.contains("cleartextTrafficPermitted=\"true\""))
    }

    @Test
    fun `debug NSC permits cleartext only for local dev hosts`() {
        val nsc = appModuleFile("debug/res/xml/network_security_config.xml").readText()
        assertTrue(nsc.contains("cleartextTrafficPermitted=\"false\""))
        assertTrue(nsc.contains("<domain-config cleartextTrafficPermitted=\"true\">"))
        assertTrue(nsc.contains("127.0.0.1"))
        assertTrue(nsc.contains("localhost"))
        assertTrue(nsc.contains("10.0.2.2"))
    }

    @Test
    fun `gradle release build config does not hardcode http`() {
        val gradle = appGradleFile().readText()
        assertTrue(gradle.contains("buildConfigField(\"String\", \"SMART_FEED_BASE_URL\""))
        assertTrue(gradle.contains("prodSmartFeedBaseUrl"))
        assertFalse(
            "Release buildType içinde http:// hardcode olmamalı",
            Regex("release\\s*\\{[\\s\\S]*?buildConfigField\\([^)]*http://").containsMatchIn(gradle),
        )
    }

    @Test
    fun `gradle debug build config keeps local http for dev`() {
        val gradle = appGradleFile().readText()
        assertTrue(gradle.contains("http://127.0.0.1:3001"))
    }

    @Test
    fun `FeatureConfig rejects http URL as non-https`() {
        assertFalse(FeatureConfig.isHttpsSmartFeedUrl("http://127.0.0.1:3001"))
        assertTrue(FeatureConfig.isHttpsSmartFeedUrl("https://api.example.com"))
        assertFalse(FeatureConfig.isHttpsSmartFeedUrl(""))
    }

    @Test
    fun `debug BuildConfig smart feed base url is local http`() {
        assertEquals("http://127.0.0.1:3001", com.haberradari.BuildConfig.SMART_FEED_BASE_URL)
        assertTrue(com.haberradari.BuildConfig.DEBUG)
    }
}
