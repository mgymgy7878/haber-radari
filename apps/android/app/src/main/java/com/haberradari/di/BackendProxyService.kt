package com.haberradari.di

/**
 * Backend proxy arayüzü — v1'de implemente edilecek.
 *
 * LLM API key'leri bu servis üzerinden yönlendirilecek;
 * mobil istemciye API key gömülmeyecek.
 *
 * ADR kararı: API anahtarları istemci koduna (APK) gömülmez.
 * Kolayca decompile edilebilir olduğundan backend proxy zorunludur.
 *
 * TODO: Supabase Edge Functions veya Firebase Cloud Functions implementasyonu
 * TODO: Rate limiting ve cache katmanı
 */
interface BackendProxyService {
    /**
     * Makale URL'si için AI özet üretir.
     * v0'da implementasyonu yoktur — null döner.
     *
     * @param articleUrl Özetlenecek makalenin orijinal URL'si
     * @return AI özet metni veya null
     */
    suspend fun summarize(articleUrl: String): String?

    /**
     * Clickbait skor hesaplar.
     * v0'da implementasyonu yoktur — null döner.
     *
     * @param title Haber başlığı
     * @return 0.0–1.0 arası clickbait skoru veya null
     */
    suspend fun getClickbaitScore(title: String): Float?
}

/**
 * v0 stub implementasyonu — hiçbir şey yapmaz.
 * Backend proxy kurulana kadar kullanılır.
 */
class NoOpBackendProxy : BackendProxyService {
    override suspend fun summarize(articleUrl: String): String? = null
    override suspend fun getClickbaitScore(title: String): Float? = null
}
