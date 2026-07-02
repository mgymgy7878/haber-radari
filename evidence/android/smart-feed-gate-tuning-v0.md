# Smart Feed Gate Tuning v0 Evidence

## Verdict: PASS

We have successfully tuned the `SINGLE_SOURCE` filtering gate to allow official institutional announcements and strong earthquakes ($M \ge 5.0$), resolved the update freshness UX bug, and verified the entire solution on a connected physical device.

---

## 1. Freshness/Cache UX Bug RCA

### The Bug
When the user clicked "Yenile", the local RSS ingest updated the feed statistics and Room database immediately (to the current time), but the backend smart feed analysis request timed out or returned a cached payload. As a result:
- The UI displayed a single unified update time based ONLY on the smart feed's generation time (`generatedAt` which was 2 days old).
- This misled the user into thinking "the system did not inspect or fetch the news feeds," even though current raw news feeds were available.

### The Fix
1. **Separated Timestamps**: Added two distinct timestamp trackers to `FeedUiState`:
   - `lastRssIngestAt`: Reflects the actual local RSS ingest timestamp, reactively resolved from Room's source statuses.
   - `lastSmartAnalysisAt`: Reflects the backend's smart feed analysis generated time.
2. **Clear UI Distinctions**:
   - In `FeedStatusBar` (top of screen), we now display:
     - `Kaynaklar son yenilendi: <rss ingest offset>` (e.g. "Az önce", "5 dk önce")
     - `Akıllı akış son analizi: <smart analysis offset>` (e.g. "2 gün önce")
   - In the cached content banner, the copy has been clarified to:
     - `"Kaynaklar güncel; akıllı akış önbellekten gösteriliyor (<age>)"`
3. **Source Management Copy Alignment**:
   - Switch label updated to `"Kaynak sinyali açık/kapalı"`.
   - Chip labels for legal mode blocks updated to `"Üretim Ingest Kapalı"` and `"İnceleme bekliyor"`.
   - Replaced `"kısa özet"` with `"RSS metadata"` to guarantee no copyright leak.

---

## 2. Tuned Rules Verification

### A. Earthquake Magnitude Threshold
- **Earthquakes with $M \ge 5.0$** are allowed to publish to the main feed, marked as `Tek Kaynak (Doğrulanmamış)` if single source.
- **Earthquakes with $M < 5.0$** or unknown magnitude (without casualties) remain in `WATCHLIST_ONLY` with reason: `"Deprem büyüklüğü eşik değerin (M≥5.0) altında veya bilinmiyor. İzlemeye alındı."`.
- **Earthquakes with casualties/destruction** are published to main regardless of magnitude (using `containsHarmCasualtyToken`).

### B. Official / Institutional Sources
- Single-source items from official/primary sources (e.g. AFAD, USGS, TCMB, KAP, SPK) are allowed to publish to the main feed if their topic quality is `CRITICAL` or `HIGH_VALUE`.
- They are labeled in the UI as `Tek Kaynak (Resmi Duyuru)`.

---

## 3. Automated Test Results

### Backend API Tests (`pnpm.cmd --filter @haber-radari/api test`)
- **214/214 tests PASSED** (including vitest runs after releasing ports).

### Android Unit Tests (`.\gradlew.bat :app:testDebugUnitTest`)
- **BUILD SUCCESSFUL** and all unit tests passed (including the updated banner copy assertions).

---

## 4. UI and Manual Verification

### Empty State UI Copy
- Title: `"Ana akış için yeterli çok-kaynaklı sinyal yok"`
- Body: `"Tek kaynaklı ve gelişen kayıtlar aşağıda izleniyor."`
- Verified via UI Automator layout dump on device:
  `text="Ana akış için yeterli çok-kaynaklı sinyal yok"`
  `text="Tek kaynaklı ve gelişen kayıtlar aşağıda izleniyor."`

### Separated Timestamps in Layout Dump
- Verified:
  `text="Kaynaklar son yenilendi: Az önce"`
  `text="Akıllı akış son analizi: 2 gün önce"`
  - Status indicator: `"Önbellekten gösteriliyor"`

### Forbidden Field Leak Audit
- Verified that **none** of the restricted fields are present or leaked in the UI hierarchy or response payload:
  - `description`: NO LEAK
  - `summary` / `body` / `fullText` / `contentHtml` / `rawHtml`: NO LEAK
  - `scrapedText` / `articleText`: NO LEAK
  - `image` / `caption` / `video` / `audio`: NO LEAK

---

## 5. Screenshot / Evidence Files
- Main Screen (Separated Timestamps & Copy): [screenshot2.png](file:///C:/Users/mscor/.gemini/antigravity-ide/brain/4b6d9f90-d03c-4556-9471-801d8ac97156/screenshot2.png)
- Source Management Screen (Updated Ingest Labels): [screenshot3.png](file:///C:/Users/mscor/.gemini/antigravity-ide/brain/4b6d9f90-d03c-4556-9471-801d8ac97156/screenshot3.png)
