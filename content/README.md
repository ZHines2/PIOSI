# content/

JSON content packs and narrative data. This is the **extensibility surface** of PIOSI — adding heroes, levels, or enemies happens here, not in engine code.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | Lists enabled packs, mode toggles (`worldMap`, `summit`, `emanations`), and `coreLevels` count |
| `heroes.core.json` | Core hero roster definitions |
| `levels.core.json` | Core level definitions |
| `fantasy_narrative.txt` | Training corpus for the Griot Markov chain narrative generator |

## How content loads

`contentLoader.js` reads `manifest.json`, fetches each pack listed under `packs`, merges them, and returns `{ manifest, heroes, getLevel }`. If any fetch fails (e.g. running from `file://`), the engine falls back to the static data in `heroes.js` and `levels.js`.

## Adding a new pack

1. Create `heroes.<packname>.json` and/or `levels.<packname>.json` following the schema of the core files.
2. Add the pack name to `manifest.json → packs`.
3. New heroes also need a `case "<id>":` in `modeup.js` — see the [hero guide](../docs/hero-manifestation-guide.md).

## Field reference

See `docs/level-creation.md` and `docs/hero-manifestation-guide.md` for full field documentation.
