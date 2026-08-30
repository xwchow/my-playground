---
name: thecrag-extractor
description: Extract bouldering crag metadata from theCrag for Sydney Boulder Buddy.
---

# theCrag Crag Extractor Skill

Use this skill to extract verified bouldering crag metadata from [theCrag](https://www.thecrag.com).
The skill formats the extracted data for `CRAGS_DATA` in `boulder-buddy/index.html`.

---

## Required Data Schema

Each crag object contains only essential fields:

```javascript
{
  id: 'sissy-crag',
  name: 'Sissy Crag (Glenbrook)',
  region: 'blue-mountains',
  regionLabel: 'Blue Mountains & Glenbrook',
  lat: -33.7712,
  lng: 150.6234,
  grades: { min: 'V1', max: 'V11', count: 42 },
  theCragUrl: 'https://www.thecrag.com/climbing/australia/blue-mountains/node/12104535',
  approachMinutes: 5 // Optional field
}
```

> [!IMPORTANT]
> Do **not** extract or guess `style`, `sandstoneType`, `dryingProfile`, `description`, or `tips`.
> Extract only verifiable facts from theCrag.

---

## Region Mapping Table

Map theCrag location breadcrumbs to these region keys:

| Location on theCrag | Region Key (`region`) | Region Label (`regionLabel`) |
| :--- | :--- | :--- |
| Bondi, Coogee, Maroubra, Clovelly | `sydney-east` | `Sydney Eastern Suburbs` |
| Manly, Lindfield, St Ives, Chatswood, Avalon | `sydney-north` | `Northern Beaches & North Shore` |
| Hunters Hill, Earlwood, Wolli Creek | `sydney-inner-west` | `Inner West & Parramatta` |
| Woronora, Kurnell, Sutherland | `sydney-south` | `Sydney South & Sutherland` |
| Glenbrook, Blackheath, Medlow Bath | `blue-mountains` | `Blue Mountains` |
| Gosford, Kariong | `central-coast` | `Central Coast` |

---

## Extraction Procedure

Follow these steps to extract and format a crag:

1. Search for the crag page on theCrag:
   - Use `search_web` with the query: `site:thecrag.com <Crag Name> bouldering`.
2. Fetch the crag page content:
   - Use `read_url_content` with the canonical URL found in step 1.
3. Parse the following data points:
   - **`id`**: Generate a lowercase kebab-case slug (e.g. `crumbly-crag`).
   - **`name`**: Copy the official crag title.
   - **`region` & `regionLabel`**: Map from breadcrumbs using the table above.
   - **`lat` & `lng`**: Extract the decimal GPS coordinates from the page.
   - **`grades`**: Find the lowest V-grade (`min`), highest V-grade (`max`), and total boulder problem count (`count`).
   - **`theCragUrl`**: Record the canonical node URL.
   - **`approachMinutes`** (optional): Record approach walking time if the page mentions it.
4. Output the formatted JavaScript object snippet to the user.
5. Offer to insert the new crag into `CRAGS_DATA` in `boulder-buddy/index.html`.
6. Run `node boulder-buddy/test.js` to verify dataset integrity.

---

## Reference Examples

### Example 1: Frontline (Bondi)
```javascript
{
  id: 'frontline-bondi',
  name: 'Frontline (Bondi)',
  region: 'sydney-east',
  regionLabel: 'Sydney Eastern Suburbs',
  lat: -33.8912,
  lng: 151.2785,
  grades: { min: 'V2', max: 'V11', count: 32 },
  approachMinutes: 5,
  theCragUrl: 'https://www.thecrag.com/climbing/australia/sydney-area/node/12104523'
}
```

### Example 2: Sissy Crag (Glenbrook)
```javascript
{
  id: 'sissy-crag',
  name: 'Sissy Crag (Glenbrook)',
  region: 'blue-mountains',
  regionLabel: 'Blue Mountains',
  lat: -33.7712,
  lng: 150.6234,
  grades: { min: 'V1', max: 'V11', count: 42 },
  approachMinutes: 5,
  theCragUrl: 'https://www.thecrag.com/climbing/australia/blue-mountains/node/12104535'
}
```

### Example 3: Crumbly
```javascript
{
  id: 'crumbly',
  name: 'Crumbly',
  region: 'sydney-north',
  regionLabel: 'Northern Beaches & North Shore',
  lat: -33.7412,
  lng: 151.2845,
  grades: { min: 'V1', max: 'V8', count: 14 },
  approachMinutes: 10,
  theCragUrl: 'https://www.thecrag.com/climbing/australia/sydney-area/node/12104545'
}
```
