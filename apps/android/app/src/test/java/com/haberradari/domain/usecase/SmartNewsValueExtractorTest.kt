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
    fun `fixture 2 - BIST 100 gune yuzde 0,8 dususle 10656 puandan basladi - extracts percent and points`() {
        val title = "BIST 100 güne yüzde 0,8 düşüşle 10.656 puandan başladı"
        val result = SmartNewsValueExtractor.extractKeyFacts(title)

        assertEquals(KeyFactStatus.FOUND, result.status)
        assertTrue(result.factLines.any { it.contains("Oran/Değişim") && it.contains("0,8") })
        assertTrue(result.factLines.any { it.contains("Seviye") && it.contains("10.656") })
    }

    @Test
    fun `fixture 3 - Fed faiz kararini ne zaman aciklayacak - no specific time means MISSING`() {
        val title = "Fed faiz kararını ne zaman açıklayacak?"
        val result = SmartNewsValueExtractor.extractKeyFacts(title)

        assertEquals(KeyFactStatus.MISSING, result.status)
        assertTrue(result.factLines.isEmpty())
    }

    @Test
    fun `fixture 4 - Fed faiz kararini Carsamba TSI 2200 de aciklayacak - extracts time`() {
        val title = "Fed faiz kararını Çarşamba TSİ 22.00’de açıklayacak"
        val result = SmartNewsValueExtractor.extractKeyFacts(title)

        assertEquals(KeyFactStatus.FOUND, result.status)
        assertTrue(result.factLines.any { it.contains("Zaman/Saat") && it.contains("TSİ") && it.contains("22.00") })
    }

    @Test
    fun `yasakli phrase test - does not hallucinate dogrulandi, kesin dogru, yalan haber, kanitlandi`() {
        val title = "BIST 100 güne yüzde 0,8 düşüşle 10.656 puandan başladı"
        val result = SmartNewsValueExtractor.extractKeyFacts(title)

        result.factLines.forEach { line ->
            assertFalse(line.contains("doğrulandı", ignoreCase = true))
            assertFalse(line.contains("kesin doğru", ignoreCase = true))
            assertFalse(line.contains("yalan haber", ignoreCase = true))
            assertFalse(line.contains("kanıtlandı", ignoreCase = true))
        }
    }

    @Test
    fun `raw code leak test - SHOW_MONITORING_THRESHOLD does not show up in key facts`() {
        // The reason code is part of AI logic, but just in case it leaks into summary:
        val title = "Normal title"
        val summary = "Some summary with SHOW_MONITORING_THRESHOLD"
        val result = SmartNewsValueExtractor.extractKeyFacts(title, summary)
        
        result.factLines.forEach { line ->
            assertFalse(line.contains("SHOW_MONITORING_THRESHOLD"))
        }
        assertFalse(result.whatHappened.contains("SHOW_MONITORING_THRESHOLD"))
    }
}
