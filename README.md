# 🎪 Playground: Tools & Personal Projects

A personal collection of tools and web projects built for things that interest me or that I find useful.

Every link in this document points at the exact file (and where useful, the exact line) that implements the behaviour described.

---

## 📁 Repository Structure

```
├── index.html                 # 🌟 Main playground homepage & project launcher
├── doomsday/                  # 📅 The Doomsday Rule Trainer
│   ├── index.html             # Self-contained SPA
│   └── README.md              # Conway mental calculation guide & controls
├── boulder-buddy/             # 🧗 Sydney Boulder Buddy (Dryness & Friction Forecaster)
│   ├── index.html             # Self-contained SPA
│   ├── crags.js               # Dedicated verified crag dataset
│   ├── README.md              # Sandstone drying physics & crags guide
│   └── test.js                # Zero-dependency verification test suite
├── builder/                   # 📱 Mobile Studio Builder (AI app generator)
│   ├── index.html             # Self-contained SPA client
│   ├── README.md              # Deployment & environment variable guide
│   └── test.js                # Builder & API route verification suite
├── api/                       # ☁️ Vercel serverless functions backing the Builder
│   ├── generate.js            # Gemini generation + model output parser
│   └── commit.js              # GitHub commit, card/README injection, path validation
├── docs/
│   └── design-system/         # 🎨 Editorial Paper Design System documentation & tokens
│       ├── DESIGN_SYSTEM.md
│       └── preview.html       # Design system typography & component studio
├── AGENTS.md                  # 🤖 AI Agent guidelines & architecture
└── README.md                  # Documentation & Project Directory
```

| Path | Purpose |
| :--- | :--- |
| [`index.html`](./index.html) | Launcher homepage, project cards, and category filter |
| [`doomsday/index.html`](./doomsday/index.html) | Doomsday Rule Trainer SPA |
| [`boulder-buddy/index.html`](./boulder-buddy/index.html) | Boulder Buddy SPA |
| [`boulder-buddy/crags.js`](./boulder-buddy/crags.js) | 58-crag verified dataset |
| [`builder/index.html`](./builder/index.html) | Mobile Studio Builder client |
| [`api/generate.js`](./api/generate.js) | Serverless generation endpoint |
| [`api/commit.js`](./api/commit.js) | Serverless GitHub commit endpoint |
| [`docs/design-system/DESIGN_SYSTEM.md`](./docs/design-system/DESIGN_SYSTEM.md) | Editorial Paper tokens & components |
| [`AGENTS.md`](./AGENTS.md) | Agent guidelines & engineering invariants |

---

## 🚀 Live Projects

