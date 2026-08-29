# Design Doc: Sydney Boulder Buddy (`boulder-buddy`)

## 1. Context & Objectives
- **Why**: Sydney's Hawkesbury sandstone offers world-class bouldering, but sandstone becomes exceptionally soft and fragile when saturated with water, making it prone to breaking holds permanently. Climbers need a fast, reliable tool to evaluate whether specific crags across Sydney and nearby day-trip areas are dry, safe to climb, and have optimal friction over the next 7 days based on recent rain history and upcoming weather.
- **Scope**:
  - **IN SCOPE**:
    - Greater Sydney bouldering crags + key day-trip areas across 6 distinct regions: Sydney East, Sydney North Shore, Sydney Inner West, Sydney South, Blue Mountains, and Central Coast (18 curated crags total).
    - Client-side weather fetching via Open-Meteo API (zero API key, CORS-enabled, timezone-aligned to `Australia/Sydney`, historical rain past 3 days + 7-day forecast).
    - Single-request batch coordinate query to Open-Meteo API to eliminate rate limits and API flooding.
    - Two-tier deterministic condition evaluation engine: (1) Hard gating on rock dryness / sandstone safety from decaying rain history & forecast; (2) Secondary friction score based on temperature, dew point, and humidity.
    - Contiguous 10-day sliding lookback window for future day evaluations.
    - Defensive date formatting (`${dateStr}T12:00:00Z`) ensuring consistent weekday names across all client timezones.
    - Responsive split-view layout (desktop side-by-side crag drawer + Leaflet interactive map; mobile drawer/toggle with `invalidateSize()` in `requestAnimationFrame`).
    - Crag search, region filtering, condition filtering, V-grade overlap range filtering, and favorite crags persistence in `localStorage`.
    - Bundled offline synthetic fallback weather dataset and visual offline indicator.
    - Automated test suite runnable via Node.js standard `assert` module: `node boulder-buddy/test.js`.
    - Integration into playground hub (`index.html`) and documentation (`README.md`).
  - **OUT OF SCOPE**:
    - Backend database or user account login.
    - Sport/Trad multi-pitch route databases (this tool focuses specifically on bouldering).
    - User-submitted live crag condition reports (must remain 100% static client-side).

---

## 2. Surfaces Touched & Architecture

### Files & Modules
- **`boulder-buddy/index.html`** `[NEW]`: Complete self-contained single-page application containing:
  - CDNs: Tailwind CSS, Lucide Icons, Leaflet.js CSS & JS, Google Fonts (Plus Jakarta Sans & JetBrains Mono).
  - `CRAGS_DATA`: Static database of 18 curated Sydney & day-trip bouldering areas with exact geo-coordinates, aspect, drying profiles, seepage vulnerability, and hold characteristics across all 6 regions.
  - `WeatherService`: Open-Meteo API client with batch queries, hourly-to-daily reduction, null-coalescing (`weather_code` / `weathercode`), response caching (TTL: 30 minutes in `localStorage`), and `FALLBACK_WEATHER_DATA`.
  - `ConditionEngine`: Deterministic heuristic scoring engine computing cumulative moisture, drying rate, sandstone safety gating, and friction index using a waterfall evaluator and sliding 3-day lookback window.
  - `MapController`: Leaflet map initializer, custom SVG marker manager, map bounds auto-fitter, and `invalidateSize` lifecycle hooks.
  - `UIController`: State store, crag list renderer, detail inspector, 7-day timeline drawer, search/filter handlers, favorites manager.
- **`boulder-buddy/test.js`** `[NEW]`: Zero-dependency Node.js test suite extracting and verifying core logic from `boulder-buddy/index.html` using Node's `assert` and `vm` modules.
- **`index.html`** `[MODIFY]`: Add project card in the playground grid with category tags `tools`, status badge `Playable`, icon 🧗, and description.
- **`README.md`** `[MODIFY]`: Add entry under "Live Projects" and update repository structure diagram.

---

### Data Models & Schemas

