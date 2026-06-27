package com.haberradari.ui.feed

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.haberradari.data.model.SourceStats
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SourceHealthScreen(
    viewModel: SourceHealthViewModel,
    onBackClick: () -> Unit
) {
    val stats by viewModel.sourceStats.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Kaynak Sağlığı") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Geri")
                    }
                }
            )
        }
    ) { padding ->
        if (stats.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(stats, key = { it.source.id }) { stat ->
                    SourceHealthCard(stat)
                }
            }
        }
    }
}

@Composable
fun SourceHealthCard(stat: SourceStats) {
    val isHealthy = stat.health?.consecutiveFailures == 0 && stat.health.lastSuccessAt != null
    val iconColor = if (isHealthy) Color(0xFF4CAF50) else MaterialTheme.colorScheme.error

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = stat.source.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Icon(
                    imageVector = if (isHealthy) Icons.Default.CheckCircle else Icons.Default.Warning,
                    contentDescription = if (isHealthy) "Sağlıklı" else "Hata",
                    tint = iconColor
                )
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Kategori: ${stat.source.category.uppercase(Locale.getDefault())}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(12.dp))
            
            val formatter = SimpleDateFormat("dd MMM HH:mm:ss", Locale.getDefault())
            
            Text(
                text = "Makale Sayısı: ${stat.articleCount}",
                style = MaterialTheme.typography.bodyMedium
            )
            
            stat.health?.lastSuccessAt?.let {
                Text(
                    text = "Son Başarılı: ${formatter.format(Date(it))}",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            
            if (stat.health?.consecutiveFailures != null && stat.health.consecutiveFailures > 0) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Hata Sayısı: ${stat.health.consecutiveFailures}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.error
                )
                stat.health.lastErrorAt?.let {
                    Text(
                        text = "Son Hata Zamanı: ${formatter.format(Date(it))}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }
                stat.health.lastErrorMessage?.let {
                    Text(
                        text = "Hata Detayı: $it",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}
