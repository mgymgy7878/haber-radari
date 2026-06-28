# Smart Feed API Contract v0

This document defines the contract between the Haber Radarı Android application and the future Smart Feed Backend. 

## Architectural Goal
The Android application acts purely as a consumer (client) of AI-curated news data. It does not perform AI clustering, NLP analysis, or LLM synthesis natively. All heavy lifting, including RSS ingestion, clustering, filtering, and LLM processing, is handled by the Backend.

## Endpoint Definition
**Endpoint**: `GET /api/v1/smart-feed`
**Description**: Returns the curated news feed based on the latest AI analysis.

### Query Parameters
- `locale` (optional): `tr-TR`
- `category` (optional): Specific category filter.
- `limit` (optional): Max items to return.

## Constraints & Legal Guidelines
**CRITICAL:** To comply with legal constraints regarding web scraping and publisher copyright:
1. **No Full Text:** The backend MUST NOT store or transmit the full body, HTML content, or complete article text.
2. **Metadata Only:** Only metadata such as `title`, `shortDescription`, `publishedAt`, `sourceName`, `originalUrl`, and `imageUrl` are allowed.
3. **Synthesis Limitations:** The AI can generate a short summary (`aiSummary`) ONLY for events corroborated by multiple sources. Single-source AI synthesis is restricted.
4. **Attribution:** The `sourceName` and `originalUrl` must ALWAYS be provided and preserved for the UI.
5. **No Secrets in Client:** The LLM API keys must remain strictly on the backend.

## Response Format (JSON)
The response follows the DTO structure defined in `AiCuratedFeedResponseDto`.

```json
{
  "generatedAt": 1719500000000,
  "isDemo": false,
  "stats": {
    "totalScanned": 150,
    "publishedCount": 5,
    "hiddenCount": 145,
    "watchlistCount": 100,
    "filteredCount": 45
  },
  "items": [
    {
      "id": "event_12345",
      "aiTitle": "Merkez Bankası faiz kararını açıkladı",
      "aiSummary": "TCMB politika faizini beklentiler dahilinde sabit tuttuğunu duyurdu.",
      "category": "Ekonomi",
      "importance": "HIGH",
      "confidence": 0.85,
      "evidenceStatus": "CONFIRMED",
      "topicQuality": "HIGH_VALUE",
      "contentType": "NEWS_EVENT",
      "publishDecision": "PUBLISH_MAIN",
      "publishReason": "Ana akışa alınma nedeni: Çok kaynaklı doğrulama",
      "warningLabel": null,
      "sourceCount": 3,
      "filteredSourceCount": 0,
      "sources": [
        {
          "sourceName": "AA",
          "originalTitle": "Merkez Bankası faiz oranını değiştirmedi",
          "url": "https://example.com/aa",
          "publishedAt": 1719490000000,
          "imageUrl": "https://example.com/img1.jpg",
          "videoUrl": null
        }
      ],
      "mediaHints": null,
      "originalArticleIds": ["id1", "id2", "id3"]
    }
  ]
}
```

## Mobile Client Behavior
- The client receives this JSON via `RemoteAiCuratedFeedRepository`.
- It maps the DTO to the internal domain model (`AiCuratedNewsItem`).
- It filters the list, explicitly displaying only items where `publishDecision == "PUBLISH_MAIN"`.
- It displays the `stats` in a banner to provide transparency.
- If a single-source event is published due to a `CRITICAL` topic quality exception, the client will display the `warningLabel` or `publishReason`.
