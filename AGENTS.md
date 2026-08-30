# 🤖 Agent Instructions & Repository Guidelines

Welcome to the **Playground** repository! This document establishes operational guidelines, architectural conventions, and design requirements for all AI coding agents working in this codebase.

---

## 🎨 1. Design System Compliance (MANDATORY)

> [!IMPORTANT]
> Whenever designing, styling, modifying, or creating UI components, pages, or mini-apps in this repository, you **MUST** consult and adhere to the **Editorial Paper Design System**:
> 
> 📄 **[Editorial Paper Design System Guide](docs/design-system/DESIGN_SYSTEM.md)**

### Core Visual Standards Summary
- **Palette**: Warm paper backgrounds (`paper-100: #f7f6f2`), pure white cards (`paper-50: #ffffff`), deep zinc typography (`paper-900: #18181b`), and cobalt brand accents (`cobalt-700: #1d4ed8`).
- **Borders**: Standardized `1.5px solid #27272a` (`border-[1.5px] border-paper-800`) across all inputs, dropdowns, cards, badges, and modal frames.
- **Shadow Presets**:
  - `shadow-editorial-sm`: `1.5px 1.5px 0px 0px #27272a`
  - `shadow-editorial`: `2px 2px 0px 0px #27272a`
  - `shadow-editorial-lg`: `3px 3px 0px 0px #27272a`
- **Typography Division**:
  - `Plus Jakarta Sans`: All UI headings, buttons, body copy, and descriptions.
  - `JetBrains Mono`: All numbers, timers, scores, percentages, formulas, `<kbd>` badges, and **all section eyebrow labels** (`text-xs font-extrabold uppercase font-mono tracking-wider text-zinc-500`).
- **Button Physics**: `.btn-editorial` with `-0.5px` hover lift and `translate(1.5px, 1.5px)` active mechanical depression with `0px` shadow collapse.
- **Modals**: `bg-paper-900/60 backdrop-blur-sm` backdrop with click-outside-to-dismiss, `Escape` key dismissal, and `rounded-2xl` card containers.
- **Keyboard Discoverability**: Visual `<kbd>` hint badges for rapid keyboard navigation across tools.

---

## 🏗️ 2. Repository Architecture

This repository is built as a zero-build-step, static playground inspired by sites like [neal.fun](https://neal.fun).

```
├── .agents/
│   └── skills/
│       └── thecrag-extractor/ # 🧗 Skill: Extract bouldering crags from theCrag
├── index.html                 # 🌟 Main playground portal & project launcher
├── doomsday/                  # 📅 The Doomsday Rule Trainer
│   ├── index.html             # Self-contained SPA
│   └── README.md              # Conway mental calculation guide & controls
├── boulder-buddy/             # 🧗 Sydney Boulder Buddy
│   ├── index.html             # Self-contained SPA
│   ├── crags.js               # Dedicated verified crag dataset
│   ├── README.md              # Sandstone drying physics & crags guide
│   └── test.js                # Zero-dependency verification test suite
├── hangboard-timer/           # ⏱️ CrimpLab — Hangboard Protocol Timer
│   └── index.html             # Self-contained SPA
├── docs/
│   └── design-system/
│       ├── DESIGN_SYSTEM.md   # 🎨 Unified design system reference
│       └── preview.html       # Design system typography & component preview studio
├── AGENTS.md                  # 🤖 AI Agent guidelines (this file)
└── README.md                  # Project overview & documentation
```

### Key Engineering Invariants
1. **Self-Contained Mini-Apps**: Each mini-app directory (e.g. `doomsday/`, `boulder-buddy/`) should be standalone and runnable by directly opening its `index.html` in any modern web browser without a build or bundler step.
2. **External CDNs**: Use Tailwind CSS CDN, Lucide Icons CDN, and Google Fonts (`Plus Jakarta Sans` & `JetBrains Mono`). Keep third-party client dependencies minimal, lightweight, and keyless (e.g. Leaflet.js with standard OpenStreetMap tiles).
3. **Automated Verification**: When writing logic-heavy engines (such as math algorithms or weather scoring models), provide zero-dependency Node.js test runners (e.g. `test.js` using `assert` and `vm`) so changes can be verified quickly via `node <app>/test.js`.

---

## 🚀 3. Adding a New Project Checklist

When adding a new experiment, toy, or calculation trainer:

1. Create a dedicated folder with a self-contained `index.html` (e.g. `my-tool/index.html`).
2. Adhere to the [Design System](docs/design-system/DESIGN_SYSTEM.md) for all typography, buttons, layout, and modal components.
3. Add a project card in the root [`index.html`](index.html) grid under the appropriate category filter (`all`, `games`, `tools`, `puzzles`).
4. Update [`README.md`](README.md) directory tree and live projects section.
5. Create a test suite (`test.js`) if complex algorithms or formulas are involved.

---

## 🔒 4. User Rules & Git Safety

- **Commits**: **Never make a git commit without explicit approval from the user.** Always present the completed changes and wait for explicit confirmation.
