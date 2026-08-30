# 🎪 Playground: Tools & Personal Projects

A personal collection of tools and web projects built for things that interest me or that I find useful.

---

## 📁 Repository Structure

```
├── index.html                 # 🌟 Main playground homepage & project launcher
├── builder/                   # 📱 Mobile Studio Builder
│   ├── index.html             # Mobile creation studio & live preview
│   ├── README.md              # Studio documentation & Vercel guide
│   └── test.js                # Builder verification test suite
├── api/                       # ⚡ Vercel Serverless APIs
│   ├── generate.js            # Gemini AI code generator endpoint
│   └── commit.js              # GitHub atomic commit endpoint
├── doomsday/                  # 📅 The Doomsday Rule Trainer
│   ├── index.html             # Self-contained SPA
│   └── README.md              # Conway mental calculation guide & controls
├── boulder-buddy/             # 🧗 Sydney Boulder Buddy (Dryness & Friction Forecaster)
│   ├── index.html             # Self-contained SPA
│   ├── README.md              # Sandstone drying physics & crags guide
│   └── test.js                # Zero-dependency verification test suite
├── docs/
│   └── design-system/         # 🎨 Editorial Paper Design System documentation & tokens
│       ├── DESIGN_SYSTEM.md
│       └── preview.html       # Design system typography & component studio
├── AGENTS.md                  # 🤖 AI Agent guidelines & architecture
└── README.md                  # Documentation & Project Directory
```

---

## 🚀 Live Projects

### 1. [Studio Builder](./builder/)
Mobile-first AI creation studio for the Playground.
- **Conversational Builder**: Generate single-file web applications using Gemini 3.7 Flash.
- **Live Preview Sandbox**: Test and play with generated applications directly in an interactive mobile frame.
- **One-Tap Deployment**: Commit and push new applications directly to GitHub.
- **Documentation**: See [`builder/README.md`](./builder/README.md).

### 2. [Doomsday Rule Trainer](./doomsday/)
Master John Horton Conway's mental calculation algorithm to determine the day of the week for any date in seconds.
- **Modes**: Sprint (10/25/50), Time Attack (60s/120s), and Endless Practice.
- **Controls**: Number keys `1–7` / `0`, letter shortcuts `M T W R F S U`, and click buttons.
- **Step-by-Step Breakdown**: On-demand calculation steps for hints and mistakes.
- **Zero Dependencies**: Single-file HTML, Tailwind CSS, Lucide icons, and Web Audio API synthesized sounds.
- **Documentation**: See [`doomsday/README.md`](./doomsday/README.md).

### 3. [Sydney Boulder Buddy](./boulder-buddy/)
Real-time Sydney bouldering weather forecaster, rock dryness evaluator, and friction index calculator.
- **Coverage**: 18 curated crags across 6 regions (Sydney East, North, Inner West, South, Blue Mountains, Central Coast).
- **Condition Engine**: Two-tier model gating on sandstone fragility and ambient friction scoring.
- **7-Day Interactive Timeline**: Forecast and inspect dryness and friction day-by-day across all crags.
- **Interactive Map**: Custom condition-coded SVG markers, search, region & grade filters, and favorites.
- **Client-Side & Offline Ready**: Batch API queries via Open-Meteo with 30-minute caching and synthetic fallback data.
- **Documentation**: See [`boulder-buddy/README.md`](./boulder-buddy/README.md).

---

## 🛠️ How to Add a New Project

Follow these steps to add a new mini-app:

1. Create a dedicated folder for your project (e.g., `memory-matrix/`).
2. Build your single-file application in `memory-matrix/index.html`.
3. Consult the [Editorial Paper Design System](docs/design-system/DESIGN_SYSTEM.md) for styling tokens and buttons.
4. Add a project card to [`index.html`](./index.html).
5. Add a `README.md` file inside the new project directory.
6. Commit and push to GitHub to publish your application.

---

## 🧪 Verification and Tests

Run the test suite with Node.js:

1. Open your terminal in the repository root.
2. Run the automated test runner:
   ```bash
   node boulder-buddy/test.js
   ```
3. Ensure that all test assertions pass.
