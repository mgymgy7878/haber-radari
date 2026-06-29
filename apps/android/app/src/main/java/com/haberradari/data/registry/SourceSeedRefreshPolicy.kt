package com.haberradari.data.registry

import com.haberradari.data.model.Source

/**
 * Room seed refresh — registry SSOT metadata güncellemesi (PR #45 borcu).
 *
 * Mevcut kurulumlarda [OnConflictStrategy.IGNORE] nedeniyle güncellenmeyen
 * registry alanları kontrollü şekilde yansıtılır. Kullanıcı `enabled` tercihi korunur.
 */
object SourceSeedRefreshPolicy {

    /** Frozen Android seed binding id'leri — yalnızca bunlar refresh edilir. */
    val REFRESHABLE_SEED_IDS: Set<String> =
        AndroidSeedRegistryDeriver.ANDROID_SEED_RUNTIME_BINDINGS
            .map { it.androidSourceId }
            .toSet()

    /**
     * Registry seed ile mevcut DB satırını birleştirir.
     * Kullanıcı kontrolündeki [Source.enabled] korunur.
     */
    fun mergePreservingUserPreferences(existing: Source, registrySeed: Source): Source {
        require(existing.id == registrySeed.id) {
            "Seed id uyuşmazlığı: ${existing.id} != ${registrySeed.id}"
        }
        require(existing.id in REFRESHABLE_SEED_IDS) {
            "Refresh dışı kaynak: ${existing.id}"
        }
        return registrySeed.copy(enabled = existing.enabled)
    }

    /** Registry metadata alanları mevcut satırdan farklı mı? (enabled hariç) */
    fun needsMetadataRefresh(existing: Source, registrySeed: Source): Boolean {
        val merged = mergePreservingUserPreferences(existing, registrySeed)
        return merged.name != existing.name ||
            merged.feedUrl != existing.feedUrl ||
            merged.legalMode != existing.legalMode ||
            merged.category != existing.category ||
            merged.authorityLevel != existing.authorityLevel
    }
}
