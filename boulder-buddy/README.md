# Sydney Boulder Buddy

Sydney Boulder Buddy forecasts rock dryness and friction for outdoor bouldering.
The application evaluates sandstone conditions across Sydney, Blue Mountains, and Central Coast crags.

---

## 1. Overview

Hawkesbury sandstone absorbs water and becomes weak after rainfall.
Climbing on wet sandstone can break fragile holds and damage the rock.
This application predicts safe climbing conditions using a two-tier mathematical engine.

---

## 2. Condition Scoring Model

The application uses a two-tier evaluation model:

1. **Sandstone Moisture Gating (Tier 1)**:
   - The engine checks recent precipitation.
   - If rainfall exceeds 1.5 mm, the engine sets status to `WET_DANGER`.
   - The engine models drying decay over a 3-day window.
2. **Ambient Friction Scoring (Tier 2)**:
   - When the rock is dry, the engine calculates a friction score from 0 to 100.
   - Optimal friction requires cold temperature (below 16°C) and low dew point (below 10°C).
   - High humidity and hot temperatures reduce friction scores.

---

## 3. Keyboard Shortcuts

Use these keyboard shortcuts to navigate the application:

| Key | Action |
| :--- | :--- |
| `/` | Focus crag search bar |
| `1` – `7` | Select forecast day on timeline |
| `F` | Toggle favorite crags filter |
| `R` | Reset map zoom and bounds |
| `Esc` | Close crag detail modal |

---

## 4. Verification and Tests

Run the automated verification test suite with Node.js:

1. Open your terminal in the repository root.
2. Run the test command:
   ```bash
   node boulder-buddy/test.js
   ```
3. Verify that all 8 automated tests pass.

---

## 5. Upcoming Features

- [x] Add a SKILL that extracts crag information from theCrag given a crag name.
- [ ] Add all Sydney bouldering crags into `CRAGS_DATA`.
