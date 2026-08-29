# Doomsday Rule Day-of-the-Week Calculation Trainer

A sleek, ultra-responsive standalone web application designed to train and benchmark mental calculation of the day of the week for any date using John Conway's **Doomsday Rule**.

## Design Specifications

> [!NOTE]
> All key design decisions from our grill-me session:
> - **Zero-dependency standalone webapp**: Pure single-file HTML/CSS/JS with Tailwind CSS & Lucide icons via CDN, opening instantly in any browser.
> - **Doomsday Rule Engine**: Step-by-step breakdown (Century anchor, Year offset, Month doomsday anchor, Day offset) available for hints, mistakes, or post-round review.
> - **Game Modes**: Sprint (10/25/50 dates), Time Attack (60s/120s), and Endless / Free Practice (Zen mode).
> - **Input Controls**: Number keys `1`–`7` (`1`=Mon ... `7`=Sun, plus `0`=Sun), letter hotkeys (`M, T, W, R, F, S, U`), and large touch/clickable buttons.
> - **Date Ranges**: Presets (Current Year, 2000–2099, 1900–1999, 1900–2099, All Centuries 1600–2400) + Custom year range picker.
> - **Statistics & Persistence**: LocalStorage-saved personal bests, average solve times, accuracy %, and recent session review logs.

---

## Proposed Changes

We will build the complete application in `~/Projects/day-of-the-week-trainer/index.html` (along with a helpful `README.md`).

### Application Core (`day-of-the-week-trainer`)

#### [NEW] [index.html](file:///Users/xinweic/Projects/day-of-the-week-trainer/index.html)
- **Doomsday Algorithm Engine**:
  - Exact Gregorian calendar day-of-the-week calculation.
  - Step 1: Century Anchor calculation (\(1700 \to \text{Sun (0)}, 1800 \to \text{Fri (5)}, 1900 \to \text{Wed (3)}, 2000 \to \text{Tue (2)}\) via \((5 \times (C \pmod 4) \pmod 7 + 2) \pmod 7\)).
  - Step 2: Year Doomsday calculation using Conway's rule (\(\lfloor y/12 \rfloor + (y \bmod 12) + \lfloor (y \bmod 12)/4 \rfloor\)) or \(y + \lfloor y/4 \rfloor \pmod 7\).
  - Step 3: Month Anchor lookup with leap year handling:
    - Jan 3 (Jan 4 in leap years)
    - Feb 28 (Feb 29 in leap years)
    - Mar 14 ("Pi Day" / 0th of March)
    - Apr 4, Jun 6, Aug 8, Oct 10, Dec 12 (Even months \(4/4, 6/6, 8/8, 10/10, 12/12\))
    - May 9 ("9 to 5 at 7-11"), Sep 5, Jul 11, Nov 7
  - Step 4: Day difference modulo 7 and final result synthesis.
- **Game Mode Managers**:
  - **Sprint Mode**: Configurable target count (10, 25, 50). Tracks split times, overall time, errors, and personal records.
  - **Time Attack Mode**: Countdown timer (60s, 120s). Dynamic pace tracker and streak bonus counter.
  - **Endless Mode**: Untimed/live-timer free practice with optional instant explanation on every answer or mistake.
- **Interactive UI & Controls**:
  - High-visibility date card with configurable formats (`14 July 1789`, `July 14, 1789`, `1789-07-14`).
  - 7 large day buttons with keyboard shortcut badges.
  - Global hotkey listener (`1-7`, `0`, `M/T/W/R/F/S/U`, `Space` for next/restart, `H` for hint breakdown).
  - Live HUD with accurate millisecond timer, streak counter, and progress bar.
  - Dark / Light theme toggle with smooth transitions.
  - Optional subtle Web Audio sound effects (synthesized right/wrong chimes, zero external asset dependencies).
- **Session Results & Detailed Analytics**:
  - Post-round breakdown modal with full round summary.
  - Interactive table of past answers with clickable "View Doomsday Breakdown" modal showing the exact 4-step calculation for that date.
  - Persistent High Scores and lifetime statistics saved to `localStorage`.

#### [NEW] [README.md](file:///Users/xinweic/Projects/day-of-the-week-trainer/README.md)
- Documentation of features, keyboard shortcuts, Doomsday rule cheat sheet, and how to run/open the app in browser.

---

## Verification Plan

### Automated / Browser Verification
- Open the web app via a local HTTP server or direct file protocol.
- Verify Doomsday calculation engine against known landmark dates:
  - 1776-07-04 (Thursday)
  - 1789-07-14 (Tuesday)
  - 1969-07-20 (Sunday)
  - 2000-01-01 (Saturday - leap century)
  - 1900-02-28 (Wednesday - non-leap century)
  - 2024-02-29 (Thursday - leap year)
  - 2026-08-29 (Saturday - today's date)
- Test keyboard shortcuts (`1-7`, `0`, `M/T/W/R/F/S/U`, `Space`, `H`).
- Test game modes: Sprint mode completion, Time Attack countdown expiration, Endless practice loop.
- Test Doomsday step-by-step breakdown accuracy and modal display.
- Test `localStorage` persistence of personal records and session history.
