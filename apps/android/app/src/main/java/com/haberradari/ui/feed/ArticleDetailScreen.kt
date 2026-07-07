package com.haberradari.ui.feed

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import com.haberradari.config.FeatureConfig
import com.haberradari.data.model.Article

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArticleDetailScreen(
    article: Article,
    viewModel: ArticleDetailViewModel,
    onBackClick: () -> Unit,
    onOpenOriginal: (Article) -> Unit
) {
    val summaryState by viewModel.summaryState.collectAsState()
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = article.sourceName,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Geri Dön"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onBackground
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .padding(paddingValues)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Başlık
            Text(
                text = article.title,
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Tarih ve Kaynak
            Text(
                text = "Tarih: ${formatRelativeTime(article.publishedAt)} • Kaynak: ${article.sourceName}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.height(24.dp))

            // "Kaynak açıklaması" başlığı
            Text(
                text = "Kaynak açıklaması",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.secondary
            )
            
            Text(
                text = "Bu metin kaynağın RSS açıklamasından alınmıştır; kaynak sinyali haberin doğruluğunu tek başına garanti etmez.",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Özet veya Fallback mesaj
            if (!article.description.isNullOrBlank()) {
                Text(
                    text = article.description,
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                Text(
                    text = "Bu kaynak kısa özet vermedi. Detay için orijinal haberi açabilirsiniz.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            if (FeatureConfig.isAiReaderEnabled) {
                Text(
                    text = "AI Özet (Beta)",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.secondary
                )
                Spacer(modifier = Modifier.height(8.dp))

                when (val state = summaryState) {
                    is AiSummaryState.Idle -> {
                        Button(
                            onClick = { viewModel.getSummary(article) },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Yapay Zeka ile Özetle")
                        }
                    }
                    is AiSummaryState.Loading -> {
                        Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator()
                        }
                    }
                    is AiSummaryState.Success -> {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = state.summary.detailedAiSummary ?: state.summary.shortAiSummary,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                    is AiSummaryState.Error -> {
                        Column {
                            Text(
                                text = state.message,
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodyMedium
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Button(onClick = { viewModel.getSummary(article) }) {
                                Text("Tekrar Dene")
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(32.dp))
            }

            // Orijinal site butonu
            Button(
                onClick = { onOpenOriginal(article) },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(text = "Orijinal haberi aç")
            }
        }
    }
}

private fun formatRelativeTime(epochMillis: Long): String {
    val now = System.currentTimeMillis()
    val diff = now - epochMillis

    return when {
        diff < 60_000 -> "Az önce"
        diff < 3_600_000 -> "${diff / 60_000} dk önce"
        diff < 86_400_000 -> "${diff / 3_600_000} saat önce"
        diff < 604_800_000 -> "${diff / 86_400_000} gün önce"
        else -> "${diff / 604_800_000} hafta önce"
    }
}
