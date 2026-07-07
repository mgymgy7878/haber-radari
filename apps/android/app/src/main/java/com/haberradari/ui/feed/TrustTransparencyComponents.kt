package com.haberradari.ui.feed

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.haberradari.data.model.AiCuratedNewsItem
import com.haberradari.data.model.EvidenceStatus
import com.haberradari.data.model.SmartDigest
import com.haberradari.data.model.SmartDigestStatus
import com.haberradari.data.model.SourceEvidence
import com.haberradari.data.model.SourceSignal
import com.haberradari.data.model.SourceSignalBand
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun DigestStatusChip(
    digest: SmartDigest?,
    modifier: Modifier = Modifier
) {
    val (container, content) = digestChipColors(digest?.status)
    Surface(
        modifier = modifier,
        color = container,
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = TrustTransparencyUiLogic.digestStatusChipLabel(digest),
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = content,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
private fun digestChipColors(status: SmartDigestStatus?): Pair<Color, Color> {
    val scheme = MaterialTheme.colorScheme
    return when (status) {
        SmartDigestStatus.GENERATED, SmartDigestStatus.CACHED ->
            scheme.primaryContainer to scheme.onPrimaryContainer
        SmartDigestStatus.MOCKED ->
            scheme.secondaryContainer to scheme.onSecondaryContainer
        SmartDigestStatus.FAILED ->
            scheme.errorContainer to scheme.onErrorContainer
        SmartDigestStatus.DISABLED, null ->
            scheme.surfaceVariant to scheme.onSurfaceVariant
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TrustEvidenceRow(
    item: AiCuratedNewsItem,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxWidth()) {
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = CuratedSourceLabels.articleSourceSummary(item.sourceCount, item.uniqueSourceCount),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = CuratedSourceLabels.evidenceSummary(item.evidenceStatus, item.uniqueSourceCount),
                style = MaterialTheme.typography.labelSmall,
                color = evidenceColor(item.evidenceStatus),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            if (TrustTransparencyUiLogic.shouldShowSmartDigestBlock(item.publishDecision)) {
                DigestStatusChip(digest = item.smartDigest)
            }
            SourceSignalChip(signal = item.sourceSignal)
        }

        if (TrustTransparencyUiLogic.shouldShowSingleSourceWarning(
                item.uniqueSourceCount,
                item.evidenceStatus
            )
        ) {
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = TrustTransparencyUiLogic.singleSourceWarningText(),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.secondary,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
        }

        if (item.filteredSourceCount > 0) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "${item.filteredSourceCount} zayıf/gürültülü kaynak filtrelendi.",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.error,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }

        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = TrustTransparencyUiLogic.SOURCE_SIGNAL_DISCLAIMER,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 3,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
private fun evidenceColor(status: EvidenceStatus): Color = when (status) {
    EvidenceStatus.CONFIRMED -> Color(0xFF4CAF50)
    EvidenceStatus.PARTIAL -> MaterialTheme.colorScheme.primary
    EvidenceStatus.SINGLE_SOURCE -> MaterialTheme.colorScheme.secondary
    else -> MaterialTheme.colorScheme.onSurfaceVariant
}

@Composable
fun WhyShownSection(
    item: AiCuratedNewsItem,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = "Neden gösteriliyor?",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface
        )
        Spacer(modifier = Modifier.height(8.dp))
        TrustTransparencyUiLogic.whyShownLines(item).forEach { line ->
            WhyShownLineRow(line = line)
        }

        val signalLines = TrustTransparencyUiLogic.sourceSignalWhyShownLines(item.sourceSignal)
        if (signalLines.isNotEmpty()) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Kaynak sinyali",
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(6.dp))
            signalLines.forEach { line ->
                WhyShownLineRow(line = line)
            }
            item.sourceSignal?.disclaimer?.takeIf { it.isNotBlank() }?.let { disclaimer ->
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = disclaimer,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = TrustTransparencyUiLogic.SOURCE_SIGNAL_DISCLAIMER,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun WhyShownLineRow(line: TrustTransparencyUiLogic.WhyShownLine) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = line.label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.width(112.dp),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        Text(
            text = line.value,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.weight(1f),
            maxLines = 4,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
fun SourceSignalChip(
    signal: SourceSignal?,
    modifier: Modifier = Modifier
) {
    if (signal == null) return
    val label = TrustTransparencyUiLogic.sourceSignalFeedChipLabel(signal) ?: return
    val (container, content) = sourceSignalChipColors(signal.scoreBand)
    Surface(
        modifier = modifier,
        color = container,
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = label,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = content,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
private fun sourceSignalChipColors(band: SourceSignalBand): Pair<Color, Color> {
    val scheme = MaterialTheme.colorScheme
    return when (band) {
        SourceSignalBand.HIGH -> scheme.primaryContainer to scheme.onPrimaryContainer
        SourceSignalBand.MEDIUM -> scheme.secondaryContainer to scheme.onSecondaryContainer
        SourceSignalBand.LOW -> scheme.surfaceVariant to scheme.onSurfaceVariant
        SourceSignalBand.UNKNOWN -> scheme.surfaceVariant to scheme.onSurfaceVariant
    }
}

@Composable
fun SourceSignalRow(
    signal: SourceSignal?,
    modifier: Modifier = Modifier
) {
    if (signal == null) return
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = "${signal.label}: ${signal.tierLabel}",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.secondary,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis
        )
        Text(
            text = TrustTransparencyUiLogic.scoreBandShortLabel(signal.scoreBand),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

fun LazyListScope.sourceListSection(
    sources: List<SourceEvidence>,
    onOpenSource: (String) -> Unit
) {
    item {
        Text(
            text = CuratedSourceLabels.detailSourcesHeading(sources.size),
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onSurface
        )
        Spacer(modifier = Modifier.height(8.dp))
    }
    items(sources, key = { "${it.sourceName}:${it.url}:${it.publishedAt}" }) { source ->
        SourceListItemCard(source = source, onOpenSource = onOpenSource)
        Spacer(modifier = Modifier.height(8.dp))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SourceListItemCard(
    source: SourceEvidence,
    onOpenSource: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = source.sourceName,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            SourceSignalRow(
                signal = source.sourceSignal,
                modifier = Modifier.padding(top = 4.dp)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = source.originalTitle,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(4.dp))
            val dateStr = SimpleDateFormat("dd MMM HH:mm", Locale("tr"))
                .format(Date(source.publishedAt))
            Text(
                text = dateStr,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(12.dp))
            OutlinedButton(
                onClick = { onOpenSource(source.url) },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = null
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Orijinal kaynağa git", letterSpacing = 0.sp)
            }
        }
    }
}
