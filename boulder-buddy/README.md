# Sydney Boulder Buddy

Sydney Boulder Buddy forecasts rock dryness and friction for outdoor bouldering.
The application evaluates sandstone conditions across 58 crags in four Sydney regions — see [`CRAGS_DATA`](./crags.js#L6).

Source: [`index.html`](./index.html) (application), [`crags.js`](./crags.js) (dataset), [`test.js`](./test.js) (verification suite).

---

## 1. Overview

Hawkesbury sandstone absorbs water and becomes weak after rainfall.
Climbing on wet sandstone can break fragile holds and damage the rock.
This application predicts safe climbing conditions using a two-tier mathematical engine, implemented in [`ConditionEngine`](./index.html#L484).

---

## 2. Code Map

| Layer | Symbol | Location |
| :--- | :--- | :--- |
| Dataset | `CRAGS_DATA` (58 crags) | [`crags.js#L6`](./crags.js#L6) |
| Grade filtering | `parseVGrade()` | [`index.html#L470`](./index.html#L470) |
| Grade filtering | `matchesGradeRange()` | [`index.html#L478`](./index.html#L478) |
| Condition engine | `ConditionEngine` | [`index.html#L484`](./index.html#L484) |
| Condition engine | `calculateMoistureIndex()` | [`index.html#L488`](./index.html#L488) |
| Condition engine | `calculateFrictionIndex()` | [`index.html#L525`](./index.html#L525) |
| Condition engine | `classifyCondition()` | [`index.html#L554`](./index.html#L554) |
| Condition engine | `evaluateCrag()` | [`index.html#L605`](./index.html#L605) |
| Weather | `WeatherService` | [`index.html#L672`](./index.html#L672) |
| Weather | `buildApiUrl()` | [`index.html#L676`](./index.html#L676) |
| Weather | `parseResponse()` | [`index.html#L682`](./index.html#L682) |
| Weather | `generateFallbackDataset()` | [`index.html#L775`](./index.html#L775) |
| Map | `MapController` | [`index.html#L841`](./index.html#L841) |
| Map | `renderMarkers()` | [`index.html#L879`](./index.html#L879) |
| Map | `resetBounds()` | [`index.html#L979`](./index.html#L979) |
| UI | `UIController` | [`index.html#L1000`](./index.html#L1000) |
| UI | `renderGlobalTimeline()` | [`index.html#L1176`](./index.html#L1176) |
| UI | `renderCragCards()` | [`index.html#L1349`](./index.html#L1349) |
| UI | `openCragDetails()` | [`index.html#L1510`](./index.html#L1510) |

---

## 3. Condition Scoring Model

The application uses a two-tier evaluation model, orchestrated by [`evaluateCrag()`](./index.html#L605):

1. **Sandstone Moisture Gating (Tier 1)** — [`calculateMoistureIndex()`](./index.html#L488):
   - The engine checks recent precipitation.
   - If rainfall exceeds 1.5 mm, [`classifyCondition()`](./index.html#L554) sets status to `WET_DANGER`.
   - The engine models drying decay over a 3-day lookback window ([`index.html#L505`](./index.html#L505)).
   - Per-crag drying behaviour comes from the optional `dryingProfile` field; the defaults are declared at [`index.html#L491`](./index.html#L491).
2. **Ambient Friction Scoring (Tier 2)** — [`calculateFrictionIndex()`](./index.html#L525):
   - When the rock is dry, the engine calculates a friction score from 0 to 100.
   - Optimal friction requires cold temperature (below 16°C) and low dew point (below 10°C).
   - High humidity and hot temperatures reduce friction scores.

The classifier is a strict waterfall: `WET_DANGER` → `DAMP` → `PRIME` → `GOOD` → fallback, evaluated in order from [`index.html#L556`](./index.html#L556).

---

## 4. Crag Dataset

[`crags.js`](./crags.js) exports `CRAGS_DATA` on both `window` and `module.exports` ([`crags.js#L663`](./crags.js#L663)) so the browser app and the Node test suite share one source of truth.

| Region key | Label | Crags | Section |
| :--- | :--- | ---: | :--- |
| `sydney-north` | Northern Beaches & North Shore | 30 | [`crags.js#L8`](./crags.js#L8) |
| `sydney-inner-west` | Inner West & Parramatta | 14 | [`crags.js#L342`](./crags.js#L342) |
| `sydney-east` | Sydney Eastern Suburbs | 2 | [`crags.js#L500`](./crags.js#L500) |
| `sydney-south` | Sydney South & Sutherland | 12 | [`crags.js#L526`](./crags.js#L526) |

Each record carries `id`, `name`, `region`, `regionLabel`, `lat`, `lng`, `grades`, `approachMinutes`, and `theCragUrl`. The schema is asserted by test 1 ([`test.js#L103`](./test.js#L103)).

---

## 5. Weather Data

- **Source**: Open-Meteo, batched into one request for all crags by [`buildApiUrl()`](./index.html#L676).
- **Cache**: `localStorage` key `bb_weather_cache_v1` with a 30-minute TTL ([`index.html#L673`](./index.html#L673)).
- **Degradation**: on fetch failure the service falls back to stale cache, then to a synthetic baseline ([`index.html#L818`](./index.html#L818)).
- **Favorites**: persisted under the `bb_favorites` key by [`saveFavorites()`](./index.html#L1086).

---

## 6. Keyboard Shortcuts

All shortcuts are registered in the `keydown` handler at [`index.html#L1038`](./index.html#L1038).

| Key | Action | Handler |
| :--- | :--- | :--- |
| `/` | Focus crag search bar | [`index.html#L1048`](./index.html#L1048) |
| `1` – `7` | Select forecast day on timeline | [`index.html#L1052`](./index.html#L1052) |
| `F` | Toggle favorite crags filter | [`toggleFavoritesOnly()`](./index.html#L1132) |
| `R` | Reset map zoom and bounds | [`MapController.resetBounds()`](./index.html#L979) |
| `Esc` | Close crag detail modal | [`closeModal()`](./index.html#L1614) |

---

## 7. Verification and Tests

Run the automated verification test suite with Node.js:

1. Open your terminal in the repository root.
2. Run the test command:
   ```bash
   node boulder-buddy/test.js
   ```
3. Verify that all 8 automated tests pass.

The suite loads [`crags.js`](./crags.js) and the inline application script into a sandbox ([`test.js#L43`](./test.js#L43)) and asserts:

| # | Test | Location |
| ---: | :--- | :--- |
| 1 | Dataset integrity & NSW bounding box | [`test.js#L103`](./test.js#L103) |
| 2 | Waterfall classifier priority & exhaustiveness | [`test.js#L143`](./test.js#L143) |
| 3 | Sliding lookback moisture propagation | [`test.js#L185`](./test.js#L185) |
| 4 | Hard gating overrides friction to `WET_DANGER` | [`test.js#L241`](./test.js#L241) |
| 5 | Ambient friction scoring & NaN safety | [`test.js#L258`](./test.js#L258) |
| 6 | V-grade parser & overlap filter predicates | [`test.js#L283`](./test.js#L283) |
| 7 | Open-Meteo batch URL builder | [`test.js#L308`](./test.js#L308) |
| 8 | `parseResponse()` robustness against null telemetry | [`test.js#L330`](./test.js#L330) |

---

## 8. Upcoming Features

- [x] Add all Sydney bouldering crags into [`CRAGS_DATA`](./crags.js#L6).
