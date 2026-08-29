# 🎨 Editorial Paper Design System

The **Editorial Paper** design system powers the interactive toys, web tools, and mental calculation trainers across the Playground. It blends **tactile neo-brutalist physics**, **editorial print typography**, and a **clean paper palette** to create interfaces that feel responsive, physical, and durable.

---

## 1. Core Principles

1. **Tactile Physics**: Interactive elements behave like physical mechanical buttons. Clicks press inward (`translate(1.5px, 1.5px)` with zero shadow), and cards lift on hover.
2. **Sharp Neo-Brutalist Geometry**: Solid `1.5px` dark zinc (`#27272a`) borders and crisp, unblurred drop shadows (`#27272a`) define every surface.
3. **Paper & Ink Foundation**: Warm off-white paper canvas (`#f7f6f2`) paired with pure white cards (`#ffffff`) and deep zinc typography (`#18181b`).
4. **Purpose-Driven Typography**: `Plus Jakarta Sans` for human communication; `JetBrains Mono` for numbers, calculations, keyboard shortcuts, and technical metadata.
5. **Keyboard-First Ergonomics**: Power users can navigate, trigger, and dismiss interfaces without taking their hands off the keyboard, reinforced by visual `<kbd>` hints.

---

## 2. Color Palette Tokens

### 2.1 The Paper Palette (`paper`)

```javascript
colors: {
  paper: {
    50: '#ffffff',   // Card & modal background, pure white highlights
    100: '#f7f6f2',  // Base document canvas, input/select backgrounds
    200: '#f0eee6',  // Secondary panels, button hover fill, table headers
    300: '#e5e2d6',  // Progress bar tracks, subtle dividers
    400: '#ccc7b6',  // Scrollbar thumbs
    800: '#27272a',  // Dark neo-brutalist borders, hard shadows, primary outlines
    900: '#18181b',  // Primary typography color, headers, high-contrast text
  }
}
```

### 2.2 The Cobalt Interactive Accent (`cobalt`)

Used for active filters, primary CTAs, selection states, and focus rings:

```javascript
colors: {
  cobalt: {
    50: '#eff6ff',   // Highlight card fills, subtle selection tints
    100: '#dbeafe',  // Active badge fills, correct answer feedback
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Focus rings, active outlines
    600: '#2563eb',
    700: '#1d4ed8',  // Primary brand buttons, active filter pills, CTA links
    800: '#1e40af',  // Hover state for primary brand buttons
    900: '#1e3a8a',  // Deep cobalt typography
  }
}
```

### 2.3 Semantic Status & Safety Matrix

All status badges use `border-[1.5px] border-paper-800` outlines paired with semantic background tints and indicator dots:

| Status Tier | Background & Text | Indicator Dot | Meaning |
| :--- | :--- | :--- | :--- |
| **Prime / Perfect** | `bg-emerald-50 text-emerald-950` | `bg-emerald-500` | Ideal conditions, 100% accuracy, optimal state |
| **Good / Playable** | `bg-lime-50 text-lime-950` | `bg-lime-500` | Safe, verified, playable |
| **Fair / Neutral** | `bg-amber-50 text-amber-950` | `bg-amber-500` | Sub-optimal, warm/greasy, advisory notice |
| **Damp / Caution** | `bg-orange-50 text-orange-950` | `bg-orange-500` | Cautionary threshold, reduced grip/performance |
| **Danger / Error** | `bg-rose-50 text-rose-950` or `bg-red-50 text-red-950` | `bg-red-500` | Soft sandstone fragility danger, incorrect answer |

---

## 3. Typography & Hierarchy

### 3.1 Font Stacks

