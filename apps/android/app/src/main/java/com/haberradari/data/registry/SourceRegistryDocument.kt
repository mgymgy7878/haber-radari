package com.haberradari.data.registry

/**
 * Source Registry SSOT v0 — minimal JSON model (Android seed import).
 * Canonical dosya: apps/api/src/source-registry/source-registry-v0.json
 */
data class SourceRegistryDocument(
    val version: String,
    val readOnly: Boolean,
    val disclaimer: String,
    val sources: List<SourceRegistryEntryJson>,
)

data class SourceRegistryEntryJson(
    val sourceId: String,
    val sourceName: String,
    val baseDomain: String,
    val feedUrl: String? = null,
    val country: String? = null,
    val language: String? = null,
    val category: String? = null,
    val legalMode: String,
    val authorityTier: String? = null,
    val reviewStatus: String? = null,
    val publishEligible: Boolean = false,
)
