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
    lat: -33.764344,
    lng: 151.201369,
    grades: { min: 'V1', max: 'V11', count: 170 },
    approachMinutes: 5,
    theCragUrl: 'https://www.thecrag.com/en/climbing/australia/north-shore/area/12011155'
  }
];

if (typeof window !== 'undefined') {
  window.CRAGS_DATA = CRAGS_DATA;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CRAGS_DATA };
}
