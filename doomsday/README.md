# Doomsday Rule Trainer

The Doomsday Rule Trainer is a mental calculation practice tool.
It calculates the day of the week for any Gregorian calendar date.

Source: [`index.html`](./index.html) — a single self-contained file. The entire application is the [`DoomsdayTrainer`](./index.html#L830) class, instantiated at [`index.html#L1764`](./index.html#L1764).

---

## 1. Overview

John Horton Conway designed the Doomsday algorithm.
The algorithm calculates the day of the week with basic mental arithmetic.
This application runs completely in the web browser without external servers.

---

## 2. Code Map

| Concern | Symbol | Location |
| :--- | :--- | :--- |
| Month anchor table | `this.months` | [`index.html#L832`](./index.html#L832) |
| Setup | `init()` | [`index.html#L877`](./index.html#L877) |
| Leap year test | `isLeapYear()` | [`index.html#L884`](./index.html#L884) |
| Century anchor | `getCenturyAnchor()` | [`index.html#L888`](./index.html#L888) |
| Year anchor (Odd+11) | `calculateOdd11()` | [`index.html#L900`](./index.html#L900) |
| Full solution | `calculateDoomsday()` | [`index.html#L938`](./index.html#L938) |
| Question generation | `generateRandomDate()` | [`index.html#L974`](./index.html#L974) |
| Audio synthesis | `initAudio()` | [`index.html#L1033`](./index.html#L1033) |
| Mode selection | `selectMode()` | [`index.html#L1107`](./index.html#L1107) |
| Session start | `startGame()` | [`index.html#L1177`](./index.html#L1177) |
| Timer loop | `startTimerLoop()` | [`index.html#L1220`](./index.html#L1220) |
| Answer handling | `submitAnswer()` | [`index.html#L1356`](./index.html#L1356) |
| Results screen | `finishGame()` | [`index.html#L1443`](./index.html#L1443) |
| Hint / breakdown | `showInGameHint()` | [`index.html#L1538`](./index.html#L1538) |
| Hint / breakdown | `showBreakdownModal()` | [`index.html#L1548`](./index.html#L1548) |
| Persistence | `loadStats()` / `saveStats()` | [`index.html#L1629`](./index.html#L1629) |
| Keyboard | `bindEvents()` | [`index.html#L1685`](./index.html#L1685) |

---

## 3. Calculation Steps

Follow these four steps to calculate the day of the week. [`calculateDoomsday()`](./index.html#L938) performs all four and returns every intermediate value so the UI can render the breakdown.

1. Identify the Century Anchor Day — [`getCenturyAnchor()`](./index.html#L888):
   - 1700s: Sunday (0)
   - 1800s: Friday (5)
   - 1900s: Wednesday (3)
   - 2000s: Tuesday (2)

   The anchors repeat on a 400-year cycle; the lookup table lives at [`index.html#L891`](./index.html#L891).
2. Calculate the Year Anchor Day with the **Odd+11 method** — [`calculateOdd11()`](./index.html#L900):
   - Take the last two digits of the year ($Y$).
   - If $Y$ is odd, add 11.
   - Halve the result.
   - If that result is odd, add 11 again.
   - Subtract from the next multiple of 7 to get the offset.
   - Add this offset to the Century Anchor Day modulo 7 ([`index.html#L944`](./index.html#L944)).
3. Find the Month Anchor Date — table at [`index.html#L832`](./index.html#L832), selected at [`index.html#L947`](./index.html#L947):
   - January: 3 (4 in leap years)
   - February: 28 (29 in leap years)
   - March: 14 (Pi Day)
   - Even Months: 4/4, 6/6, 8/8, 10/10, 12/12
   - Odd Months: 5/9, 9/5, 7/11, 11/7
4. Calculate the Day Offset — [`index.html#L950`](./index.html#L950):
   - Find the difference between the target date and the month anchor.
   - Add this difference to the Year Anchor Day modulo 7.

---

## 4. Game Modes

The application provides three practice modes, dispatched by [`selectMode()`](./index.html#L1107):

- **Sprint Mode**: Solve a fixed set of 10, 25, or 50 dates — [`setSprintCount()`](./index.html#L1119).
- **Time Attack Mode**: Solve as many dates as possible in 60 or 120 seconds — [`setTimeAttackDuration()`](./index.html#L1131) and [`startTimerLoop()`](./index.html#L1220).
- **Endless Mode**: Practice with unlimited dates and immediate step-by-step feedback — [`nextQuestion()`](./index.html#L1316).

Date difficulty is bounded by presets ([`setDatePreset()`](./index.html#L1143)) and sampled by [`generateRandomDate()`](./index.html#L974).

---

## 5. Keyboard Controls

All bindings are registered in [`bindEvents()`](./index.html#L1685). The in-play key maps are at [`index.html#L1741`](./index.html#L1741) (numbers) and [`index.html#L1745`](./index.html#L1745) (letters).

| Key | Action |
| :--- | :--- |
| `1` | Select Monday |
| `2` | Select Tuesday |
| `3` | Select Wednesday |
| `4` | Select Thursday |
| `5` | Select Friday |
| `6` | Select Saturday |
| `7` or `0` | Select Sunday |
| `M, T, W, R, F, S, U` | Alternative day selection |
| `H` or `?` | Show calculation hint breakdown |
| `P`, `X`, or `Esc` | Pause session ([`pauseGame()`](./index.html#L1256)) |
| `Space` or `Enter` | Resume session or proceed ([`resumeGame()`](./index.html#L1289)) |

While the pause modal is open, `Esc` or `X` ends the session and jumps to the review screen — [`endGameAndReview()`](./index.html#L1301).

---

## 6. Technical Architecture

- **Single Page Application**: Self-contained in [`index.html`](./index.html); one [`DoomsdayTrainer`](./index.html#L830) class, no build step.
- **Styling**: Tailwind CSS via CDN with the [Editorial Paper Design System](../docs/design-system/DESIGN_SYSTEM.md).
- **Icons**: Lucide Icons via CDN.
- **Audio**: Web Audio API generates all audio effects dynamically — [`initAudio()`](./index.html#L1033), [`playCorrectSound()`](./index.html#L1069), [`playWrongSound()`](./index.html#L1076), [`playFanfareSound()`](./index.html#L1083).
- **Storage**: Browser `localStorage` stores user statistics and personal records under `dwt_stats` ([`saveStats()`](./index.html#L1642)), plus `dwt_sound` and `dwt_date_format` preferences ([`loadSettings()`](./index.html#L1646)).