```html
<!-- Google Fonts CDN -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### 3.2 Font Distribution Rules

- **`Plus Jakarta Sans` (`font-sans`)**:
  - Page branding and app titles (`font-extrabold tracking-tight`).
  - Card headings, buttons, and navigation links.
  - Explanatory copy, rules, descriptions, and local tips.
- **`JetBrains Mono` (`font-mono`)**:
  - All numbers, stopwatches, live timers, scores, and percentages.
  - Dates, timestamps, and geographic coordinates.
  - Keyboard hint tags (`<kbd>`).
  - **All Section Eyebrow Labels** (`text-xs font-extrabold uppercase font-mono tracking-wider text-zinc-500`).

### 3.3 Type Scale Reference

```
Display Numbers: text-3xl sm:text-5xl font-black tracking-tight (Doomsday flashcard date)
Modal Titles:    text-xl sm:text-2xl font-extrabold text-paper-900
Card Titles:     text-base sm:text-lg font-extrabold text-paper-900
Eyebrows:        text-xs font-extrabold uppercase font-mono tracking-wider text-zinc-500
Body Copy:       text-xs sm:text-sm font-medium text-zinc-600 leading-relaxed
Micro / Meta:    text-[10px] sm:text-[11px] font-mono font-bold text-zinc-600
```

---

## 4. Neo-Brutalist Layout & Physics

### 4.1 Shadow Scale & Tailwind Config

```javascript
boxShadow: {
  'editorial-sm': '1.5px 1.5px 0px 0px #27272a',
  'editorial':    '2px 2px 0px 0px #27272a',
  'editorial-lg': '3px 3px 0px 0px #27272a',
}
```

### 4.2 Standard Corner Radiuses

- **`rounded-2xl` (16px)**: Primary container cards, modals, hero panels.
- **`rounded-xl` (12px)**: Buttons (`.btn-editorial`), search inputs, `<select>` dropdowns.
- **`rounded-lg` (8px)**: Badges, chips, mini-day forecast buttons.
- **`rounded-full`**: Indicator dots, progress bars, circular status badges.

### 4.3 Interactive Physics CSS

```css
/* Base Canvas */
body {
  background-color: #f7f6f2;
  color: #18181b;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Card Surface with Subtle Hover Lift */
.card-editorial {
  background-color: #ffffff;
  border: 1.5px solid #27272a;
  box-shadow: 2px 2px 0px 0px #27272a;
  transition: all 0.15s ease;
}
.card-editorial:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0px 0px #27272a;
}

/* Mechanical Push Button with Active Depression */
.btn-editorial {
  background-color: #ffffff;
  border: 1.5px solid #27272a;
  box-shadow: 1.5px 1.5px 0px 0px #27272a;
  transition: all 0.1s ease;
}
.btn-editorial:hover {
  background-color: #f0eee6;
  transform: translate(-0.5px, -0.5px);
}
.btn-editorial:active {
  transform: translate(1.5px, 1.5px);
  box-shadow: 0px 0px 0px 0px #27272a;
}