```javascript
/** @typedef {'sydney-east' | 'sydney-north' | 'sydney-inner-west' | 'sydney-south' | 'blue-mountains' | 'central-coast'} RegionId */
/** @typedef {'PRIME' | 'GOOD' | 'FAIR' | 'DAMP' | 'WET_DANGER'} ConditionStatus */

/**
 * @typedef {Object} Crag
 * @property {string} id - Unique slug
 * @property {string} name - Display name
 * @property {RegionId} region - Geographic grouping
 * @property {string} regionLabel - Formatted region name
 * @property {number} lat - Latitude (decimal)
 * @property {number} lng - Longitude (decimal)
 * @property {'hard-coastal' | 'soft-valley' | 'iron-banded' | 'mountain-sandstone'} sandstoneType
 * @property {Object} dryingProfile
 * @property {number} dryingProfile.dryHoursPerMm - Base hours required per 1mm rain (e.g. 1.6 = fast, 5.0 = slow)
 * @property {'none' | 'low' | 'moderate' | 'high'} dryingProfile.seepageRisk - Seepage tendency
 * @property {number} dryingProfile.shelterFactor - 0.0 (exposed slab) to 0.8 (steep roof/cave)
 * @property {'full-sun' | 'morning-sun' | 'afternoon-sun' | 'full-shade'} dryingProfile.sunExposure
 * @property {'high' | 'medium' | 'sheltered'} dryingProfile.windExposure
 * @property {{ min: string, max: string, count: number }} grades
 * @property {string[]} style - e.g. ['Roofs', 'Traverses', 'Pockets', 'Highballs']
 * @property {number} approachMinutes
 * @property {string} [theCragUrl]
 * @property {string} description
 * @property {string} tips
 */

/**
 * @typedef {Object} DayForecast
 * @property {string} date - 'YYYY-MM-DD' (Sydney local timezone)
 * @property {string} dayName - 'Mon', 'Tue', etc. (UTC-noon normalized)
 * @property {boolean} isToday
 * @property {boolean} isPast
 * @property {number} tempMax - °C
 * @property {number} tempMin - °C
 * @property {number} tempAvg - °C (mean of 24 hourly readings)
 * @property {number} precipSumMm - Total rain in mm
 * @property {number} rainProbabilityMax - % (defaults to 0 for historical days)
 * @property {number} humidityAvg - % (mean of 24 hourly readings)
 * @property {number} dewPointAvg - °C (mean of 24 hourly readings)
 * @property {number} windSpeedMaxKmH - km/h
 * @property {number} weatherCode - WMO weather interpretation code
 */

/**
 * @typedef {Object} CragDayEvaluation
 * @property {string} date - 'YYYY-MM-DD'
 * @property {string} dayName
 * @property {boolean} isToday
 * @property {ConditionStatus} status
 * @property {'emerald' | 'lime' | 'amber' | 'orange' | 'red'} colorCode
 * @property {string} badgeLabel - 'Prime / Crisp', 'Dry & Good', 'Greasy / Humid', 'Damp / Greasy', 'Soft Sandstone Danger'
 * @property {number} rockDrynessScore - 0 (soaked) to 100 (bone dry)
 * @property {number} frictionScore - 0 (terrible/greasy) to 100 (high-friction crisp)
 * @property {string[]} reasons - Explanatory bullet points
 * @property {string} summary - Short takeaway
 */
```

---

### Curated Seed Crags Dataset (`CRAGS_DATA` — 18 Crags Covering All 6 Regions)