### 1. [Doomsday Rule Trainer](./doomsday/)
Master John Horton Conway's mental calculation algorithm to determine the day of the week for any date in seconds.
- **Modes**: Sprint (10/25/50), Time Attack (60s/120s), and Endless Practice — see [`selectMode()`](./doomsday/index.html#L1107) and [`startGame()`](./doomsday/index.html#L1177).
- **Algorithm**: [`calculateDoomsday()`](./doomsday/index.html#L938), built on [`getCenturyAnchor()`](./doomsday/index.html#L888) and the Odd+11 routine [`calculateOdd11()`](./doomsday/index.html#L900).
- **Controls**: Number keys `1–7` / `0`, letter shortcuts `M T W R F S U`, and click buttons — all wired in [`bindEvents()`](./doomsday/index.html#L1685).
- **Step-by-Step Breakdown**: On-demand calculation steps for hints and mistakes via [`showInGameHint()`](./doomsday/index.html#L1538) and [`showBreakdownModal()`](./doomsday/index.html#L1548).
- **Zero Dependencies**: Single-file HTML, Tailwind CSS, Lucide icons, and Web Audio API synthesized sounds ([`initAudio()`](./doomsday/index.html#L1033)).
- **Documentation**: See [`doomsday/README.md`](./doomsday/README.md).

### 2. [Sydney Boulder Buddy](./boulder-buddy/)
Real-time Sydney bouldering weather forecaster, rock dryness evaluator, and friction index calculator.
- **Coverage**: 58 curated crags across 4 regions (Northern Beaches & North Shore, Inner West & Parramatta, Eastern Suburbs, South & Sutherland) in [`crags.js`](./boulder-buddy/crags.js#L6).
- **Condition Engine**: Two-tier model gating on sandstone fragility and ambient friction scoring — [`ConditionEngine`](./boulder-buddy/index.html#L484).
- **7-Day Interactive Timeline**: Forecast and inspect dryness and friction day-by-day across all crags — [`renderGlobalTimeline()`](./boulder-buddy/index.html#L1176).
- **Interactive Map**: Custom condition-coded SVG markers, search, region & grade filters, and favorites — [`MapController`](./boulder-buddy/index.html#L841) and [`UIController`](./boulder-buddy/index.html#L1000).
- **Client-Side & Offline Ready**: Batch API queries via Open-Meteo with 30-minute caching ([`CACHE_TTL_MS`](./boulder-buddy/index.html#L674)) and synthetic fallback data ([`generateFallbackDataset()`](./boulder-buddy/index.html#L775)).
- **Documentation**: See [`boulder-buddy/README.md`](./boulder-buddy/README.md).

### 3. [Studio Builder](./builder/)
Mobile-first creation studio that generates, previews, and deploys new single-file apps into this repository.
- **Generation**: [`handleGenerate()`](./builder/index.html#L568) posts to [`api/generate.js`](./api/generate.js#L174), which parses model output with [`parseModelOutput()`](./api/generate.js#L49).
- **Sandboxed Preview**: [`setPreviewContent()`](./builder/index.html#L435) injects an error trap into a restricted iframe ([`sandbox` attribute](./builder/index.html#L271)).
- **Deployment**: [`handleCommit()`](./builder/index.html#L653) posts to [`api/commit.js`](./api/commit.js#L158), which injects the new project card ([`injectCardIntoIndexHtml()`](./api/commit.js#L73)) and README entry ([`injectEntryIntoReadme()`](./api/commit.js#L100)).
- **Documentation**: See [`builder/README.md`](./builder/README.md).

---

## 🛠️ How to Add a New Project

Follow these steps to add a new mini-app:

1. Create a dedicated folder for your project (e.g., `memory-matrix/`).
2. Build your single-file application in `memory-matrix/index.html`.
3. Consult the [Editorial Paper Design System](docs/design-system/DESIGN_SYSTEM.md) for styling tokens and buttons.
4. Add a project card to [`index.html`](./index.html) — mirror the markup produced by [`generateProjectCardHtml()`](./api/commit.js#L29) and bump the `All (n)` counter on the [filter button](./index.html#L160).
5. Add a `README.md` file inside the new project directory.
6. Commit and push to GitHub to publish your application.

The Studio Builder automates steps 2, 4, and 6 — see [`api/commit.js`](./api/commit.js#L158).

> ⚠️ The heading above (`## 🛠️ How to Add a New Project`) is an insertion anchor. [`injectEntryIntoReadme()`](./api/commit.js#L100) splices new project entries immediately before it, so do not rename it.

---

## 🧪 Verification and Tests

Run both suites with Node.js from the repository root:

```bash
npm test
```

That runs, in order:

| Suite | Command | Covers |
| :--- | :--- | :--- |
| [`builder/test.js`](./builder/test.js) | `node builder/test.js` | Design tokens, sandbox isolation, [`parseModelOutput()`](./api/generate.js#L49), card/README injection, and [`validateAppDataSecurity()`](./api/commit.js#L114) path-traversal guards |
| [`boulder-buddy/test.js`](./boulder-buddy/test.js) | `node boulder-buddy/test.js` | 8 assertions over the crag dataset and [`ConditionEngine`](./boulder-buddy/index.html#L484) / [`WeatherService`](./boulder-buddy/index.html#L672) |

Ensure that all test assertions pass before committing.
