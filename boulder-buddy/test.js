/**
 * Automated Verification Test Suite for Sydney Boulder Buddy (`boulder-buddy`)
 * Zero external dependencies — runs directly with Node.js built-in modules: assert, vm, fs, path.
 *
 * Usage: node boulder-buddy/test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('🧗 Running Sydney Boulder Buddy Verification Suite...\n');

// 1. Load and extract script code from boulder-buddy/index.html
const htmlPath = path.join(__dirname, 'index.html');
assert(fs.existsSync(htmlPath), `Error: File not found at ${htmlPath}`);

const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Extract script contents
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
let match;
let jsCode = '';

while ((match = scriptRegex.exec(htmlContent)) !== null) {
  // We want the application logic script that contains CRAGS_DATA
  if (match[1].includes('CRAGS_DATA')) {
    jsCode = match[1];
    break;
  }
}

assert(jsCode.length > 0, 'Error: Failed to extract application JavaScript from index.html');

// 2. Sandbox context setup
const sandbox = {
  console: {
    log: () => {},
    warn: () => {},
    error: console.error
  },
  module: { exports: {} },
  exports: {},
  window: { __TEST_MODE__: true },
  document: {
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  },
  Date,
  Math,
  parseInt,
  parseFloat,
  Array,
  Object,
  Set,
  String,
  JSON
};

vm.createContext(sandbox);
vm.runInContext(jsCode, sandbox);

const { ConditionEngine, WeatherService, CRAGS_DATA, parseVGrade, matchesGradeRange } = sandbox.module.exports;

assert(ConditionEngine, 'ConditionEngine must be exported');
assert(WeatherService, 'WeatherService must be exported');
assert(Array.isArray(CRAGS_DATA), 'CRAGS_DATA must be an array');
assert(typeof parseVGrade === 'function', 'parseVGrade must be a function');
assert(typeof matchesGradeRange === 'function', 'matchesGradeRange must be a function');

let passedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// ==========================================
// TEST 1: DATASET INTEGRITY (18 Crags Across 6 Regions)
// ==========================================
test('Dataset Integrity — 18 Curated Crags Across 6 Regions with NSW Bounding Box', () => {
  assert.strictEqual(CRAGS_DATA.length, 18, `Expected exactly 18 crags, found ${CRAGS_DATA.length}`);

  const regions = new Set();
  const ids = new Set();

  CRAGS_DATA.forEach(crag => {
    assert(crag.id, 'Crag must have an id');
    assert(!ids.has(crag.id), `Duplicate crag id found: ${crag.id}`);
    ids.add(crag.id);

    assert(crag.name, `Crag ${crag.id} must have a name`);
    assert(crag.region, `Crag ${crag.id} must have a region`);
    regions.add(crag.region);

    // Coordinates bounding box for NSW / Greater Sydney / Blue Mts / Central Coast
    // Lat: -34.5 to -33.0, Lng: 150.0 to 151.5
    assert(crag.lat <= -33.0 && crag.lat >= -34.5, `Lat ${crag.lat} for ${crag.id} outside NSW bbox [-34.5, -33.0]`);
    assert(crag.lng >= 150.0 && crag.lng <= 151.5, `Lng ${crag.lng} for ${crag.id} outside NSW bbox [150.0, 151.5]`);

    // Sandstone type
    const validSandstone = ['hard-coastal', 'soft-valley', 'iron-banded', 'mountain-sandstone'];
    assert(validSandstone.includes(crag.sandstoneType), `Invalid sandstoneType: ${crag.sandstoneType} in ${crag.id}`);

    // Drying profile
    assert(crag.dryingProfile, `Crag ${crag.id} missing dryingProfile`);
    assert(typeof crag.dryingProfile.dryHoursPerMm === 'number' && crag.dryingProfile.dryHoursPerMm > 0, `Invalid dryHoursPerMm in ${crag.id}`);
    assert(['none', 'low', 'moderate', 'high'].includes(crag.dryingProfile.seepageRisk), `Invalid seepageRisk in ${crag.id}`);
    assert(typeof crag.dryingProfile.shelterFactor === 'number' && crag.dryingProfile.shelterFactor >= 0 && crag.dryingProfile.shelterFactor <= 1.0, `Invalid shelterFactor in ${crag.id}`);
    assert(['full-sun', 'morning-sun', 'afternoon-sun', 'full-shade'].includes(crag.dryingProfile.sunExposure), `Invalid sunExposure in ${crag.id}`);
    assert(['high', 'medium', 'sheltered'].includes(crag.dryingProfile.windExposure), `Invalid windExposure in ${crag.id}`);

    // Grades and Styles
    assert(crag.grades && crag.grades.min && crag.grades.max && crag.grades.count > 0, `Invalid grades in ${crag.id}`);
    assert(Array.isArray(crag.style) && crag.style.length > 0, `Style tags missing in ${crag.id}`);
    assert(typeof crag.approachMinutes === 'number' && crag.approachMinutes > 0, `Invalid approachMinutes in ${crag.id}`);
  });

  const expectedRegions = ['sydney-east', 'sydney-north', 'sydney-inner-west', 'sydney-south', 'blue-mountains', 'central-coast'];
  expectedRegions.forEach(r => {
    assert(regions.has(r), `Missing expected region: ${r}`);
  });
});

// ==========================================
// TEST 2: WATERFALL CLASSIFIER EXHAUSTIVENESS
// ==========================================
test('Waterfall Classifier — Strict Priority Ordering & Branch Exhaustiveness', () => {
  // Branch 1: Hard Sandstone Danger (WET_DANGER)
  const wet1 = ConditionEngine.classifyCondition(40, 0, 0, 95); // High moisture
  assert.strictEqual(wet1.status, 'WET_DANGER');
  assert.strictEqual(wet1.colorCode, 'red');

  const wet2 = ConditionEngine.classifyCondition(0, 2.0, 10, 90); // High rain today
  assert.strictEqual(wet2.status, 'WET_DANGER');

  const wet3 = ConditionEngine.classifyCondition(0, 0, 75, 90); // High rain prob
  assert.strictEqual(wet3.status, 'WET_DANGER');

  // Branch 2: Damp / Marginal (DAMP)
  const damp1 = ConditionEngine.classifyCondition(20, 0, 10, 85); // Moderate moisture
  assert.strictEqual(damp1.status, 'DAMP');
  assert.strictEqual(damp1.colorCode, 'orange');

  const damp2 = ConditionEngine.classifyCondition(4, 0.5, 10, 85); // Light rain today
  assert.strictEqual(damp2.status, 'DAMP');

  const damp3 = ConditionEngine.classifyCondition(4, 0, 45, 85); // Marginal rain prob
  assert.strictEqual(damp3.status, 'DAMP');

  // Branch 3: Prime Crisp Friction (PRIME)
  const prime = ConditionEngine.classifyCondition(2, 0, 10, 88);
  assert.strictEqual(prime.status, 'PRIME');
  assert.strictEqual(prime.colorCode, 'emerald');

  // Branch 4: Good Dry Conditions (GOOD)
  const good = ConditionEngine.classifyCondition(2, 0, 10, 68);
  assert.strictEqual(good.status, 'GOOD');
  assert.strictEqual(good.colorCode, 'lime');

  // Branch 5: Fair / Warm / Greasy (FAIR)
  const fair = ConditionEngine.classifyCondition(2, 0, 10, 45);
  assert.strictEqual(fair.status, 'FAIR');
  assert.strictEqual(fair.colorCode, 'amber');
});

// ==========================================
// TEST 3: SLIDING LOOKBACK INVARIANT
// ==========================================
test('Sliding Lookback Invariant — Rain Forecast on Day +1 Propagates Moisture to Day +2 & +3', () => {
  // Construct a synthetic 10-day weather array
  // Indices: 0,1,2 (past), 3 (today), 4 (Day +1), 5 (Day +2), 6 (Day +3), 7,8,9
  const weatherDays = [];
  for (let i = 0; i < 10; i++) {
    weatherDays.push({
      date: `2026-08-${20 + i}`,
      dayName: 'Day',
      isToday: i === 3,
      isPast: i < 3,
      precipSumMm: 0,
      rainProbabilityMax: 0,
      tempAvg: 15,
      humidityAvg: 50,
      dewPointAvg: 6,
      windSpeedMaxKmH: 15,
      weatherCode: 1
    });
  }

  const testProfile = { dryHoursPerMm: 2.5, seepageRisk: 'low', shelterFactor: 0.0 };

  // Before storm: Day +1 (index 4), Day +2 (index 5), Day +3 (index 6) are 0 moisture
  const mBeforeD1 = ConditionEngine.calculateMoistureIndex(weatherDays, 4, testProfile);
  const mBeforeD2 = ConditionEngine.calculateMoistureIndex(weatherDays, 5, testProfile);
  const mBeforeD3 = ConditionEngine.calculateMoistureIndex(weatherDays, 6, testProfile);
  assert.strictEqual(mBeforeD1, 0);
  assert.strictEqual(mBeforeD2, 0);
  assert.strictEqual(mBeforeD3, 0);

  // Simulate storm on Day +1 (index 4): 10mm rain
  weatherDays[4].precipSumMm = 10.0;

  // Day +1 moisture (target contribution: 10 * 15 = 100 capped)
  const mStormDay = ConditionEngine.calculateMoistureIndex(weatherDays, 4, testProfile);
  assert.strictEqual(mStormDay, 100);

  // Day +2 moisture (lookback k=1: 10mm * 3.5 * shelterMod(1.0) * seepageMod(1.0) * dryRate(1.0) = 35)
  const mDayAfter = ConditionEngine.calculateMoistureIndex(weatherDays, 5, testProfile);
  assert(mDayAfter >= 30, `Expected Day +2 moisture >= 30 from yesterday's storm, got ${mDayAfter}`);

  // Day +3 moisture (lookback k=2: 10mm * 1.8 = 18)
  const mTwoDaysAfter = ConditionEngine.calculateMoistureIndex(weatherDays, 6, testProfile);
  assert(mTwoDaysAfter >= 15 && mTwoDaysAfter < mDayAfter, `Expected Day +3 moisture decayed, got ${mTwoDaysAfter}`);

  // Verify condition status switches to DAMP on Day +3 and WET_DANGER on Day +2
  const evalD2 = ConditionEngine.classifyCondition(mDayAfter, 0, 0, 80);
  assert.strictEqual(evalD2.status, 'WET_DANGER');

  const evalD3 = ConditionEngine.classifyCondition(mTwoDaysAfter, 0, 0, 80);
  assert.strictEqual(evalD3.status, 'DAMP');
});

// ==========================================
// TEST 4: HARD GATING SANDSTONE SAFETY RULE
// ==========================================
test('Hard Gating Rule — Target Rain >= 1.5mm or Rain Prob >= 60% Overrides Friction to WET_DANGER', () => {
  // Even with 100/100 perfect crisp friction (14°C, 40% RH, 4°C dew)
  const perfectFriction = 100;

  const res1 = ConditionEngine.classifyCondition(0, 1.6, 10, perfectFriction);
  assert.strictEqual(res1.status, 'WET_DANGER', 'Expected WET_DANGER for rain >= 1.5mm');

  const res2 = ConditionEngine.classifyCondition(0, 0.0, 65, perfectFriction);
  assert.strictEqual(res2.status, 'WET_DANGER', 'Expected WET_DANGER for rain prob >= 60%');

  const res3 = ConditionEngine.classifyCondition(36, 0.0, 10, perfectFriction);
  assert.strictEqual(res3.status, 'WET_DANGER', 'Expected WET_DANGER for moisture >= 35');
});

// ==========================================
// TEST 5: AMBIENT FRICTION SCORING
// ==========================================
test('Ambient Friction Scoring — Crisp Cool Dry vs Hot Humid Conditions & NaN Safety', () => {
  // Optimal: 14°C (no temp pen), 45% humidity (no RH pen), 6°C dew point (no dew pen)
  const crispFriction = ConditionEngine.calculateFrictionIndex(14, 6, 45);
  assert(crispFriction >= 85, `Expected crisp friction >= 85, got ${crispFriction}`);

  // Terrible: 33°C (high temp pen: (33-18)*3 = 45), 88% humidity (pen: (88-55)*0.6 = 19.8), 24°C dew point (pen: (24-8)*3.5 = 56)
  // Total pen: 45 + 19.8 + 56 = 120.8 -> 0
  const greasyFriction = ConditionEngine.calculateFrictionIndex(33, 24, 88);
  assert(greasyFriction <= 35, `Expected greasy friction <= 35, got ${greasyFriction}`);

  // Intermediate: 20°C, 65% RH, 10°C dew point
  const modFriction = ConditionEngine.calculateFrictionIndex(20, 10, 65);
  assert(modFriction >= 60 && modFriction <= 85, `Expected intermediate friction, got ${modFriction}`);

  // Robustness against NaN / null / undefined / corrupted telemetry
  const nanFriction = ConditionEngine.calculateFrictionIndex(NaN, NaN, NaN);
  assert(Number.isFinite(nanFriction) && nanFriction >= 0 && nanFriction <= 100, 'Friction index must return a valid finite score on NaN');

  const nanMoisture = ConditionEngine.calculateMoistureIndex([{ precipSumMm: NaN }], 0, { dryHoursPerMm: 2.5, seepageRisk: 'low', shelterFactor: 0.3 });
  assert(Number.isFinite(nanMoisture) && nanMoisture >= 0, 'Moisture index must return valid finite number on NaN');
});

// ==========================================
// TEST 6: V-GRADE PARSER & OVERLAP FILTER
// ==========================================
test('V-Grade Parser & Overlap Filter Predicates', () => {
  assert.strictEqual(parseVGrade('VB'), -1);
  assert.strictEqual(parseVGrade('V0'), 0);
  assert.strictEqual(parseVGrade('V2'), 2);
  assert.strictEqual(parseVGrade('V11'), 11);
  assert.strictEqual(parseVGrade('V13'), 13);
  assert.strictEqual(parseVGrade(''), 0);

  const mockCrag = {
    grades: { min: 'V2', max: 'V8', count: 10 }
  };

  // Overlaps Beginner range (V0 - V4): V2 is <= 4 and V8 >= 0 -> true
  assert.strictEqual(matchesGradeRange(mockCrag, 0, 4), true);

  // Overlaps Intermediate range (V4 - V8): true
  assert.strictEqual(matchesGradeRange(mockCrag, 4, 8), true);

  // Overlaps Advanced range (V9 - V14): max is V8 < 9 -> false
  assert.strictEqual(matchesGradeRange(mockCrag, 9, 14), false);
});

// ==========================================
// TEST 7: OPEN-METEO URL BUILDER & BATCH FORMAT
// ==========================================
test('Open-Meteo URL Builder — Comma-Separated Batch Query & Parameters', () => {
  const url = WeatherService.buildApiUrl(CRAGS_DATA);

  assert(url.startsWith('https://api.open-meteo.com/v1/forecast?'), 'URL must target Open-Meteo forecast API');
  assert(url.includes('timezone=Australia%2FSydney'), 'URL must specify Sydney timezone');
  assert(url.includes('weather_code'), 'URL must include weather_code');
  assert(url.includes('past_days=3'), 'URL must include 3 past days');
  // Verify coordinates list has all 18 lats and lngs
  const latMatch = url.match(/latitude=([^&]+)/);
  const lngMatch = url.match(/longitude=([^&]+)/);
  assert(latMatch, 'URL must include latitude parameter');
  assert(lngMatch, 'URL must include longitude parameter');

  const lats = latMatch[1].split(',');
  const lngs = lngMatch[1].split(',');
  assert.strictEqual(lats.length, 18, `Expected 18 comma-separated lats, got ${lats.length}`);
  assert.strictEqual(lngs.length, 18, `Expected 18 comma-separated lngs, got ${lngs.length}`);
});

// ==========================================
// TEST 8: WEATHER RESPONSE PARSER & NULLISH SLICE FALLBACK
// ==========================================
test('WeatherService.parseResponse — Robustness against Null / Incomplete Hourly Telemetry', () => {
  const mockRaw = {
    daily: {
      time: ['2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23', '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29'],
      temperature_2m_max: [22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
      temperature_2m_min: [14, 14, 14, 14, 14, 14, 14, 14, 14, 14],
      precipitation_sum: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      precipitation_probability_max: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      wind_speed_10m_max: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
      weather_code: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    },
    hourly: {
      // 240 entries of nulls representing missing telemetry
      temperature_2m: new Array(240).fill(null),
      relative_humidity_2m: new Array(240).fill(null),
      dew_point_2m: new Array(240).fill(null)
    }
  };

  const parsed = WeatherService.parseResponse(mockRaw, [CRAGS_DATA[0]]);
  const cragDays = parsed[CRAGS_DATA[0].id];

  assert(Array.isArray(cragDays), 'Parsed crag days must be an array');
  assert.strictEqual(cragDays.length, 10, 'Expected 10 days parsed');

  // Should have fallen back to daily avg: (22 + 14)/2 = 18, humidity: 55, dewPoint: 8
  assert.strictEqual(cragDays[0].tempAvg, 18, `Expected fallback tempAvg 18, got ${cragDays[0].tempAvg}`);
  assert.strictEqual(cragDays[0].humidityAvg, 55, `Expected fallback humidityAvg 55, got ${cragDays[0].humidityAvg}`);
  assert.strictEqual(cragDays[0].dewPointAvg, 8, `Expected fallback dewPointAvg 8, got ${cragDays[0].dewPointAvg}`);
});

console.log(`\n🎉 All ${passedTests} verification tests passed successfully!\n`);
