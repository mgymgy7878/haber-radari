package com.haberradari.domain.policy

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class EarthquakeMagnitudePolicyTest {

    @Test
    fun `M 5_0 region parses and passes threshold`() {
        assertEquals(5.0, EarthquakeMagnitudePolicy.parseMagnitude("M 5.0 - region")!!, 0.001)
        val decision = EarthquakeMagnitudePolicy.evaluateMainFeedEligibility(
            title = "M 5.0 - region",
            category = "afet",
            sourceNames = listOf("USGS Earthquakes"),
        )
        assertTrue(decision is EarthquakeMagnitudePolicy.MainFeedEligibility.Eligible)
    }

    @Test
    fun `M 4_9 region is below threshold`() {
        assertEquals(4.9, EarthquakeMagnitudePolicy.parseMagnitude("M 4.9 - region")!!, 0.001)
        val decision = EarthquakeMagnitudePolicy.evaluateMainFeedEligibility(
            title = "M 4.9 - region",
            sourceNames = listOf("USGS Earthquakes"),
        )
        assertEquals(
            EarthquakeMagnitudePolicy.REASON_MAGNITUDE_BELOW_THRESHOLD,
            (decision as EarthquakeMagnitudePolicy.MainFeedEligibility.WatchlistOnly).reasonCode,
        )
    }

    @Test
    fun `Mw 5 comma 2 parses with comma decimal`() {
        assertEquals(5.2, EarthquakeMagnitudePolicy.parseMagnitude("Mw 5,2")!!, 0.001)
        val decision = EarthquakeMagnitudePolicy.evaluateMainFeedEligibility(
            title = "Mw 5,2",
            category = "afet",
        )
        assertTrue(decision is EarthquakeMagnitudePolicy.MainFeedEligibility.Eligible)
    }

    @Test
    fun `Turkish 5_1 buyuklugunde deprem passes`() {
        assertEquals(5.1, EarthquakeMagnitudePolicy.parseMagnitude("5,1 büyüklüğünde deprem")!!, 0.001)
        val decision = EarthquakeMagnitudePolicy.evaluateMainFeedEligibility(
            title = "5,1 büyüklüğünde deprem",
            sourceNames = listOf("AFAD"),
        )
        assertTrue(decision is EarthquakeMagnitudePolicy.MainFeedEligibility.Eligible)
    }

    @Test
    fun `Turkish 4_8 buyuklugunde deprem is below threshold`() {
        assertEquals(4.8, EarthquakeMagnitudePolicy.parseMagnitude("4.8 büyüklüğünde deprem")!!, 0.001)
        val decision = EarthquakeMagnitudePolicy.evaluateMainFeedEligibility(
            title = "4.8 büyüklüğünde deprem",
        )
        assertEquals(
            EarthquakeMagnitudePolicy.REASON_MAGNITUDE_BELOW_THRESHOLD,
            (decision as EarthquakeMagnitudePolicy.MainFeedEligibility.WatchlistOnly).reasonCode,
        )
    }

    @Test
    fun `clickbait deprem question has unknown magnitude`() {
        assertNull(EarthquakeMagnitudePolicy.parseMagnitude("Son dakika deprem mi oldu?"))
        val decision = EarthquakeMagnitudePolicy.evaluateMainFeedEligibility(
            title = "Son dakika deprem mi oldu?",
            sourceNames = listOf("NTV"),
        )
        assertEquals(
            EarthquakeMagnitudePolicy.REASON_MAGNITUDE_UNKNOWN,
            (decision as EarthquakeMagnitudePolicy.MainFeedEligibility.WatchlistOnly).reasonCode,
        )
    }

    @Test
    fun `USGS M 0_6 is below threshold`() {
        val decision = EarthquakeMagnitudePolicy.evaluateMainFeedEligibility(
            title = "M 0.6 - 22 km N of Borrego Springs, CA",
            sourceNames = listOf("USGS Earthquakes"),
        )
        assertEquals(
            EarthquakeMagnitudePolicy.REASON_MAGNITUDE_BELOW_THRESHOLD,
            (decision as EarthquakeMagnitudePolicy.MainFeedEligibility.WatchlistOnly).reasonCode,
        )
    }

    @Test
    fun `non earthquake general news stays eligible`() {
        val decision = EarthquakeMagnitudePolicy.evaluateMainFeedEligibility(
            title = "Merkez Bankası faiz kararını açıkladı",
            category = "ekonomi",
            sourceNames = listOf("Reuters"),
        )
        assertTrue(decision is EarthquakeMagnitudePolicy.MainFeedEligibility.Eligible)
    }

    @Test
    fun `PUBLIC_SAFETY_EXCEPTION bypasses threshold`() {
        val decision = EarthquakeMagnitudePolicy.evaluateMainFeedEligibility(
            title = "Tsunami uyarısı yayımlandı",
            category = "afet",
            existingReasonCode = EarthquakeMagnitudePolicy.REASON_PUBLIC_SAFETY_EXCEPTION,
        )
        assertTrue(decision is EarthquakeMagnitudePolicy.MainFeedEligibility.Eligible)
    }

    @Test
    fun `magnitude keyword form parses`() {
        assertEquals(5.4, EarthquakeMagnitudePolicy.parseMagnitude("magnitude 5.4 near coast")!!, 0.001)
    }

    @Test
    fun `isEarthquakeSignal detects USGS source name`() {
        assertTrue(
            EarthquakeMagnitudePolicy.isEarthquakeSignal(
                title = "Event update",
                sourceNames = listOf("USGS Earthquakes"),
            ),
        )
    }

    @Test
    fun `non earthquake title is not earthquake signal`() {
        assertFalse(
            EarthquakeMagnitudePolicy.isEarthquakeSignal(
                title = "Borsa günü yükselişle kapandı",
                sourceNames = listOf("Bloomberg"),
            ),
        )
    }
}
