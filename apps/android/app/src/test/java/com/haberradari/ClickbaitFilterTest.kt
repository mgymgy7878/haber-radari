package com.haberradari

import com.haberradari.data.remote.ClickbaitFilter
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ClickbaitFilterTest {

    @Test
    fun testClickbaitTitles_areFiltered() {
        val clickbaitTitles = listOf(
            "Son dakika deprem mi oldu?",
            "Deprem mi oldu",
            "Marmara'da deprem mi oldu?",
            "Nerede deprem oldu",
            "Az once deprem mi oldu?",
            "Neden oldu",
            "Unlu oyuncu neden ayrildi?",
            "Asgari ucret ne kadar oldu?",
            "Asgari ucret belli oldu mu?",
            "EYT ne zaman yatacak?",
            "Mac hangi kanalda?",
            "Saat kacta?",
            "Kimdir?",
            "Okan Buruk kimdir?",
            "Gorenleri soke eden anlar!",
            "Herkesi sasirtti",
            "Oyle bir sey dedi ki...",
            "Inanamayacaksiniz",
            "Bu nedir?"
        )

        for (title in clickbaitTitles) {
            assertTrue("Expected title to be clickbait: title", ClickbaitFilter.isClickbait(title))
        }
    }

    @Test
    fun testNormalTitles_areNotFiltered() {
        val normalTitles = listOf(
            "Izmir'de 4.5 siddetinde deprem meydana geldi",
            "Asgari ucret 17 bin TL olarak aciklandi",
            "Meteoroloji'den 5 il icin sari kodlu uyari",
            "Galatasaray, Fenerbahce'yi 3-1 yendi",
            "Borsada gunun kazandiran hisseleri",
            "Yeni vergi paketi meclisten gecti",
            "Deprem uzmanindan Istanbul uyarisi: Fay hatti gerildi"
        )

        for (title in normalTitles) {
            assertFalse("Expected title to NOT be clickbait: title", ClickbaitFilter.isClickbait(title))
        }
    }

    @Test
    fun testEmptyOrBlankTitles() {
        assertFalse(ClickbaitFilter.isClickbait(""))
        assertFalse(ClickbaitFilter.isClickbait("   "))
    }
}