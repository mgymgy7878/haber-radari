package com.haberradari.ui.feed

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.haberradari.BuildConfig
import com.haberradari.data.model.SmartDigest
import com.haberradari.data.model.SmartDigestConfidence

enum class SmartDigestUiVariant {
    CARD,
    DETAIL
}

@Composable
fun SmartDigestSection(
    digest: SmartDigest?,
    variant: SmartDigestUiVariant,
    modifier: Modifier = Modifier
) {
    if (SmartDigestUiLogic.shouldShowDebugStatusNote(digest, BuildConfig.DEBUG)) {
        Text(
            text = SmartDigestUiLogic.debugStatusLabel(digest!!),
            modifier = modifier.padding(top = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
        )
        return
    }

    if (!SmartDigestUiLogic.shouldShowDigestContent(digest)) return

    val contentDigest = digest!!
    val keyPoints = SmartDigestUiLogic.keyPointsForDisplay(contentDigest)

    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
        ) {
            Surface(
                color = MaterialTheme.colorScheme.primaryContainer,
                shape = MaterialTheme.shapes.small
            ) {
                Text(
                    text = "AI özeti",
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
            Surface(
                color = MaterialTheme.colorScheme.surfaceVariant,
                shape = MaterialTheme.shapes.small
            ) {
                Text(
                    text = "Metadata tabanlıdır",
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            if (BuildConfig.DEBUG) {
                Text(
                    text = "digest: ${contentDigest.status.name}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.outline
                )
            }
        }

        if (variant == SmartDigestUiVariant.DETAIL) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Bu özet haber kaynaklarının metadata alanları üzerinden oluşturulmuştur; orijinal haberin yerine geçmez.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = contentDigest.summary.orEmpty(),
            style = if (variant == SmartDigestUiVariant.DETAIL) {
                MaterialTheme.typography.bodyLarge
            } else {
                MaterialTheme.typography.bodyMedium
            },
            color = MaterialTheme.colorScheme.onSurface,
            maxLines = if (variant == SmartDigestUiVariant.CARD) 4 else Int.MAX_VALUE,
            overflow = TextOverflow.Ellipsis
        )

        if (keyPoints.isNotEmpty()) {
            Spacer(modifier = Modifier.height(8.dp))
            keyPoints.forEach { point ->
                Text(
                    text = "• $point",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = if (variant == SmartDigestUiVariant.CARD) 2 else Int.MAX_VALUE,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }

        if (!contentDigest.whyItMatters.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Neden önemli?",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = contentDigest.whyItMatters,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = if (variant == SmartDigestUiVariant.CARD) 3 else Int.MAX_VALUE,
                overflow = TextOverflow.Ellipsis
            )
        }

        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Güven: ${SmartDigestConfidence.displayLabel(contentDigest.confidence)}",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
