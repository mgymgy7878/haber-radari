package com.haberradari.ui.feed

import com.haberradari.data.model.SmartDigest
import com.haberradari.data.model.SmartDigestStatus

object SmartDigestUiLogic {
    const val MAX_KEY_POINTS = 3

    private val visibleStatuses = setOf(
        SmartDigestStatus.MOCKED,
        SmartDigestStatus.CACHED,
        SmartDigestStatus.GENERATED
    )

    fun shouldShowDigestContent(digest: SmartDigest?): Boolean {
        if (digest == null) return false
        if (digest.status !in visibleStatuses) return false
        return !digest.summary.isNullOrBlank()
    }

    fun keyPointsForDisplay(digest: SmartDigest?): List<String> {
        if (!shouldShowDigestContent(digest)) return emptyList()
        return digest!!.keyPoints.take(MAX_KEY_POINTS)
    }

    fun shouldShowDebugStatusNote(digest: SmartDigest?, isDebugBuild: Boolean): Boolean {
        if (!isDebugBuild || digest == null) return false
        return digest.status == SmartDigestStatus.DISABLED ||
            digest.status == SmartDigestStatus.FAILED
    }

    fun debugStatusLabel(digest: SmartDigest): String = when (digest.status) {
        SmartDigestStatus.DISABLED -> "Digest kapalı"
        SmartDigestStatus.FAILED -> "Digest üretilemedi"
        else -> "digest: ${digest.status.name}"
    }
}
