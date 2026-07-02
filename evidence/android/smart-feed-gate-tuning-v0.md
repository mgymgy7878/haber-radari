# Smart Feed Gate Tuning v0 Evidence

## Verdict: PASS

We have successfully tuned the `SINGLE_SOURCE` filtering gate to allow official institutional announcements and strong earthquakes ($M \ge 5.0$), while safely routing commercial media single-source items to the watchlist, and maintaining legal blocks.

---

## 1. Tuned Rules Verification

### A. Earthquake Magnitude Threshold
- **Earthquakes with $M \ge 5.0$** are allowed to publish to the main feed, marked as `Tek Kaynak (Doğrulanmamış)` if single source.
- **Earthquakes with $M < 5.0$** or unknown magnitude (without casualties) remain in `WATCHLIST_ONLY` with reason: `"Deprem büyüklüğü eşik değerin (M≥5.0) altında veya bilinmiyor. İzlemeye alındı."`.
- **Earthquakes with casualties/destruction** are published to main regardless of magnitude (using `containsHarmCasualtyToken`).

### B. Official / Institutional Sources
- Single-source items from official/primary sources (e.g. AFAD, USGS, TCMB, KAP, SPK) are allowed to publish to the main feed if their topic quality is `CRITICAL` or `HIGH_VALUE`.
- They are labeled in the UI as `Tek Kaynak (Resmi Duyuru)`.

---

## 2. Automated Test Results

### Backend API Tests (`pnpm.cmd --filter @haber-radari/api test`)
- **214/214 tests PASSED** (including 3 new publish gate tests for M>=5.0 and official sources).

### Android Unit Tests (`.\gradlew.bat :app:testDebugUnitTest`)
- **BUILD SUCCESSFUL** and all unit tests passed.

---

## 3. UI and Manual Verification

### Empty State UI Copy
- The old string `"Şu an ana akışa alınacak güçlü olay yok"` was updated to:
  - Title: `"Ana akış için yeterli çok-kaynaklı sinyal yok"`
  - Body: `"Tek kaynaklı ve gelişen kayıtlar aşağıda izleniyor."`
- Verified via UI Automator layout dump on device:
  `text="Ana akış için yeterli çok-kaynaklı sinyal yok"`
  `text="Tek kaynaklı ve gelişen kayıtlar aşağıda izleniyor."`

### Watchlist Reason Codes
- Verified via UI Automator layout dump that single-source political statements show:
  `Neden: Siyasi demeçler ana akış yerine takip listesine alındı.`
- Verified that other single-source items show:
  `Neden: Ek kaynak sinyali bekleniyor (tek kaynaklı)`

---

## 4. Screenshot / Evidence Files
- Local screenshot saved in conversation artifacts: [screenshot.png](file:///C:/Users/mscor/.gemini/antigravity-ide/brain/4b6d9f90-d03c-4556-9471-801d8ac97156/screenshot.png)
