package com.haberradari.ui.feed

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.haberradari.BuildConfig
import com.haberradari.data.model.Article
import com.haberradari.data.model.AiCuratedNewsItem
import com.haberradari.data.model.EvidenceStatus
import com.haberradari.data.model.Importance
import com.haberradari.data.model.PublishDecision

import androidx.compose.foundation.layout.heightIn
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog

import androidx.compose.foundation.layout.Row

/**
 * Ana haber akışı ekranı.
 *
 * State matrix (FeedDisplayPhase):
 * | Durum                              | Faz              | Gövde                    |
 * |------------------------------------|------------------|--------------------------|
 * | cache okunuyor                     | READING_CACHE    | LoadingCard              |
 * | initial/remote loading, veri yok   | INITIAL_LOADING  | LoadingCard              |
 * | remote fail + cache yok            | OFFLINE_SETUP    | OfflineSetupState        |
 * | remote success / cache / refresh   | CONTENT          | banner + liste/fallback|
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeedScreen(
    viewModel: FeedViewModel,
    onOpenDetail: (Article) -> Unit,
    onOpenCuratedDetail: (AiCuratedNewsItem) -> Unit,
    onOpenHealth: () -> Unit,
    onOpenDiagnostics: () -> Unit = {}
) {
    val state = viewModel.uiState.collectAsState().value
    val isRefreshing by viewModel.isRefreshing.collectAsState()
    val phase = resolveFeedDisplayPhase(state)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = stringResource(id = com.haberradari.R.string.app_name),
                        style = MaterialTheme.typography.titleLarge
                    )
                },
                actions = {
                    IconButton(onClick = onOpenHealth) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = "Kaynak Yönetimi"
                        )
                    }
                    IconButton(onClick = { viewModel.refresh() }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Yenile"
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
        ) {
            if (BuildConfig.DEBUG) {
                DebugBuildChip(onClick = onOpenDiagnostics)
            }

            when (phase) {
                FeedDisplayPhase.READING_CACHE -> {
                    LoadingCard(
                        message = "Kayıtlı haberler kontrol ediliyor…",
                        modifier = Modifier.fillMaxSize()
                    )
                }
                FeedDisplayPhase.INITIAL_LOADING -> {
                    LoadingCard(
                        message = stringResource(id = com.haberradari.R.string.loading_message),
                        modifier = Modifier.fillMaxSize()
                    )
                }
                FeedDisplayPhase.OFFLINE_SETUP -> {
                    OfflineSetupState(
                        errorMessage = state.lastError ?: "Bilinmeyen Hata",
                        emptyKind = FeedUsabilityUiLogic.resolveEmptyKind(state),
                        onRetry = { viewModel.refresh() },
                        modifier = Modifier.fillMaxSize()
                    )
                }
                FeedDisplayPhase.CONTENT -> {
                    FeedContentBody(
                        state = state,
                        isRefreshing = isRefreshing,
                        onRefresh = { viewModel.refresh() },
                        onOpenCuratedDetail = onOpenCuratedDetail
                    )
                }
            }
        }
    }
}

@Composable
private fun DebugBuildChip(
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    androidx.compose.material3.Surface(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
    ) {
        Text(
            text = "debug ${BuildConfig.VERSION_NAME} • ${BuildConfig.VERSION_CODE} • ${BuildConfig.GIT_SHA}",
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 3.dp),
            style = MaterialTheme.typography.labelSmall.copy(
                fontFamily = FontFamily.Monospace,
                fontSize = 10.sp,
                letterSpacing = 0.sp
            ),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
private fun FeedContentBody(
    state: FeedUiState,
    isRefreshing: Boolean,
    onRefresh: () -> Unit,
    onOpenCuratedDetail: (AiCuratedNewsItem) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        FeedStatusBar(
            state = state,
            isRefreshing = isRefreshing,
        )

        if (state.refreshOutcome == FeedRefreshUiLogic.RefreshOutcome.SKIPPED_NO_ACTIVE_SOURCES) {
            NoActiveSourcesBanner(
                message = state.lastError ?: FeedRefreshUiLogic.noActiveSourcesMessage(),
                onRefresh = onRefresh,
            )
        } else if (state.lastError != null && state.isShowingCachedData) {
            CachedErrorBanner(
                cacheAgeText = state.cacheAgeText,
                onRetry = onRefresh,
            )
        } else if (state.lastError != null) {
            ErrorOnlyBanner(
                errorMessage = state.lastError,
                onRetry = onRefresh,
            )
        } else if (state.isShowingCachedData) {
            CachedDataBanner(cacheAgeText = state.cacheAgeText)
        }

        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                if (state.curatedItems != null) {
                    item(key = "stats_banner") {
                        StatsBanner(state = state)
                    }

                    val publishedItems = state.curatedItems.filter {
                        it.publishDecision == PublishDecision.PUBLISH_MAIN
                    }

                    if (publishedItems.isEmpty()) {
                        item(key = "empty_main") {
                            EmptyMainStateContent(
                                hiddenCount = state.hiddenCount,
                                watchlistPreview = state.watchlistPreview,
                                rawPreview = state.rawPreview,
                                onRefresh = onRefresh
                            )
                        }
                    } else {
                        items(
                            items = publishedItems,
                            key = { it.id }
                        ) { curatedItem ->
                            AiCuratedNewsItemCard(
                                item = curatedItem,
                                source = state.source,
                                onOpenDetail = onOpenCuratedDetail
                            )
                        }
                    }
                }

                if (!state.latestRssPreview.isNullOrEmpty()) {
                    item(key = "latest_header") {
                        LatestRssSectionHeader()
                    }
                    items(
                        items = state.latestRssPreview,
                        key = { "latest_${it.id}" }
                    ) { rssItem ->
                        LatestRssItemCard(
                            item = rssItem,
                            onOpenDetail = {
                                onOpenCuratedDetail(buildRssDetailItem(rssItem))
                            }
                        )
                    }
                } else if (state.curatedItems != null && state.curatedItems.none { it.publishDecision == PublishDecision.PUBLISH_MAIN }) {
                    item(key = "latest_empty_fallback") {
                        LatestRssEmptyFallback(onRefresh = onRefresh)
                    }
                }

                // Son güvenlik: hiç item yoksa empty/loading fallback
                if (!state.hasVisibleBodyItems()) {
                    item(key = "body_fallback") {
                        when {
                            state.isRemoteLoading || state.isInitialLoading -> {
                                LoadingCard(
                                    message = stringResource(id = com.haberradari.R.string.loading_message),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp)
                                )
                            }
                            else -> {
                                PersonalFeedEmptyState(
                                    kind = FeedUsabilityUiLogic.resolveEmptyKind(state),
                                    onRefresh = onRefresh,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp)
                                )
                            }
                        }
                    }
                }
            }

            if (isRefreshing || state.isRemoteLoading) {
                androidx.compose.material3.LinearProgressIndicator(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.TopCenter),
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@Composable
private fun FeedStatusBar(
    state: FeedUiState,
    isRefreshing: Boolean,
    modifier: Modifier = Modifier,
) {
    val connectionStatus = FeedUsabilityUiLogic.resolveConnectionStatus(state, isRefreshing)
    val rssTime = FeedUsabilityUiLogic.formatRssLastUpdatedText(state.lastRssIngestAt)
    val smartTime = FeedUsabilityUiLogic.formatSmartAnalysisLastUpdatedText(state.lastSmartAnalysisAt)
    val sourcesLabel = FeedUsabilityUiLogic.formatActiveSourcesLabel(
        state.enabledSourceCount,
        state.totalSourceCount,
    )

    androidx.compose.material3.Surface(
        modifier = modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
    ) {
        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Kaynaklar son yenilendi: $rssTime",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "Akıllı akış son analizi: $smartTime",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Text(
                    text = FeedUsabilityUiLogic.formatConnectionStatusLabel(connectionStatus),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = sourcesLabel,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            if (!isRefreshing) {
                FeedRefreshUiLogic.formatRefreshOutcomeLabel(state.refreshOutcome)?.let { outcomeLabel ->
                    Text(
                        text = outcomeLabel,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.secondary,
                        modifier = Modifier.padding(top = 2.dp),
                    )
                }
            }
            Text(
                text = TrustTransparencyUiLogic.SOURCE_SIGNAL_DISCLAIMER,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.85f),
                modifier = Modifier.padding(top = 4.dp),
            )
        }
    }
}

@Composable
private fun PersonalFeedEmptyState(
    kind: FeedUsabilityUiLogic.FeedEmptyKind,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier,
) {
    if (kind == FeedUsabilityUiLogic.FeedEmptyKind.NONE) return

    androidx.compose.material3.OutlinedCard(modifier = modifier) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(20.dp),
        ) {
            Text(
                text = FeedUsabilityUiLogic.emptyStateTitle(kind),
                style = MaterialTheme.typography.titleMedium,
                textAlign = TextAlign.Center,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = FeedUsabilityUiLogic.emptyStateMessage(kind),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = onRefresh) {
                Text(stringResource(id = com.haberradari.R.string.refresh))
            }
        }
    }
}

@Composable
private fun CachedErrorBanner(
    cacheAgeText: String?,
    onRetry: () -> Unit,
) {
    androidx.compose.material3.Surface(
        modifier = Modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.secondaryContainer,
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = FeedRefreshUiLogic.cachedModeBannerTitle(),
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSecondaryContainer,
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = FeedRefreshUiLogic.cachedModeBannerDescription(cacheAgeText),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSecondaryContainer,
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = FeedRefreshUiLogic.cachedModeRetryHint(),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.85f),
            )
            Spacer(modifier = Modifier.height(8.dp))
            androidx.compose.material3.OutlinedButton(onClick = onRetry) {
                Text(stringResource(id = com.haberradari.R.string.retry))
            }
        }
    }
}

@Composable
private fun ErrorOnlyBanner(
    errorMessage: String?,
    onRetry: () -> Unit,
) {
    androidx.compose.material3.Surface(
        modifier = Modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.errorContainer
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = errorMessage ?: "Haberler yenilenemedi.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onErrorContainer
            )
            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = onRetry) {
                Text(stringResource(id = com.haberradari.R.string.retry))
            }
        }
    }
}

@Composable
private fun NoActiveSourcesBanner(
    message: String,
    onRefresh: () -> Unit,
) {
    androidx.compose.material3.Surface(
        modifier = Modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.secondaryContainer
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSecondaryContainer
            )
            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = onRefresh) {
                Text(stringResource(id = com.haberradari.R.string.refresh))
            }
        }
    }
}

@Composable
private fun CachedDataBanner(cacheAgeText: String?) {
    androidx.compose.material3.Surface(
        modifier = Modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.tertiaryContainer
    ) {
        Text(
            text = FeedRefreshUiLogic.cachedContentBannerMessage(cacheAgeText),
            modifier = Modifier.padding(12.dp),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onTertiaryContainer
        )
    }
}

@Composable
private fun StatsBanner(state: FeedUiState) {
    androidx.compose.material3.Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
        shape = MaterialTheme.shapes.small
    ) {
        val bannerMessage = when (state.source) {
            com.haberradari.domain.repository.FeedSource.REMOTE_BACKEND_RSS,
            com.haberradari.domain.repository.FeedSource.REMOTE_BACKEND_RSS_WITH_WATCHLIST -> {
                when (state.invariantOk) {
                    true -> {
                        var msg = "Backend RSS analiz: ${state.totalAnalyzed} haber tarandı, ${state.publishedCount} olay gösteriliyor, ${state.hiddenCount} olay gizlendi/izlemeye alındı."
                        if (state.source == com.haberradari.domain.repository.FeedSource.REMOTE_BACKEND_RSS_WITH_WATCHLIST && state.watchlistPreview != null) {
                            msg = "Backend RSS analiz: ${state.totalAnalyzed} haber tarandı, ${state.publishedCount} olay gösteriliyor, ${state.hiddenCount} olay gizlendi. İzleme listesi: ${state.watchlistPreview.size}"
                        }
                        msg
                    }
                    false -> "Backend RSS analizinde sayaç tutarsızlığı var: ${state.invariantError ?: "Bilinmeyen Hata"}"
                    null -> "Backend RSS analiz: sayaç kontrolü alınamadı."
                }
            }
            com.haberradari.domain.repository.FeedSource.FALLBACK_MOCK -> {
                "Backend erişilemedi: ${state.fallbackReason ?: "Hata"}. Cihaz içi demo gösteriliyor."
            }
            com.haberradari.domain.repository.FeedSource.LOCAL_MOCK -> {
                "Cihaz içi Demo Analiz: ${state.totalAnalyzed} haber tarandı, ${state.publishedCount} olay gösteriliyor, ${state.hiddenCount} olay gizlendi."
            }
            null -> "Analiz bekleniyor…"
        }
        Text(
            text = bannerMessage,
            modifier = Modifier.padding(12.dp),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun LatestRssSectionHeader() {
    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
        Text(
            text = "Son Haberler",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onBackground
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Bu liste RSS kaynaklarından alınan ham kayıtlardır (başlık-link önizlemesi); kaynak sinyali gösterilir, içerik doğrulama hizmeti değildir.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun LatestRssEmptyFallback(onRefresh: () -> Unit) {
    androidx.compose.material3.OutlinedCard(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Son haber listesi şu an boş",
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "RSS kaynaklarından henüz önizleme alınamadı. Bağlantıyı kontrol edip yenileyin.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(12.dp))
            Button(onClick = onRefresh) {
                Text("Yenile")
            }
        }
    }
}

private fun buildRssDetailItem(rssItem: com.haberradari.domain.repository.WatchlistPreviewItem): AiCuratedNewsItem {
    return AiCuratedNewsItem(
        id = rssItem.id,
        aiTitle = rssItem.title,
        aiSummary = AiSummaryUiLogic.normalizeSummary(rssItem.shortDescription),
        category = rssItem.category,
        importance = Importance.LOW,
        confidence = 0f,
        evidenceStatus = EvidenceStatus.LOW_CONFIDENCE,
        topicQuality = com.haberradari.data.model.TopicQuality.NORMAL,
        contentType = com.haberradari.data.model.ContentType.GENERAL,
        publishDecision = PublishDecision.RAW_ONLY,
        publishReason = "RSS",
        warningLabel = null,
        clusterReason = "",
        sourceCount = 1,
        uniqueSourceCount = 1,
        filteredSourceCount = 0,
        sources = listOf(
            com.haberradari.data.model.SourceEvidence(
                sourceName = rssItem.sourceNames?.firstOrNull() ?: "Bilinmeyen Kaynak",
                originalTitle = rssItem.title,
                url = rssItem.originalUrl ?: "",
                publishedAt = rssItem.publishedAt?.toLongOrNull() ?: 0L,
                imageUrl = null,
                videoUrl = null
            )
        ),
        mediaHints = null,
        originalArticleIds = emptyList(),
        isDemo = false
    )
}

@Composable
private fun LoadingCard(
    message: String,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier,
        contentAlignment = Alignment.Center
    ) {
        androidx.compose.material3.OutlinedCard(
            modifier = Modifier
                .padding(24.dp)
                .fillMaxWidth()
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(24.dp)
            ) {
                CircularProgressIndicator(
                    modifier = Modifier.size(40.dp),
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

// Legacy alias — eski referanslar için
@Composable
private fun LoadingState(modifier: Modifier = Modifier) {
    LoadingCard(
        message = stringResource(id = com.haberradari.R.string.loading_message),
        modifier = modifier
    )
}

@Composable
private fun OfflineSetupState(
    errorMessage: String,
    emptyKind: FeedUsabilityUiLogic.FeedEmptyKind = FeedUsabilityUiLogic.FeedEmptyKind.NONE,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp)
        ) {
            Text(
                text = "📡",
                style = MaterialTheme.typography.headlineLarge
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = when (emptyKind) {
                    FeedUsabilityUiLogic.FeedEmptyKind.NO_ENABLED_SOURCES ->
                        "Aktif kaynak yok"
                    else -> "Backend bağlantısı kurulamadı"
                },
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = when (emptyKind) {
                    FeedUsabilityUiLogic.FeedEmptyKind.NO_ENABLED_SOURCES ->
                        FeedUsabilityUiLogic.emptyStateMessage(emptyKind)
                    else ->
                        "API servisine ulaşılamadı ve cihazda kayıtlı haber önbelleği bulunamadı. Backend çalışıyorsa adb reverse yönlendirmesini kontrol edin."
                },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(16.dp))
            androidx.compose.material3.Card(
                colors = androidx.compose.material3.CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = "Teknik Hata Detayı:",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = errorMessage,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Spacer(modifier = Modifier.height(24.dp))
            Button(onClick = onRetry) {
                Text(text = "Tekrar Dene")
            }
        }
    }
}

@Composable
private fun EmptyMainStateContent(
    hiddenCount: Int,
    watchlistPreview: List<com.haberradari.domain.repository.WatchlistPreviewItem>?,
    rawPreview: List<com.haberradari.domain.repository.WatchlistPreviewItem>?,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showWatchlistDialog by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(false) }
    var showRawDialog by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(false) }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 24.dp)
    ) {
        Text(text = "📡", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = "Ana akış için yeterli çok-kaynaklı sinyal yok",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Güvenli gösterilecek haber bulunamadı. Tek kaynaklı kayıtlar ve elenen içerikler izleme listesinde.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Gizlenen/izlenen olaylar: $hiddenCount",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.secondary
        )
        Spacer(modifier = Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = onRefresh) {
                Text(text = "Yenile")
            }
            if (!watchlistPreview.isNullOrEmpty()) {
                androidx.compose.material3.OutlinedButton(onClick = { showWatchlistDialog = true }) {
                    Text(text = "İzleme listesini gör")
                }
            }
        }
        if (!rawPreview.isNullOrEmpty()) {
            Spacer(modifier = Modifier.height(8.dp))
            androidx.compose.material3.TextButton(onClick = { showRawDialog = true }) {
                Text(text = "Ham kaynakları gör")
            }
        }
    }

    if (showWatchlistDialog && watchlistPreview != null) {
        WatchlistModal(
            watchlistPreview = watchlistPreview,
            onDismiss = { showWatchlistDialog = false }
        )
    }

    if (showRawDialog && rawPreview != null) {
        RawSourcesModal(
            rawPreview = rawPreview,
            onDismiss = { showRawDialog = false }
        )
    }
}

@Composable
private fun WatchlistModal(
    watchlistPreview: List<com.haberradari.domain.repository.WatchlistPreviewItem>,
    onDismiss: () -> Unit
) {
    val isDemo = watchlistPreview.firstOrNull()?.title?.contains("Demo") == true
    Dialog(onDismissRequest = onDismiss) {
        androidx.compose.material3.Surface(
            shape = MaterialTheme.shapes.large,
            tonalElevation = 6.dp
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 520.dp)
            ) {
                Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)) {
                    Text(
                        text = if (isDemo) "Demo İzleme Listesi" else "İzleme Listesi",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Ana akışa alınmayan olaylar. WATCHLIST_ONLY kararı uygulanır.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                LazyColumn(
                    modifier = Modifier
                        .weight(1f, fill = false)
                        .heightIn(max = 380.dp)
                        .padding(horizontal = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(watchlistPreview, key = { it.id }) { item ->
                        Column {
                            Text(text = item.title, style = MaterialTheme.typography.titleSmall)
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                androidx.compose.material3.SuggestionChip(onClick = {}, label = { Text(item.category) })
                                androidx.compose.material3.Surface(
                                    color = MaterialTheme.colorScheme.surfaceVariant,
                                    shape = MaterialTheme.shapes.small
                                ) {
                                    Text(
                                        "Ana akışa alınmadı",
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Neden: ${TrustTransparencyUiLogic.sanitizeTrustDisplayText(item.reasonCode ?: item.publishReason ?: "Bilinmiyor")}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.error
                            )
                            Text(
                                text = "Sinyal: ${item.evidenceStatus} (${item.sourceCount} kaynak)",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        androidx.compose.material3.HorizontalDivider(modifier = Modifier.padding(top = 8.dp))
                    }
                }
                androidx.compose.material3.HorizontalDivider()
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.End
                ) {
                    Button(onClick = onDismiss) {
                        Text("Kapat")
                    }
                }
            }
        }
    }
}

@Composable
private fun RawSourcesModal(
    rawPreview: List<com.haberradari.domain.repository.WatchlistPreviewItem>,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        androidx.compose.material3.Surface(
            shape = MaterialTheme.shapes.large,
            tonalElevation = 6.dp
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 520.dp)
            ) {
                Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)) {
                    Text(text = "Ham Kaynaklar", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "AI filtresinden geçmemiş ham RSS kaynakları. Ana akış değildir.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }
                LazyColumn(
                    modifier = Modifier
                        .weight(1f, fill = false)
                        .heightIn(max = 380.dp)
                        .padding(horizontal = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(rawPreview, key = { it.id }) { item ->
                        androidx.compose.material3.OutlinedCard {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = item.sourceNames?.joinToString(", ") ?: "Bilinmeyen Kaynak",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(text = item.title, style = MaterialTheme.typography.titleSmall)
                                if (!item.shortDescription.isNullOrEmpty()) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = item.shortDescription,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }
                }
                androidx.compose.material3.HorizontalDivider()
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.End
                ) {
                    Button(onClick = onDismiss) {
                        Text("Kapat")
                    }
                }
            }
        }
    }
}

@Composable
private fun EmptyState(
    onRefresh: () -> Unit,
    hiddenCount: Int = 0,
    watchlistPreview: List<com.haberradari.domain.repository.WatchlistPreviewItem>? = null,
    rawPreview: List<com.haberradari.domain.repository.WatchlistPreviewItem>? = null,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        EmptyMainStateContent(
            hiddenCount = hiddenCount,
            watchlistPreview = watchlistPreview,
            rawPreview = rawPreview,
            onRefresh = onRefresh
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AiCuratedNewsItemCard(
    item: AiCuratedNewsItem,
    source: com.haberradari.domain.repository.FeedSource?,
    onOpenDetail: (AiCuratedNewsItem) -> Unit,
    modifier: Modifier = Modifier
) {
    androidx.compose.material3.ElevatedCard(
        onClick = { onOpenDetail(item) },
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        colors = androidx.compose.material3.CardDefaults.elevatedCardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // 2. Kaynak adı · yayın zamanı
            val sourceName = item.sources.firstOrNull()?.sourceName ?: "Bilinmeyen Kaynak"
            val publishedAt = item.sources.firstOrNull()?.publishedAt?.let { 
                FeedUsabilityUiLogic.formatPublishedAtLabel(it.toString()) 
            } ?: "—"
            
            Text(
                text = "$sourceName · $publishedAt",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.height(4.dp))

            // 1. Başlık
            Text(
                text = item.aiTitle,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            
            Spacer(modifier = Modifier.height(12.dp))

            // Chips Row: Haber değeri, Akış kararı, Kaynak sinyali
            androidx.compose.foundation.layout.Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 3. Haber değeri chip
                val newsValueLabel = item.aiNewsValue?.let {
                    when {
                        it.newsValueScore >= 75 -> "Haber değeri: Yüksek"
                        it.newsValueScore >= 40 -> "Haber değeri: Orta"
                        else -> "Haber değeri: Düşük"
                    }
                } ?: "Haber değeri: Bilinmiyor"
                
                androidx.compose.material3.Surface(
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    shape = MaterialTheme.shapes.small
                ) {
                    Text(
                        text = newsValueLabel,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSecondaryContainer
                    )
                }

                // 4. Akış kararı chip
                val decisionLabel = item.aiNewsValue?.let {
                    when (it.decision) {
                        "SHOW_MAIN" -> "Öncelikli Akış"
                        "SHOW_MONITORING" -> "Gelişen Kayıt"
                        "HIDE_LOW_VALUE" -> "İzleme"
                        else -> "İzleme"
                    }
                } ?: if (item.publishDecision == PublishDecision.PUBLISH_MAIN) "Öncelikli Akış" else "İzleme"

                androidx.compose.material3.Surface(
                    color = MaterialTheme.colorScheme.tertiaryContainer,
                    shape = MaterialTheme.shapes.small
                ) {
                    Text(
                        text = decisionLabel,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onTertiaryContainer
                    )
                }
                
                // 5. Kaynak sinyali
                val sourceSignalLabel = if (item.uniqueSourceCount > 1) "Çok-kaynaklı sinyal" else "Tek kaynak sinyali"
                androidx.compose.material3.Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    shape = MaterialTheme.shapes.small
                ) {
                    Text(
                        text = sourceSignalLabel,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // 6. Neden gösterildi?
            val reason = item.aiNewsValue?.reasonCode ?: item.publishReason ?: "Haber değeri algoritması tarafından seçildi."
            Text(
                text = "Neden gösterildi?\n$reason",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(8.dp))

            // 7. Uyarı
            Text(
                text = "Uyarı: Bu sinyal haberin doğruluğunu tek başına garanti etmez.",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.outline
            )

            Spacer(modifier = Modifier.height(12.dp))

            // 8. Orijinal kaynağa git
            androidx.compose.foundation.layout.Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Orijinal kaynağa git →",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LatestRssItemCard(
    item: com.haberradari.domain.repository.WatchlistPreviewItem,
    onOpenDetail: () -> Unit,
    modifier: Modifier = Modifier
) {
    androidx.compose.material3.OutlinedCard(
        onClick = onOpenDetail,
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        colors = androidx.compose.material3.CardDefaults.outlinedCardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Spacer(modifier = Modifier.height(12.dp))
            
            androidx.compose.foundation.layout.Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = item.sourceNames?.joinToString(", ") ?: "Bilinmeyen Kaynak",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.weight(1f),
                )
                FeedUsabilityUiLogic.formatPublishedAtLabel(item.publishedAt)?.let { publishedLabel ->
                    Text(
                        text = publishedLabel,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
            androidx.compose.foundation.layout.Row(
                horizontalArrangement = Arrangement.End,
                modifier = Modifier.fillMaxWidth(),
            ) {
                androidx.compose.material3.Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    shape = MaterialTheme.shapes.small
                ) {
                    Text(
                        text = "RSS",
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = item.title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            
            if (!item.shortDescription.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = item.shortDescription,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            androidx.compose.foundation.layout.Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Orijinal kaynağa git →",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.tertiary
                )
            }
        }
    }
}
