# Doomsday Rule Trainer

The Doomsday Rule Trainer is a mental calculation practice tool.
It calculates the day of the week for any Gregorian calendar date.

---

## 1. Overview

John Horton Conway designed the Doomsday algorithm.
The algorithm calculates the day of the week with basic mental arithmetic.
This application runs completely in the web browser without external servers.

---

## 2. Calculation Steps

Follow these four steps to calculate the day of the week:

1. Identify the Century Anchor Day:
   - 1700s: Sunday (0)
   - 1800s: Friday (5)
   - 1900s: Wednesday (3)
   - 2000s: Tuesday (2)
2. Calculate the Year Anchor Day:
   - Take the last two digits of the year ($Y$).
   - Compute the offset using $(Y + \lfloor Y / 4 \rfloor) \pmod 7$.
   - Add this offset to the Century Anchor Day modulo 7.
3. Find the Month Anchor Date:
   - January: 3 (4 in leap years)
   - February: 28 (29 in leap years)
   - March: 14 (Pi Day)
   - Even Months: 4/4, 6/6, 8/8, 10/10, 12/12
   - Odd Months: 5/9, 9/5, 7/11, 11/7
4. Calculate the Day Offset:
   - Find the difference between the target date and the month anchor.
   - Add this difference to the Year Anchor Day modulo 7.

---

## 3. Game Modes

The application provides three practice modes:

- **Sprint Mode**: Solve a fixed set of 10, 25, or 50 dates.
- **Time Attack Mode**: Solve as many dates as possible in 60 or 120 seconds.
- **Endless Mode**: Practice with unlimited dates and immediate step-by-step feedback.

---

## 4. Keyboard Controls

Use these keyboard shortcuts for fast input:

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
| `H` | Show calculation hint breakdown |
| `P` or `Esc` | Pause session |
| `Space` or `Enter` | Resume session or proceed |

---

## 5. Technical Architecture

- **Single Page Application**: Self-contained in `index.html`.
- **Styling**: Tailwind CSS via CDN with the Editorial Paper Design System.
- **Icons**: Lucide Icons via CDN.
- **Audio**: Web Audio API generates all audio effects dynamically.
- **Storage**: Browser `localStorage` stores user statistics and personal records.