```javascript
const CRAGS_DATA = [
  // --- SYDNEY EAST ---
  {
    id: 'frontline-bondi',
    name: 'Frontline (Bondi)',
    region: 'sydney-east',
    regionLabel: 'Sydney Eastern Suburbs',
    lat: -33.8912,
    lng: 151.2785,
    sandstoneType: 'hard-coastal',
    dryingProfile: { dryHoursPerMm: 1.8, seepageRisk: 'none', shelterFactor: 0.3, sunExposure: 'morning-sun', windExposure: 'high' },
    grades: { min: 'V2', max: 'V11', count: 32 },
    style: ['Ocean Slabs', 'Traverses', 'Hard Coastal Crimps'],
    approachMinutes: 5,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/sydney-area/node/12104523',
    description: 'Premier coastal sandstone bouldering with fierce ocean waves crashing below. High salt-air friction when dry.',
    tips: 'High tide and ocean spray can wet the lower starts. Dries exceptionally fast after rain thanks to coastal breezes.'
  },
  {
    id: 'south-coogee',
    name: 'South Coogee Boulders',
    region: 'sydney-east',
    regionLabel: 'Sydney Eastern Suburbs',
    lat: -33.9267,
    lng: 151.2612,
    sandstoneType: 'hard-coastal',
    dryingProfile: { dryHoursPerMm: 1.6, seepageRisk: 'none', shelterFactor: 0.3, sunExposure: 'full-sun', windExposure: 'high' },
    grades: { min: 'V1', max: 'V8', count: 18 },
    style: ['Traverses', 'Pockets', 'Ocean Platforms'],
    approachMinutes: 5,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/sydney-area/node/12104528',
    description: 'Flat wave-cut rock platform with clean sandstone blocks and instant coastal drying.',
    tips: 'Best on low tide and low swell days. Sun bakes the rock dry within hours of rain.'
  },
  {
    id: 'maroubra-south',
    name: 'Maroubra Boulders',
    region: 'sydney-east',
    regionLabel: 'Sydney Eastern Suburbs',
    lat: -33.9554,
    lng: 151.2619,
    sandstoneType: 'hard-coastal',
    dryingProfile: { dryHoursPerMm: 1.7, seepageRisk: 'none', shelterFactor: 0.2, sunExposure: 'full-sun', windExposure: 'high' },
    grades: { min: 'V2', max: 'V10', count: 25 },
    style: ['Fierce Crimps', 'Wave Platforms', 'Dynos'],
    approachMinutes: 7,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/sydney-area/node/12104531',
    description: 'Rugged ocean platform boulders with incredible solid rock quality.',
    tips: 'Watch for high surf; rock dries almost immediately in steady sea winds.'
  },

  // --- SYDNEY NORTH ---
  {
    id: 'north-head-manly',
    name: 'North Head (Manly)',
    region: 'sydney-north',
    regionLabel: 'Northern Beaches & North Shore',
    lat: -33.8142,
    lng: 151.2988,
    sandstoneType: 'hard-coastal',
    dryingProfile: { dryHoursPerMm: 2.0, seepageRisk: 'none', shelterFactor: 0.6, sunExposure: 'afternoon-sun', windExposure: 'high' },
    grades: { min: 'V3', max: 'V12', count: 28 },
    style: ['Steep Roofs', 'Power Endurance', 'Highballs'],
    approachMinutes: 15,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/sydney-area/node/12104524',
    description: 'Scenic cliffside roofs and caves perched above Sydney Harbour entrance. Steep, athletic climbing.',
    tips: 'Main cave stays dry in light showers due to massive overhang, but damp sea mist can reduce friction in high humidity.'
  },
  {
    id: 'lady-game-lindfield',
    name: 'Lady Game Drive (Lindfield)',
    region: 'sydney-north',
    regionLabel: 'Northern Beaches & North Shore',
    lat: -33.7785,
    lng: 151.1578,
    sandstoneType: 'soft-valley',
    dryingProfile: { dryHoursPerMm: 4.5, seepageRisk: 'high', shelterFactor: 0.1, sunExposure: 'full-shade', windExposure: 'sheltered' },
    grades: { min: 'V1', max: 'V9', count: 24 },
    style: ['Pockets', 'Arêtes', 'Bush Blocks'],
    approachMinutes: 3,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/sydney-area/node/12104525',
    description: 'Convenient roadside bouldering secluded inside Lane Cove National Park bushland.',
    tips: 'Prone to ground seepage and slow drying due to dense tree canopy. Never climb after heavy rain until 48+ dry hours.'
  },
  {
    id: 'hassell-park-st-ives',
    name: 'Hassell Park (St Ives)',
    region: 'sydney-north',
    regionLabel: 'Northern Beaches & North Shore',
    lat: -33.7224,
    lng: 151.1852,
    sandstoneType: 'soft-valley',
    dryingProfile: { dryHoursPerMm: 3.2, seepageRisk: 'moderate', shelterFactor: 0.2, sunExposure: 'morning-sun', windExposure: 'medium' },
    grades: { min: 'V0', max: 'V8', count: 30 },
    style: ['Slabs', 'Technical Arêtes', 'Compression'],
    approachMinutes: 8,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/sydney-area/node/12104526',
    description: 'Charming sandstone clusters with a dense spread of quality beginner and intermediate problems.',
    tips: 'Morning sun helps dry the upper tier quickly, but shaded blocks remain damp after sustained downpours.'
  },
  {
    id: 'buffalo-creek-chatswood',
    name: 'Buffalo Creek (Chatswood)',
    region: 'sydney-north',
    regionLabel: 'Northern Beaches & North Shore',
    lat: -33.7915,
    lng: 151.1712,
    sandstoneType: 'soft-valley',
    dryingProfile: { dryHoursPerMm: 5.0, seepageRisk: 'high', shelterFactor: 0.1, sunExposure: 'full-shade', windExposure: 'sheltered' },
    grades: { min: 'V2', max: 'V10', count: 20 },
    style: ['Slopers', 'Underclings', 'Crimps'],
    approachMinutes: 10,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/sydney-area/node/12104527',
    description: 'Deep gully boulders nestled alongside the creek with unique sloper features.',
    tips: 'Extremely seepage-prone after rain events. Allow ample drying time to protect fragile riverstone texture.'
  },
  {
    id: 'narrabeen-bungan',
    name: 'Bungan Head (Narrabeen)',
    region: 'sydney-north',
    regionLabel: 'Northern Beaches & North Shore',
    lat: -33.6812,
    lng: 151.3214,
    sandstoneType: 'hard-coastal',
    dryingProfile: { dryHoursPerMm: 1.9, seepageRisk: 'low', shelterFactor: 0.4, sunExposure: 'morning-sun', windExposure: 'high' },
    grades: { min: 'V2', max: 'V9', count: 22 },
    style: ['Wave Cut Roofs', 'Pinch Blocks', 'Beach Landings'],
    approachMinutes: 10,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/sydney-area/node/12104529',
    description: 'Stunning headland bouldering right above pristine golden sand beaches.',
    tips: 'Bring a tarp to keep your bouldering pads free of beach sand.'
  },
  {
    id: 'bangalley-head-avalon',
    name: 'Bangalley Head (Avalon)',
    region: 'sydney-north',
    regionLabel: 'Northern Beaches & North Shore',
    lat: -33.6284,
    lng: 151.3392,
    sandstoneType: 'hard-coastal',
    dryingProfile: { dryHoursPerMm: 1.8, seepageRisk: 'none', shelterFactor: 0.5, sunExposure: 'morning-sun', windExposure: 'high' },
    grades: { min: 'V3', max: 'V10', count: 18 },
    style: ['Sea Cliff Caves', 'Horizontal Roofs', 'Pinch Spans'],
    approachMinutes: 20,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/sydney-area/node/12104536',
    description: 'Dramatic ocean headland with rugged cave roofs above the Pacific Ocean.',
    tips: 'Brisk sea breezes dry the stone rapidly. Take care on the steep cliff path approach.'
  },

  // --- SYDNEY INNER WEST ---
  {
    id: 'kellys-bush-hunters-hill',
    name: "Kelly's Bush (Hunters Hill)",
    region: 'sydney-inner-west',
    regionLabel: 'Inner West & Parramatta',
    lat: -33.8345,
    lng: 151.1534,
    sandstoneType: 'hard-coastal',
    dryingProfile: { dryHoursPerMm: 2.6, seepageRisk: 'low', shelterFactor: 0.3, sunExposure: 'afternoon-sun', windExposure: 'medium' },
    grades: { min: 'V0', max: 'V7', count: 16 },
    style: ['Harbour Arêtes', 'Mantels', 'Traverses'],
    approachMinutes: 6,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/sydney-area/node/12104530',
    description: 'Historical parkland on the Parramatta River offering fun casual circuits with harbour views.',
    tips: 'Good afternoon sun exposure aids quick drying on the arêtes.'
  },
  {
    id: 'undercliffe-wolli-creek',
    name: 'Undercliffe (Earlwood)',
    region: 'sydney-inner-west',
    regionLabel: 'Inner West & Parramatta',
    lat: -33.9212,
    lng: 151.1423,
    sandstoneType: 'iron-banded',
    dryingProfile: { dryHoursPerMm: 2.8, seepageRisk: 'moderate', shelterFactor: 0.5, sunExposure: 'afternoon-sun', windExposure: 'medium' },
    grades: { min: 'V1', max: 'V11', count: 35 },
    style: ['Ironstone Roofs', 'Heel Hooks', 'Compression Caving'],
    approachMinutes: 4,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/sydney-area/node/12104532',
    description: 'Famous urban sandstone cave with hard ironstone bands and steep roofs.',
    tips: 'The steep cave roof stays dry in light showers, but check top-out seepage after rain.'
  },

  // --- SYDNEY SOUTH ---
  {
    id: 'woronora-the-needles',
    name: 'The Needles (Woronora)',
    region: 'sydney-south',
    regionLabel: 'Sydney South & Sutherland',
    lat: -34.0289,
    lng: 151.0456,
    sandstoneType: 'hard-coastal',
    dryingProfile: { dryHoursPerMm: 2.5, seepageRisk: 'low', shelterFactor: 0.3, sunExposure: 'morning-sun', windExposure: 'medium' },
    grades: { min: 'V1', max: 'V9', count: 22 },
    style: ['River Needles', 'Sharp Crimps', 'Highballs'],
    approachMinutes: 10,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/sydney-area/node/12104539',
    description: 'Scenic river valley bouldering in the Sutherland Shire with clean sandstone pillars and deep water solos.',
    tips: 'Morning sun and gentle valley breezes allow good drying; check river levels after major storms.'
  },
  {
    id: 'kurnell-boulders',
    name: 'Kurnell (Kamay Botany Bay)',
    region: 'sydney-south',
    regionLabel: 'Sydney South & Sutherland',
    lat: -34.0156,
    lng: 151.2212,
    sandstoneType: 'hard-coastal',
    dryingProfile: { dryHoursPerMm: 1.6, seepageRisk: 'none', shelterFactor: 0.2, sunExposure: 'full-sun', windExposure: 'high' },
    grades: { min: 'V2', max: 'V8', count: 15 },
    style: ['Ocean Platforms', 'Wave Features', 'Heel Hooks'],
    approachMinutes: 8,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/sydney-area/node/12104540',
    description: 'Expansive ocean platform on the southern headland of Botany Bay with fast-drying coastal stone.',
    tips: 'Full sun all day long makes this an ultra-fast drying winter spot.'
  },

  // --- BLUE MOUNTAINS ---
  {
    id: 'blackheath-boulders',
    name: 'Blackheath Boulders (Shipley)',
    region: 'blue-mountains',
    regionLabel: 'Blue Mountains',
    lat: -33.6421,
    lng: 150.2642,
    sandstoneType: 'mountain-sandstone',
    dryingProfile: { dryHoursPerMm: 2.4, seepageRisk: 'low', shelterFactor: 0.4, sunExposure: 'morning-sun', windExposure: 'high' },
    grades: { min: 'V2', max: 'V12', count: 40 },
    style: ['Mountain Ironstone', 'High Friction Pockets', 'Highballs'],
    approachMinutes: 12,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/blue-mountains/node/12104533',
    description: 'World-class upper Blue Mountains bouldering with legendary crisp winter friction.',
    tips: 'Elevation (~1000m) means 6-8°C cooler temperatures than Sydney. Ideal autumn/winter destination.'
  },
  {
    id: 'medlow-bath-caves',
    name: 'Medlow Bath (Sunnyside)',
    region: 'blue-mountains',
    regionLabel: 'Blue Mountains',
    lat: -33.6741,
    lng: 150.2912,
    sandstoneType: 'mountain-sandstone',
    dryingProfile: { dryHoursPerMm: 3.0, seepageRisk: 'moderate', shelterFactor: 0.7, sunExposure: 'afternoon-sun', windExposure: 'medium' },
    grades: { min: 'V3', max: 'V13', count: 36 },
    style: ['Massive Roofs', 'Underclings', 'Knee Bars'],
    approachMinutes: 15,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/blue-mountains/node/12104534',
    description: 'Overhanging amphitheatre with sustained roof climbing and steep boulder problems.',
    tips: 'Overhang shelters routes from rain, but seepage tracks can develop after consecutive wet days.'
  },
  {
    id: 'megalong-old-ford',
    name: 'Old Ford Reserve (Megalong)',
    region: 'blue-mountains',
    regionLabel: 'Blue Mountains',
    lat: -33.7123,
    lng: 150.2514,
    sandstoneType: 'mountain-sandstone',
    dryingProfile: { dryHoursPerMm: 3.5, seepageRisk: 'moderate', shelterFactor: 0.2, sunExposure: 'full-sun', windExposure: 'medium' },
    grades: { min: 'V1', max: 'V8', count: 20 },
    style: ['Granite-like Sandstone', 'River Blocks', 'Slabs'],
    approachMinutes: 5,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/blue-mountains/node/12104535',
    description: 'Picturesque valley camping and bouldering surrounded by the Megalong Valley escarpment.',
    tips: 'Gets very hot in middle of summer days; fantastic crisp friction on sunny winter mornings.'
  },
  {
    id: 'warrimoo-lower-blue-mts',
    name: 'Warrimoo Boulders',
    region: 'blue-mountains',
    regionLabel: 'Blue Mountains',
    lat: -33.7289,
    lng: 150.6012,
    sandstoneType: 'soft-valley',
    dryingProfile: { dryHoursPerMm: 3.8, seepageRisk: 'moderate', shelterFactor: 0.2, sunExposure: 'morning-sun', windExposure: 'sheltered' },
    grades: { min: 'V1', max: 'V9', count: 22 },
    style: ['Bush Blocks', 'Crimpy Faces', 'Arêtes'],
    approachMinutes: 10,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/blue-mountains/node/12104537',
    description: 'Lower Mountains bush bouldering with easy access and shaded gullies.',
    tips: 'Warmer than upper mountains in winter. Ensure 36+ hours of dry weather before climbing.'
  },

  // --- CENTRAL COAST ---
  {
    id: 'kariong-gosford',
    name: 'Kariong / Gosford (Central Coast)',
    region: 'central-coast',
    regionLabel: 'Central Coast',
    lat: -33.4385,
    lng: 151.3012,
    sandstoneType: 'iron-banded',
    dryingProfile: { dryHoursPerMm: 2.2, seepageRisk: 'low', shelterFactor: 0.3, sunExposure: 'full-sun', windExposure: 'high' },
    grades: { min: 'V1', max: 'V10', count: 26 },
    style: ['Iron Swirls', 'High Friction Slabs', 'Bulges'],
    approachMinutes: 12,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/new-south-wales/central-coast/node/12104538',
    description: 'Central Coast sandstone with prominent ironstone features, great texture, and sunny aspects.',
    tips: 'Exposed hilltop location dries rapidly after rainfall with good air movement.'
  }
];
```