/* Global Paper Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #f0eee6;
}
::-webkit-scrollbar-thumb {
  background: #ccc7b6;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #27272a;
}
```

---

## 5. UI Component Library

### 5.1 Buttons & CTAs

```html
<!-- Default Action Button -->
<button class="btn-editorial px-3 py-1.5 rounded-xl text-xs font-bold text-paper-900 flex items-center gap-1.5">
  <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
  <span>Refresh</span>
</button>

<!-- Primary Brand Button -->
<button class="btn-editorial px-4 py-2 rounded-xl text-xs font-extrabold bg-cobalt-700 text-white border-paper-800 shadow-editorial hover:bg-cobalt-800 flex items-center gap-2">
  <span>Start Session</span>
  <kbd class="px-1.5 py-0.5 rounded bg-cobalt-800 border border-white/40 text-white font-mono text-[10px]">Space</kbd>
</button>

<!-- Filter Pill (Active) -->
<button class="btn-editorial px-3 py-1.5 rounded-xl text-xs font-extrabold bg-cobalt-700 text-white border-paper-800 shadow-editorial hover:bg-cobalt-800">
  Active Filter
</button>

<!-- Filter Pill (Inactive) -->
<button class="btn-editorial px-3 py-1.5 rounded-xl text-xs font-bold text-paper-900">
  Inactive Filter
</button>
```

### 5.2 Form Inputs & Selects

```html
<!-- Live Search Box with Keyboard Shortcut -->
<div class="relative w-full">
  <i data-lucide="search" class="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
  <input type="text" placeholder="Search crags or problems..." class="w-full bg-paper-100 border-[1.5px] border-paper-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-paper-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-cobalt-500 font-medium">
  <kbd class="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-paper-200 border border-paper-800 text-zinc-600 font-mono text-[10px] font-bold">
    /
  </kbd>
</div>

<!-- Select Dropdown -->
<select class="w-full bg-paper-100 border-[1.5px] border-paper-800 rounded-xl px-2.5 py-1.5 text-xs text-paper-900 font-bold focus:outline-none focus:bg-white">
  <option value="all">📍 All Regions</option>
  <option value="sydney-east">Sydney East</option>
</select>
```

### 5.3 Badges & Chips

```html
<!-- Semantic Status Badge (Neo-brutalist Outlined) -->
<span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-950 border-[1.5px] border-paper-800 text-[11px] font-extrabold flex items-center gap-1.5 shadow-editorial-sm">
  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
  Prime / Crisp
</span>

<!-- Standard Meta Chip -->
<span class="px-2 py-0.5 rounded-md bg-paper-200 border border-paper-800 text-paper-900 text-xs font-bold">
  Mental Math
</span>

<!-- Keyboard Hint Badge -->
<kbd class="px-1.5 py-0.5 rounded bg-paper-200 border border-paper-800 text-paper-900 font-mono text-[10px] font-bold shadow-editorial-sm">
  Esc
</kbd>
```

### 5.4 Dual Progress Indicator Bars

```html
<div class="space-y-1 text-[10px] font-mono">
  <div class="flex justify-between text-zinc-600">
    <span>Rock Dryness</span>
    <span class="font-bold text-paper-900">92%</span>
  </div>
  <div class="w-full bg-paper-300 rounded-full h-1.5 overflow-hidden border border-paper-800/20">
    <div class="h-full bg-emerald-500 transition-all duration-300" style="width: 92%"></div>
  </div>
</div>
```

---

## 6. Modal & Overlay System

### 6.1 Standard Modal Markup Pattern

All modal dialogs adhere to the following architecture:
1. **Backdrop**: `bg-paper-900/60 backdrop-blur-sm` with `onclick="app.closeModal('modal-id')"` to ensure click-outside dismissal.
2. **Container**: `card-editorial bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto` with `onclick="event.stopPropagation()"`.
3. **Close Button**: Standard `.btn-editorial` with `data-lucide="x"`.
4. **Keyboard Binding**: Unconditional listener on window closing any open modal upon pressing `Escape`.

```html
<div id="example-modal" onclick="app.closeModal('example-modal')" class="fixed inset-0 z-50 bg-paper-900/60 backdrop-blur-sm hidden items-center justify-center p-3 sm:p-6 overflow-y-auto">
  <div class="card-editorial bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
    
    <!-- Modal Header -->
    <div class="flex items-start justify-between gap-3 border-b-[1.5px] border-paper-200 pb-3">
      <div>
        <span class="text-xs font-extrabold uppercase font-mono tracking-wider text-zinc-500">Eyebrow Label</span>
        <h2 class="text-xl sm:text-2xl font-extrabold text-paper-900">Modal Header Title</h2>
      </div>
      <button onclick="app.closeModal('example-modal')" class="btn-editorial p-2 rounded-xl text-zinc-700 hover:text-paper-900" title="Close modal (Esc)">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    </div>

    <!-- Modal Content Body -->
    <div class="space-y-3 text-xs text-zinc-700">
      <p>Modal body content goes here.</p>
    </div>

    <!-- Modal Footer Actions -->
    <div class="flex items-center justify-end gap-2 pt-3 border-t-[1.5px] border-paper-200">
      <button onclick="app.closeModal('example-modal')" class="btn-editorial px-4 py-1.5 rounded-xl text-xs font-bold text-paper-900">
        Done
      </button>
    </div>

  </div>
</div>
```

---

## 7. Global Keyboard Navigation Standards

To guarantee power-user delight across all mini-apps, follow this shortcut matrix:

| Key | Global Action | App Context |
| :--- | :--- | :--- |
| `Escape` | Close active modal, pause active game session | Universal |
| `/` | Focus primary search input filter | Hub & Boulder Buddy |
| `Space` or `Enter` | Primary CTA trigger (Start Game, Play Again, Dismiss Modal) | Universal |
| `1` – `7` | Select answer day or switch 7-day forecast day index | Doomsday & Boulder Buddy |
| `F` | Toggle favorite crags filter | Boulder Buddy |
| `H` | Open Step-by-Step Calculation Hint modal | Doomsday |
| `R` | Reset view / bounds / filters | Universal |
