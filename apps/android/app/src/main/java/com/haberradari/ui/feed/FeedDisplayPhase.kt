package com.haberradari.ui.feed

/**
 * FeedScreen render fazları — hiçbir faz görünmez/boş gövde bırakmamalı.
 */
enum class FeedDisplayPhase {
    READING_CACHE,
    INITIAL_LOADING,
    CONTENT,
    OFFLINE_SETUP
}

fun FeedUiState.hasFeedData(): Boolean =
    curatedItems != null || !latestRssPreview.isNullOrEmpty()

fun resolveFeedDisplayPhase(state: FeedUiState): FeedDisplayPhase {
    when {
        state.isReadingCache -> return FeedDisplayPhase.READING_CACHE

        !state.hasFeedData() && state.lastError != null &&
            !state.isInitialLoading && !state.isRemoteLoading ->
            return FeedDisplayPhase.OFFLINE_SETUP

        !state.hasFeedData() &&
            (state.isInitialLoading || state.isRemoteLoading || state.lastError == null) ->
            return FeedDisplayPhase.INITIAL_LOADING

        else -> return FeedDisplayPhase.CONTENT
    }
}

/** LazyColumn en az bir görünür gövde öğesi olmalı. */
fun FeedUiState.hasVisibleBodyItems(): Boolean {
    if (!hasFeedData()) return false
    val published = curatedItems?.any { it.publishDecision == com.haberradari.data.model.PublishDecision.PUBLISH_MAIN } == true
    val hasLatest = !latestRssPreview.isNullOrEmpty()
    val showEmptyMain = curatedItems != null && !published
    return published || hasLatest || showEmptyMain
}