---

### Condition Evaluation & Heuristic Formulas

#### 1. Moisture Index ($M \in [0, 100]$) with Sliding 3-Day Lookback Window
Let the contiguous 10-day weather array be $D_0 \dots D_9$ (where indices 0..2 are past days $T_{-3}, T_{-2}, T_{-1}$, index 3 is today $T_0$, and indices 4..9 are future forecast days $T_{+1} \dots T_{+6}$).

For any evaluation day at index $i \in [3, 9]$:
$$M_i = \min\left(100, \sum_{k=1}^{3} \left( \text{precip}(D_{i-k}) \times w_k \times S_{\text{shelter}} \times K_{\text{seepage}} \times D_{\text{rate}} \right) + \left( \text{precip}(D_i) \times 15.0 \right) \right)$$
where:
- Lookback weights: $w_1 = 3.5, w_2 = 1.8, w_3 = 0.8$.
- Shelter factor modifier: $S_{\text{shelter}} = 1.0 - (0.6 \times \text{shelterFactor})$.
- Seepage risk multipliers: `none`: 0.8, `low`: 1.0, `moderate`: 1.3, `high`: 1.8.
- Drying rate modifier: $D_{\text{rate}} = \frac{\text{dryHoursPerMm}}{2.5}$.
- $\text{RockDrynessScore}_i = \max(0, 100 - M_i)$.

