package com.haberradari.domain.usecase

import org.junit.Assert.*
import org.junit.Test

class SmartNewsValueExtractorTest {

    @Test
    fun `fixture 1 - borsa gune dususle basladi - no numbers means MISSING`() {
        val title = "Borsa güne düşüşle başladı"
        val result = SmartNewsValueExtractor.extractKeyFacts(title)

        assertEquals(KeyFactStatus.MISSING, result.status)
        assertTrue("Fact lines should be empty so we don't invent numbers", result.factLines.isEmpty())
        assertEquals(title, result.whatHappened)
    }

    @Test
    fun `fixture 2 - BIST 100 gune yuzde 0,8 dususle 10656 puandan basladi`() {
        val title = "BIST 100 güne yüzde 0,8 düşüşle 10.656 puandan başladı"
        val result = SmartNewsValueExtractor.extractKeyFacts(title)

        assertEquals(KeyFactStatus.FOUND, result.status)
        assertTrue(result.factLines.any { it.contains("Oran/Değişim") && it.contains("0,8") })
        assertTrue(result.factLines.any { it.contains("Seviye") && it.contains("10.656") })
        assertFalse("Should not hallucinate time from level", result.factLines.any { it.contains("Zaman/Saat") })
    }

    @Test
    fun `fixture 3 - BIST 100 endeksi 10742 puandan 10656 puana geriledi`() {
        val title = "BIST 100 endeksi 10.742 puandan 10.656 puana geriledi"
        val result = SmartNewsValueExtractor.extractKeyFacts(title)

        assertEquals(KeyFactStatus.FOUND, result.status)
        assertTrue(result.factLines.any { it.contains("Seviye") && it.contains("10.742") })
        assertFalse("Should not extract time", result.factLines.any { it.contains("Zaman/Saat") })
    }

    @Test
    fun `fixture 4 - Fed faiz kararini Carsamba TSI 2200 de aciklayacak`() {
        val title = "Fed faiz kararını Çarşamba TSİ 22.00’de açıklayacak"
        val result = SmartNewsValueExtractor.extractKeyFacts(title)

        assertEquals(KeyFactStatus.FOUND, result.status)
        assertTrue(result.factLines.any { it.contains("Zaman/Saat") && it.contains("TSİ") && it.contains("22.00") })
    }

    @Test
    fun `fixture 5 - Fed faiz karari saat 2100 de aciklanacak`() {
        val title = "Fed faiz kararı saat 21:00’de açıklanacak"
        val result = SmartNewsValueExtractor.extractKeyFacts(title)

        assertEquals(KeyFactStatus.FOUND, result.status)
        assertTrue(result.factLines.any { it.contains("Zaman/Saat") && it.contains("21:00") })
    }

    @Test
    fun `fixture 6 - Fed faiz kararini ne zaman aciklayacak`() {
        val title = "Fed faiz kararını ne zaman açıklayacak?"
        val result = SmartNewsValueExtractor.extractKeyFacts(title)

        assertEquals(KeyFactStatus.MISSING, result.status)
        assertTrue(result.factLines.isEmpty())
    }

    @Test
    fun `fixture 7 - Bitcoin yuzde 2,4 dususle 65200 dolara geriledi`() {
        val title = "Bitcoin yüzde 2,4 düşüşle 65.200 dolara geriledi"
        val result = SmartNewsValueExtractor.extractKeyFacts(title)

        assertEquals(KeyFactStatus.FOUND, result.status)
        assertTrue(result.factLines.any { it.contains("Oran/Değişim") && it.contains("2,4") })
        assertFalse("Should not extract time", result.factLines.any { it.contains("Zaman/Saat") })
    }

    @Test
    fun `raw code leak test - SHOW_MONITORING_THRESHOLD does not show up in key facts`() {
        val title = "Normal title"
        val summary = "Some summary with SHOW_MONITORING_THRESHOLD"
        val result = SmartNewsValueExtractor.extractKeyFacts(title, summary)
        
        result.factLines.forEach { line ->
            assertFalse(line.contains("SHOW_MONITORING_THRESHOLD"))
        }
        assertFalse(result.whatHappened.contains("SHOW_MONITORING_THRESHOLD"))
    }
}
