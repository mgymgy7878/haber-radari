package com.haberradari.ui.feed

/**
 * Bireysel APK feed kullanılabilirliği — saf UI durum mantığı (test edilebilir).
 */
object FeedUsabilityUiLogic {

    enum class FeedEmptyKind {
        /** Gösterilecek içerik var veya yükleme devam ediyor. */
        NONE,
        /** Kaynak var ama hiçbiri ingest için açık değil. */
        NO_ENABLED_SOURCES,
        /** Aktif kaynak var ama haber/akış boş. */
        NO_NEWS,
    }

    enum class FeedConnectionStatus {
        LIVE,
        CACHED,
        ERROR_WITH_CACHE,
        ERROR,
        REFRESHING,
    }

    fun resolveEmptyKind(state: FeedUiState): FeedEmptyKind {
        if (state.hasVisibleBodyItems()) return FeedEmptyKind.NONE
        if (state.isInitialLoading || state.isRemoteLoading || state.isReadingCache) {
            return FeedEmptyKind.NONE
        }
        if (state.totalSourceCount > 0 && state.enabledSourceCount == 0) {
            return FeedEmptyKind.NO_ENABLED_SOURCES
        }
        if (state.enabledSourceCount > 0 || state.totalSourceCount > 0) {
            return FeedEmptyKind.NO_NEWS
        }
        return FeedEmptyKind.NO_NEWS
    }

    fun resolveConnectionStatus(state: FeedUiState, isRefreshing: Boolean): FeedConnectionStatus {
        if (isRefreshing || state.isRemoteLoading) return FeedConnectionStatus.REFRESHING
        if (state.lastError != null && state.isShowingCachedData) return FeedConnectionStatus.ERROR_WITH_CACHE
        if (state.lastError != null) return FeedConnectionStatus.ERROR
        if (state.isShowingCachedData) return FeedConnectionStatus.CACHED
        return FeedConnectionStatus.LIVE
    }

    fun formatLastUpdatedText(lastUpdatedAt: Long?, cacheAgeText: String?, nowMillis: Long = System.currentTimeMillis()): String {
        cacheAgeText?.takeIf { it.isNotBlank() }?.let { return it }
        lastUpdatedAt?.let { return formatRelativeTimeMs(it, nowMillis) }
        return "Henüz güncellenmedi"
    }

    fun formatConnectionStatusLabel(status: FeedConnectionStatus): String = when (status) {
        FeedConnectionStatus.LIVE -> "Canlı akış"
        FeedConnectionStatus.CACHED -> "Önbellekten gösteriliyor"
        FeedConnectionStatus.ERROR_WITH_CACHE -> "Bağlantı hatası — önbellek"
        FeedConnectionStatus.ERROR -> "Bağlantı hatası"
        FeedConnectionStatus.REFRESHING -> "Yenileniyor…"
    }

    fun formatActiveSourcesLabel(enabledCount: Int, totalCount: Int): String =
        when {
            totalCount == 0 -> "Kaynak yükleniyor…"
            enabledCount == 0 -> "Aktif kaynak yok ($totalCount kayıtlı)"
            enabledCount == totalCount -> "$enabledCount aktif kaynak"
            else -> "$enabledCount aktif / $totalCount kaynak"
        }

    fun emptyStateTitle(kind: FeedEmptyKind): String = when (kind) {
        FeedEmptyKind.NONE -> ""
        FeedEmptyKind.NO_ENABLED_SOURCES -> "Aktif kaynak yok"
        FeedEmptyKind.NO_NEWS -> "Henüz haber yok"
    }

    fun emptyStateMessage(kind: FeedEmptyKind): String = when (kind) {
        FeedEmptyKind.NONE -> ""
        FeedEmptyKind.NO_ENABLED_SOURCES ->
            "Tüm kaynaklar kapalı veya inceleme bekliyor. Kaynak Sağlığı ekranından kaynakları yönetebilirsiniz."
        FeedEmptyKind.NO_NEWS ->
            "Aktif kaynaklar tarandı ancak gösterilecek haber bulunamadı. Yenilemeyi deneyin."
    }

    fun formatRelativeTimeMs(epochMillis: Long, nowMillis: Long = System.currentTimeMillis()): String {
        val diff = nowMillis - epochMillis
        if (diff < 0) return "Az önce"
        return when {
            diff < 60_000 -> "Az önce güncellendi"
            diff < 3_600_000 -> "${diff / 60_000} dk önce güncellendi"
            diff < 86_400_000 -> "${diff / 3_600_000} saat önce güncellendi"
            diff < 604_800_000 -> "${diff / 86_400_000} gün önce güncellendi"
            else -> "${diff / 604_800_000} hafta önce güncellendi"
        }
    }

    fun formatPublishedAtLabel(publishedAt: String?, nowMillis: Long = System.currentTimeMillis()): String? {
        val ms = publishedAt?.toLongOrNull() ?: return null
        val diff = nowMillis - ms
        if (diff < 0) return "Az önce"
        return when {
            diff < 60_000 -> "Az önce"
            diff < 3_600_000 -> "${diff / 60_000} dk önce"
            diff < 86_400_000 -> "${diff / 3_600_000} saat önce"
            diff < 604_800_000 -> "${diff / 86_400_000} gün önce"
            else -> "${diff / 604_800_000} hafta önce"
        }
    }
}