#### 2. Ambient Friction Index ($F \in [0, 100]$)
Computed for every day $i$ for informational display:
$$F = \max\left(0, \min\left(100, 100 - P_{\text{temp}} - P_{\text{dew}} - P_{\text{humidity}}\right)\right)$$
- $P_{\text{temp}}$: Ideal $12^\circ\text{C} \le T_{\text{avg}} \le 18^\circ\text{C}$ (0 penalty).
  - If $T_{\text{avg}} < 12^\circ\text{C}$: $(12 - T_{\text{avg}}) \times 1.5$.
  - If $T_{\text{avg}} > 18^\circ\text{C}$: $(T_{\text{avg}} - 18) \times 3.0$.
- $P_{\text{dew}}$: Ideal $\le 8^\circ\text{C}$ (0 penalty). If $>8^\circ\text{C}$: $(\text{DewPoint}_{\text{avg}} - 8) \times 3.5$.
- $P_{\text{humidity}}$: Ideal $\le 55\%$ (0 penalty). If $>55\%$: $(\text{RH}_{\text{avg}} - 55) \times 0.6$.

#### 3. Priority-Ordered Waterfall Condition Classifier

For target day $D_i$, condition status is evaluated in strict sequential order:

```javascript
function classifyCondition(moisture, targetRain, rainProb, friction) {
  // Step 1: Hard Sandstone Fragility Danger
  if (moisture >= 35 || targetRain >= 1.5 || rainProb >= 60) {
    return {
      status: 'WET_DANGER',
      colorCode: 'red',
      badgeLabel: 'Soft Sandstone Danger',
      summary: 'Rock is saturated or rain is imminent. Climbing now will permanently damage holds.'
    };
  }

  // Step 2: Marginal / Damp Rock
  if (moisture >= 15 || targetRain >= 0.4 || rainProb >= 40) {
    return {
      status: 'DAMP',
      colorCode: 'orange',
      badgeLabel: 'Damp / Marginal Dryness',
      summary: 'Rock has residual dampness. Sub-optimal friction and delicate holds may be fragile.'
    };
  }

  // Step 3: Rock is Bone Dry & Safe — Classified by Friction Score
  if (moisture < 5 && targetRain === 0 && rainProb < 20 && friction >= 80) {
    return {
      status: 'PRIME',
      colorCode: 'emerald',
      badgeLabel: 'Prime / Crisp Friction',
      summary: 'Bone dry stone with low humidity and ideal cool temperatures. Perfect send conditions!'
    };
  }

  if (friction >= 60) {
    return {
      status: 'GOOD',
      colorCode: 'lime',
      badgeLabel: 'Dry & Good Conditions',
      summary: 'Rock is dry and safe to climb with solid friction.'
    };
  }

  return {
    status: 'FAIR',
    colorCode: 'amber',
    badgeLabel: 'Dry but Warm / Greasy',
    summary: 'Rock is completely dry, but higher temperatures or humidity will reduce grip.'
  };
}
```

