package com.haberradari.ui.feed

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.haberradari.data.model.LegalMode
import com.haberradari.data.model.SourceStats

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SourceManagementScreen(
    viewModel: SourceManagementViewModel,
    onBackClick: () -> Unit,
) {
    val stats by viewModel.sourceStats.collectAsState()
    val activeCount by viewModel.activeIngestCount.collectAsState()
    val totalCount by viewModel.totalSourceCount.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Kaynak Yönetimi") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Geri")
                    }
                },
            )
        },
    ) { padding ->
        when {
            stats.isEmpty() && totalCount == 0 -> {
                SourceManagementEmptyState(modifier = Modifier.padding(padding))
            }
            stats.isEmpty() -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentAlignment = Alignment.Center,
                ) {
                    androidx.compose.material3.CircularProgressIndicator()
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    item(key = "summary") {
                        SourceManagementSummaryBar(
                            activeIngestCount = activeCount,
                            totalSourceCount = totalCount,
                        )
                    }
                    items(stats, key = { it.source.id }) { stat ->
                        SourceManagementCard(
                            stat = stat,
                            onEnabledChange = { enabled ->
                                viewModel.setSourceEnabled(stat.source.id, enabled)
                            },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SourceManagementSummaryBar(
    activeIngestCount: Int,
    totalSourceCount: Int,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
        shape = MaterialTheme.shapes.medium,
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = FeedUsabilityUiLogic.formatActiveSourcesLabel(activeIngestCount, totalSourceCount),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = TrustTransparencyUiLogic.SOURCE_SIGNAL_DISCLAIMER,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun SourceManagementEmptyState(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp),
        ) {
            Text(
                text = "Kaynak bulunamadı",
                style = MaterialTheme.typography.titleMedium,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Varsayılan kaynaklar yüklenene kadar bekleyin veya uygulamayı yeniden başlatın.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
fun SourceManagementCard(
    stat: SourceStats,
    onEnabledChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    val source = stat.source
    val toggleAllowed = SourceManagementUiLogic.isUserToggleAllowed(source.legalMode)
    val healthDetails = SourceManagementUiLogic.buildSourceHealthDetails(stat)
    val isHealthy = SourceManagementUiLogic.isSourceHealthy(stat.health)
    val healthColor = if (isHealthy) Color(0xFF4CAF50) else MaterialTheme.colorScheme.error

    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
        ),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = source.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = "Kategori: ${source.category}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Icon(
                    imageVector = if (isHealthy) Icons.Default.CheckCircle else Icons.Default.Warning,
                    contentDescription = if (isHealthy) "Kaynak sağlığı: iyi" else "Kaynak sağlığı: sorun",
                    tint = healthColor,
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                LegalModeChip(label = SourceManagementUiLogic.legalModeShortLabel(source.legalMode))
                LegalModeChip(label = SourceManagementUiLogic.ingestStatusLabel(source))
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = SourceManagementUiLogic.legalModeDescription(source.legalMode),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = SourceManagementUiLogic.sourceProfileHint(source),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.primary,
            )

            SourceManagementUiLogic.toggleBlockedReason(source.legalMode)?.let { reason ->
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = reason,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.error,
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Surface(
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.5f),
                shape = MaterialTheme.shapes.small,
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = healthDetails.statusMessage,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                    )
                    healthDetails.whyNotInFeed?.let { why ->
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Akış notu: $why",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = healthDetails.articleCountLabel,
                        style = MaterialTheme.typography.labelMedium,
                    )
                    healthDetails.lastSuccessLabel?.let { label ->
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = label,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    healthDetails.lastErrorLabel?.let { label ->
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = label,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }
                    healthDetails.lastErrorSummary?.let { summary ->
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Hata özeti: $summary",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }
                    healthDetails.consecutiveFailuresLabel?.let { label ->
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = label,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = SourceManagementUiLogic.SOURCE_HEALTH_DISCLAIMER,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = if (source.enabled) "Kaynak açık" else "Kaynak kapalı",
                    style = MaterialTheme.typography.bodyMedium,
                )
                Switch(
                    checked = source.enabled,
                    onCheckedChange = onEnabledChange,
                    enabled = toggleAllowed,
                )
            }
        }
    }
}

@Composable
private fun LegalModeChip(label: String) {
    Surface(
        color = MaterialTheme.colorScheme.secondaryContainer,
        shape = MaterialTheme.shapes.small,
    ) {
        Text(
            text = label,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSecondaryContainer,
        )
    }
}
