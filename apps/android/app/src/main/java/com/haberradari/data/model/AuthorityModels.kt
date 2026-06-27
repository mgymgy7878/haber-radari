package com.haberradari.data.model

enum class NewsCategory {
    DISASTER_EARTHQUAKE,
    WEATHER_ALERT,
    PUBLIC_SAFETY,
    HEALTH,
    ECONOMY_OFFICIAL,
    MARKETS,
    POLITICS_OFFICIAL,
    SPORTS,
    TECHNOLOGY,
    GENERAL
}

enum class SourceAuthority {
    OFFICIAL_PRIMARY,
    OFFICIAL_SECONDARY,
    LICENSED_NEWS,
    GENERAL_MEDIA,
    LOW_TRUST_OR_CLICKBAIT
}