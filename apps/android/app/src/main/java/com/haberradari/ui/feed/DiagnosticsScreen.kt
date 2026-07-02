package com.haberradari.ui.feed

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.haberradari.data.model.LegalMode
import com.haberradari.data.model.SourceStats
import com.haberradari.domain.policy.EarthquakeMagnitudePolicy
import com.haberradari.domain.repository.WatchlistPreviewItem
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiagnosticsScreen(
    viewModel: DiagnosticsViewModel,
    onBackClick: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Kaynak ve Gate Tanılama") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Geri")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                DiagnosticsWarningSection()
            }

            item {
                SourceSummarySection(state)
            }

            item {
                Text(
                    text = "Kaynak Durumları",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            items(state.sourceStats, key = { it.source.id }) { stat ->
                DiagnosticSourceCard(stat)
            }

            item {
                Text(
                    text = "Son Gate / Karar Özetleri",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            if (state.recentDecisions.isEmpty()) {
                item {
                    Text(
                        text = "Henüz karar kaydı yok.",
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }
            } else {
                items(state.recentDecisions, key = { it.id }) { item ->
                    GateDecisionCard(item)
                }
            }
        }
    }
}

@Composable
private fun DiagnosticsWarningSection() {
    Surface(
        color = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.4f),
        shape = MaterialTheme.shapes.medium,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = "DİKKAT: Metadata-only Sınırı",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.error,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Bu ekran yalnızca kaynak sinyali ve metadata gösterir. Full text, body, raw HTML, görsel/caption gösterilmez.",
                style = MaterialTheme.typography.bodySmall
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Bu sinyal haberin doğruluğunu tek başına garanti etmez.",
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
private fun SourceSummarySection(state: DiagnosticsUiState) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Kaynak Özeti",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                SummaryItem("Toplam", state.totalSources.toString())
                SummaryItem("Aktif", state.activeSources.toString())
                SummaryItem("Kapalı", state.disabledSources.toString())
                SummaryItem("İnceleme", state.needsReviewSources.toString())
            }
            if (state.lastRefreshAt != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Son yenileme: ${formatTime(state.lastRefreshAt)} (${if (state.isCache) "Cache" else "Canlı"})",
                    style = MaterialTheme.typography.labelSmall
                )
            }
        }
    }
}

@Composable
private fun SummaryItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Text(text = label, style = MaterialTheme.typography.labelSmall)
    }
}

@Composable
private fun DiagnosticSourceCard(stat: SourceStats) {
    val source = stat.source
    val health = stat.health
    val isEligible = !source.legalMode.blocksProductionIngest() && source.enabled

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = source.name,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f)
                )
                StatusChip(
                    label = if (isEligible) "ELIGIBLE" else "INELIGIBLE",
                    containerColor = if (isEligible) Color(0xFF4CAF50) else MaterialTheme.colorScheme.error
                )
            }
            Text(text = "ID: ${source.id}", style = MaterialTheme.typography.labelSmall)
            Spacer(modifier = Modifier.height(8.dp))
            
            DiagnosticField("Legal Mode", SourceManagementUiLogic.legalModeShortLabel(source.legalMode))
            DiagnosticField("Authority", source.authorityLevel.name)
            DiagnosticField("Enabled", source.enabled.toString())
            
            Spacer(modifier = Modifier.height(8.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f))
            Spacer(modifier = Modifier.height(8.dp))
            
            val allowedFields = when(source.legalMode) {
                LegalMode.TITLE_LINK_ONLY -> "title, url, date"
                else -> "title, url, date, description"
            }
            DiagnosticField("Allowed", allowedFields)
            DiagnosticField("Forbidden", "body, fullText, html, images")
            
            if (health != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Fetch: ${if (health.consecutiveFailures == 0) "OK" else "FAIL (${health.consecutiveFailures})"}",
                    style = MaterialTheme.typography.labelSmall,
                    color = if (health.consecutiveFailures == 0) Color(0xFF4CAF50) else MaterialTheme.colorScheme.error
                )
            }
        }
    }
}

@Composable
private fun GateDecisionCard(item: WatchlistPreviewItem) {
    val isEarthquake = EarthquakeMagnitudePolicy.isEarthquakeSignal(item.title, item.category, item.sourceNames.orEmpty())
    val magnitude = EarthquakeMagnitudePolicy.parseMagnitude(item.title)
    val isMainFeed = item.publishDecision == "PUBLISH_MAIN"
    val isLatest = item.publishDecision == "LATEST_RSS" || item.reasonCode == "LOCAL_ANDROID_INGEST"

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = item.title,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Medium,
                maxLines = 1
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusChip(item.publishDecision, MaterialTheme.colorScheme.secondaryContainer)
                if (item.reasonCode != null) {
                    StatusChip(item.reasonCode, MaterialTheme.colorScheme.tertiaryContainer)
                }
            }
            
            if (isEarthquake) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Info, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Deprem Sinyali | M: ${magnitude ?: "Unknown"} | Eşik: M≥${EarthquakeMagnitudePolicy.EARTHQUAKE_MAIN_FEED_MIN_MAGNITUDE}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(text = "Main Feed: ${if (isMainFeed) "EVET" else "HAYIR"}", style = MaterialTheme.typography.labelSmall)
                Text(text = "Son Haberler: ${if (isLatest) "EVET" else "HAYIR"}", style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}

@Composable
private fun DiagnosticField(label: String, value: String) {
    Row {
        Text(text = "$label: ", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
        Text(text = value, style = MaterialTheme.typography.labelSmall)
    }
}

@Composable
private fun StatusChip(label: String, containerColor: Color) {
    Surface(
        color = containerColor,
        shape = MaterialTheme.shapes.extraSmall
    ) {
        Text(
            text = label,
            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp),
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold
        )
    }
}

private fun formatTime(millis: Long): String {
    return SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date(millis))
}