---

### Open-Meteo Batch Query, Aggregation & Caching Contract

- **Batch Request URL**:
  `https://api.open-meteo.com/v1/forecast?latitude={lat1,lat2,...}&longitude={lng1,lng2,...}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&hourly=relative_humidity_2m,dew_point_2m,temperature_2m&past_days=3&forecast_days=7&timezone=Australia%2FSydney`
- **Response Processing in `WeatherService.parseResponse(raw)`**:
  - Normalize single vs batch payload: `const items = Array.isArray(raw) ? raw : [raw];`
  - For each location and day $k \in [0, 9]$:
    - Slice the 24 hourly values corresponding to day $k$: indices $[24k \dots 24k+23]$.
    - `tempAvg = mean(hourly.temperature_2m.slice(24k, 24k+24))`
    - `humidityAvg = mean(hourly.relative_humidity_2m.slice(24k, 24k+24))`
    - `dewPointAvg = mean(hourly.dew_point_2m.slice(24k, 24k+24))`
    - `weatherCode = daily.weather_code?.[k] ?? daily.weathercode?.[k] ?? 0`
    - `rainProbabilityMax = daily.precipitation_probability_max?.[k] ?? 0` (null-coalesced for past days).
    - `dayName = new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-AU', { weekday: 'short', timeZone: 'UTC' })`
