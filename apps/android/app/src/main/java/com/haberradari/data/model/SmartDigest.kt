package com.haberradari.data.model

enum class SmartDigestStatus {
    DISABLED,
    MOCKED,
    CACHED,
    GENERATED,
    FAILED;

    companion object {
        fun fromRaw(value: String?): SmartDigestStatus? {
            if (value.isNullOrBlank()) return null
            return runCatching { valueOf(value.uppercase()) }.getOrNull()
        }
    }
}

enum class SmartDigestConfidence {
    LOW,
    MEDIUM,
    HIGH;

    companion object {
        fun fromRaw(value: String?): SmartDigestConfidence? {
            if (value.isNullOrBlank()) return null
            return runCatching { valueOf(value.uppercase()) }.getOrNull()
        }

        fun displayLabel(confidence: SmartDigestConfidence): String = when (confidence) {
            LOW -> "düşük"
            MEDIUM -> "orta"
            HIGH -> "yüksek"
        }
    }
}

enum class SmartDigestModelProvider {
    MOCK,
    DISABLED,
    EXTERNAL;

    companion object {
        fun fromRaw(value: String?): SmartDigestModelProvider? {
            if (value.isNullOrBlank()) return null
            return runCatching { valueOf(value.uppercase()) }.getOrNull()
        }
    }
}

data class SmartDigest(
    val status: SmartDigestStatus,
    val summary: String?,
    val keyPoints: List<String>,
    val whyItMatters: String?,
    val confidence: SmartDigestConfidence,
    val sourcePolicy: String,
    val modelProvider: SmartDigestModelProvider,
    val cacheKey: String,
    val generatedAt: String?,
    val errorCode: String? = null
)
