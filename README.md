# 🎪 Playground & Web Experiments

A collection of interactive toys, mental sports, and creative web experiments inspired by sites like [neal.fun](https://neal.fun).

---

## 📁 Repository Structure

```
├── index.html                 # 🌟 Neal.fun-style Playground homepage & project launcher
├── doomsday/                  # 📅 The Doomsday Rule Trainer
│   └── index.html
├── README.md                  # Documentation & Cheat Sheets
└── implementation_plan.md     # Architecture & Design Doc
```

---

## 🚀 Live Projects

### 1. [Doomsday Rule Trainer](./doomsday/)
Master John Horton Conway's mental calculation algorithm to determine the day of the week for any date in history in seconds.
- **Modes**: Sprint (10/25/50), Time Attack (60s/120s), and Endless Practice.
- **Controls**: Number keys `1–7` / `0`, letter shortcuts `M T W R F S U`, touch/click buttons.
- **Doomsday Engine**: 4-step step-by-step breakdown (Century anchor, Year offset, Month anchor, Day offset) available for hints, mistakes, and post-round review.
- **Zero Dependencies**: Pure HTML, Tailwind CSS, Lucide icons, and Web Audio API synthesized sound effects.

---

## 🛠️ How to Add a New Project

Adding a new interactive toy or mini-game takes less than 1 minute:

1. Create a new folder for your project (e.g. `memory-matrix/`):
   ```bash
   mkdir memory-matrix
   # Build your single-file app in memory-matrix/index.html
   ```
2. Add a new project card to `index.html`:
   ```html
   <a href="./memory-matrix/" class="project-card ...">
     ...
   </a>
   ```
3. Commit and push to GitHub — it will instantly be live on your custom domain!

---

## 🌐 Deploying to GitHub Pages with Custom Domain

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Playground hub & Doomsday Trainer"
   git branch -M main
   gh repo create playground --public --source=. --push
   ```

2. **Enable GitHub Pages**:
   - Navigate to **Settings** $\to$ **Pages**.
   - Under **Build and deployment > Source**, select **Deploy from a branch** (`main` / `/ (root)`).

3. **Attach Custom Domain**:
   - In **Pages Settings**, enter your custom domain (e.g. `playground.yourdomain.com` or `yourdomain.com`).
   - Add a `CNAME` or `A` record in your DNS provider pointing to GitHub Pages.
   - Check **Enforce HTTPS**.

---

## 📖 The Doomsday Rule Cheat Sheet

### 1. Day Number Codes
`0/7 = Sun`, `1 = Mon`, `2 = Tue`, `3 = Wed`, `4 = Thu`, `5 = Fri`, `6 = Sat`.

### 2. Century Anchors (400-Year Cycle)
- **1600s, 2000s, 2400s**: **Tuesday (2)**
- **1700s, 2100s, 2500s**: **Sunday (0)**
- **1800s, 2200s, 2600s**: **Friday (5)**
- **1900s, 2300s, 2700s**: **Wednesday (3)**

### 3. Year Doomsday Offset ("Odd + 11" Method)
For the last 2 digits of the year $y$:
1. If $y$ is odd, add 11 ($y + 11$).
2. Halve the result ($y / 2$).
3. If odd, add 11.
4. Subtract from the next multiple of 7 (or $(7 - (y \bmod 7)) \bmod 7$).
*(Classic equivalent: $\lfloor y/12 \rfloor + (y \bmod 12) + \lfloor (y \bmod 12)/4 \rfloor \pmod 7$)*

### 4. Month Anchors (Always Fall on Doomsday)
- **Even Months**: 4/4, 6/6, 8/8, 10/10, 12/12
- **Odd Months**: 5/9, 7/11, 9/5, 11/7 ("9 to 5 at 7-Eleven")
- **Pi Day**: 3/14 (or March 0)
- **Jan & Feb**: Jan 3 / Feb 28 (Jan 4 / Feb 29 in leap years)
