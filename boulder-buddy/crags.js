/**
 * Sydney Boulder Buddy — Crag Dataset
 * Minimal verified metadata extracted from theCrag.
 */

const CRAGS_DATA = [
  {
    id: 'sissy-crag',
    name: 'Sissy Crag (Forestville)',
    region: 'sydney-north',
    regionLabel: 'Northern Beaches & North Shore',
    lat: -33.7712,
    lng: 151.2185,
    grades: { min: 'V1', max: 'V11', count: 50 },
    approachMinutes: 5,
    theCragUrl: 'https://www.thecrag.com/climbing/australia/sydney-area/middle-harbour/sissy-crag'
  }
];

if (typeof window !== 'undefined') {
  window.CRAGS_DATA = CRAGS_DATA;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CRAGS_DATA };
}