- **Caching**:
  - `localStorage` key: `'bb_weather_cache_v1'`
  - TTL: 30 minutes (`1800000` ms).
- **Bundled Offline Baseline (`WeatherService.FALLBACK_WEATHER_DATA`)**:
  - Contains a 10-day synthetic Sydney autumn dataset ($T=16^\circ\text{C}, \text{RH}=50\%, \text{rain}=0$).
  - If network fails and cache is empty, uses baseline and displays a subtle banner: *"Offline Mode: Using baseline weather data."*

---

### V-Scale Parser & Overlap Filter Predicate

```javascript
function parseVGrade(gradeStr) {
  if (!gradeStr) return 0;
  const clean = gradeStr.toUpperCase().trim();
  if (clean === 'VB') return -1;
  const match = clean.match(/V(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function matchesGradeRange(crag, minFilterV, maxFilterV) {
  const cragMin = parseVGrade(crag.grades.min);
  const cragMax = parseVGrade(crag.grades.max);
  return cragMax >= minFilterV && cragMin <= maxFilterV;
}
```

---

### Node.js Zero-Dependency Test Bridge & Browser Bootstrap Guards

In `boulder-buddy/index.html`:
```javascript
// Universal Module Export Guard for testing in Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ConditionEngine, WeatherService, CRAGS_DATA, parseVGrade, matchesGradeRange };
}

// Browser UI Bootstrap Guard
if (typeof window !== 'undefined' && typeof document !== 'undefined' && !window.__TEST_MODE__) {
  document.addEventListener('DOMContentLoaded', () => UIController.init());
}
```

In `boulder-buddy/test.js`:
The test script loads `boulder-buddy/index.html`, extracts the `<script>` contents using regex, and evaluates it within Node's built-in `vm` sandbox with minimal browser mocks (`localStorage`, `fetch`, `window`). It then executes assertions using Node's standard `assert` module.

---

## 4. Implementation Plan (Ordered Layers)

