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

## What makes a good content pack

**Heroes are mechanical arguments, not character sheets.** Every hero in a pack should have a distinct answer to "why would I pick this over the others?" If two heroes fill the same niche, one of them is redundant. The stat spread, the signature ability, and the Mode Up buff together define a playstyle — design the whole, not the parts. *(Warren Spector, Peter Molyneux)*

**Levels are rhythmic structures.** A sequence of levels should modulate tension and relief — hard, medium, hard, hard, relief — not just escalate linearly. Enemy placement choreographs player movement; where enemies start determines how the first thirty seconds of a level feel before a single decision is made. *(John Romero)*

**Depth comes from system interaction, not complexity.** A level that introduces one new enemy type that synergizes unexpectedly with the Mellitron's Swarm ability is more interesting than a level that introduces five new enemy types simultaneously. Let the engine's existing systems surprise players before adding new moving parts. *(Yu Suzuki)*

**Content packs should feel like they belong.** A new pack that introduces heroes wildly outside the visual or mechanical register of the core game breaks the world's consistency. New heroes should feel like they could have always been there; new levels should feel like they exist in the same universe as the existing ones. *(Ken Levine)*

## Field reference

See `docs/level-creation.md` and `docs/hero-manifestation-guide.md` for full field documentation.