### Layer 1: Types, Constants & Curated Crags Database
- Create `boulder-buddy/index.html` structure.
- Embed full `CRAGS_DATA` array (all 18 crags across 6 regions) with coordinates, drying profiles, and descriptions.

### Layer 2: Core Domain & Heuristic Engine
- Implement `parseVGrade` and `matchesGradeRange`.
- Implement `ConditionEngine.calculateMoistureIndex(weatherDays, dayIndex, profile)`.
- Implement `ConditionEngine.calculateFrictionIndex(tempAvg, dewPointAvg, humidityAvg)`.
- Implement `ConditionEngine.classifyCondition` waterfall evaluator and `ConditionEngine.evaluateCrag`.

### Layer 3: Batch Weather Service & LocalStorage Cache
- Implement `WeatherService.fetchBatchWeather(crags)` calling Open-Meteo batch query with `daily=weather_code,...` and `timezone=Australia/Sydney`.
- Implement hourly-to-daily slicing, defensive `weather_code` property lookup, and `null`-coalescing for `precipitation_probability_max`.
- Implement 30-minute `localStorage` cache with TTL validation.
- Embed `WeatherService.FALLBACK_WEATHER_DATA`.

### Layer 4: Interactive Leaflet Map & Split-View UI Presentation
- Build split-view desktop & mobile drawer layout with Tailwind CSS neo-brutalist styling (`card-editorial`, `btn-editorial`).
- Implement `MapController` with `L.divIcon` markers and `refreshMap()` (`requestAnimationFrame(() => setTimeout(() => map.invalidateSize(), 100))`) support.
- Implement `UIController` state management (search, region filter, condition filter, grade filter, favorites, crag inspector, 7-day timeline day selector).

### Layer 5: Automated Verification Suite & Hub Integration
- Create `boulder-buddy/test.js` using Node.js built-in `assert` and `vm`.
- Add project card to `index.html` with icon 🧗, status `Playable`, and category `tools`.
- Update `README.md` with Sydney Boulder Buddy section.
- Run `node boulder-buddy/test.js` and verify browser functionality.

---

## 5. Verification Protocol

### Automated Tests (`boulder-buddy/test.js`)
Run command: `node boulder-buddy/test.js`
The script runs with zero external npm dependencies and validates:
1. **Dataset Integrity**: All 18 crags have unique IDs, coordinates within NSW bounding box (-34.5 to -33.0 lat, 150.0 to 151.5 lng), non-empty style arrays, and valid drying parameters across all 6 regions.
2. **Waterfall Classifier Exhaustiveness**: Tests all combinations of $M, R, \text{RainProb}, F$ to guarantee no dead zones or undefined statuses.
3. **Sliding Lookback Invariant**: Verifies that a storm forecast on Day +1 correctly increases moisture index for Day +2 and Day +3.
4. **Hard Gating Rule**: Target day rain $\ge 1.5\text{ mm}$ or rain probability $\ge 60\%$ strictly yields `WET_DANGER` regardless of friction.
5. **Friction Scoring**:
   - 14°C, 45% humidity, 6°C dew point $\implies F \ge 85$ (`PRIME`).
   - 33°C, 88% humidity, 24°C dew point $\implies F \le 35$ (`FAIR`).
6. **V-Grade Parser & Overlap Filter**: Correctly ranks grades and matches overlapping ranges.
7. **Open-Meteo URL Builder**: Correctly formats comma-separated coordinates and includes `timezone=Australia%2FSydney` and `weather_code`.

### Manual Verification Steps
1. Open `boulder-buddy/index.html` in browser.
2. Verify all 18 pins appear across Sydney, Blue Mountains, and Central Coast with condition-colored pins.
3. Click *Frontline (Bondi)* and test clicking through the 7-day timeline buttons.
4. Filter by region (*Sydney South*) and verify *The Needles* and *Kurnell* display.
5. Click the star icon to favorite a crag, reload page, and verify favorite persists.
6. Resize window to 375px width (mobile view), toggle drawer, and verify map tiles render seamlessly without grey gaps.
7. Click "Playground" header back link to confirm navigation to `../index.html`.

### Success Criteria
- `node boulder-buddy/test.js` exits with status code 0 (all test assertions pass).
- Standalone zero-dependency app running in `boulder-buddy/index.html`.
- Real-time weather data fetched seamlessly from Open-Meteo with caching.
- Zero console errors or layout shifts.

## 6. Out-of-Scope Follow-ups
- Geolocation "Find closest dry crag".
- External tick-list sync.
- Wind vector micro-drying calculations.
