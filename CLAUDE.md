# CLAUDE.md — PIOSI

> **Project**: PIOSI — "THE SAGAS CONTINUE"
> **Stack**: Vanilla JS (ES modules), HTML, CSS. No framework, no build step at runtime.
> **Deployment**: Self-contained web app. Tauri-wrapped for desktop shipping.
> **Active branch**: `1.0-shippable`

This file gives Claude the context, priorities, and house rules for working on PIOSI. **Read it before generating code, refactors, or new content.**

---

## 1. What PIOSI is

PIOSI is a turn-based, grid-based tactics/RPG game with multiple modes (Battle, World Map, Summit, Emanations, Mode Up). Content (heroes, levels, enemies) is **data-driven via JSON packs**, allowing the engine to ship once and be extended over time by replacing or adding content files.

The CORE build philosophy is the project's North Star:

> **Ship the engine once. Extend the game forever through content drops.**

---

## 2. Core values (in priority order)

When these conflict, the higher-priority value wins. State the trade-off explicitly when overriding a lower value.

1. **Zero-build runtime.** The game loads `index.html` directly. No bundler, no transpilation, no runtime npm dependencies. New features must preserve this property.
2. **Data/code separation.** New content (heroes, levels, enemies, items) goes in JSON content packs under `content/`. The engine stays content-agnostic.
3. **Graceful degradation.** If `fetch()` for content fails (e.g. `file://` protocol), the game falls back to static data in `heroes.js` / `levels.js`. Preserve this path on any content-loading change.
4. **Mode toggleability.** Top-level systems are gated by `content/manifest.json` → `modes`. New systems get a flag and default off in CORE.
5. **ID stability.** Anything keyed by hero (Mode Up buffs, future save data) prefers a stable lowercase `id`, with `name` as a fallback.
6. **Determinism for turn logic.** Same inputs → same outputs. Any RNG goes through a single seedable source, never raw `Math.random()`.
7. **Readability over abstraction.** Vanilla JS, small contributor base, no types. Plain functions and clear names beat clever patterns.
8. **Modularity at the file level.** One concern per `.js` file. New systems get their own file rather than bloating existing ones.

---

## 3. Architecture map

```
PIOSI/
├── index.html              # Entry point. Loads scripts, mounts game.
├── styles.css              # All styling.
├── package.json            # Partially stale; see §8.
│
├── content/                # JSON content packs (the extensibility surface)
│   └── manifest.json       # Enabled packs + mode toggles + coreLevels
│
├── docs/                   # Author-facing guides
│   ├── level-creation.md
│   ├── hero-manifestation-guide.md
│   └── players-manual.md
│
├── PIOSI Characters/       # Character sprite PNGs
│
└── *.js                    # Engine modules at root:
    ├── contentLoader.js    # Reads manifest, fetches packs, falls back to static data
    ├── battleEngine.js     # Turn-based grid combat
    ├── heroes.js           # Static hero fallback data
    ├── levels.js           # Static level fallback data
    ├── modeup.js           # Hero-specific level-up buffs (switch on hero.id)
    ├── applyKnockback.js   # Movement / knockback resolution
    ├── worldMap.js         # World map screen (mode-gated)
    ├── summitMode.js       # Summit mode (world-map-gated)
    ├── emanations.js       # Emanations mode (world-map-gated)
    ├── griot.js            # Narrative / storyteller layer
    └── sluj.js             # (see file for current responsibility)
```

### Module responsibility rules
- `contentLoader.js` owns content I/O. Other modules consume the loaded data; they do not fetch.
- `battleEngine.js` is the combat hot path. Keep it data-driven; do **not** embed hero/enemy-specific logic here.
- `modeup.js` uses a `switch(hero.id)` dispatch. This is **intentional**. Do not refactor it into a registry/strategy pattern without asking.
- Mode files (`worldMap.js`, `summitMode.js`, `emanations.js`) respect their flag in `manifest.json → modes` and no-op if disabled.

---

## 4. Recipes — "when adding X, do Y"

### Adding a hero
1. Add an entry to `content/heroes.<pack>.json` (or create a new pack).
2. Add the pack name to `content/manifest.json` → `packs`.
3. Add a `case "<id>":` block to `modeup.js` defining the level-up buff. Heroes without a case get the default `ghis` fallback — **this is by design**.
4. Drop the sprite in `PIOSI Characters/` and reference its path in the hero JSON.
5. Use a **stable lowercase `id`**. Mode Up and (future) save systems key off `id` first, `name` second.

### Adding a level
1. Add an entry to `content/levels.<pack>.json`.
2. Enemies use `enemyXOffset` (placed at `cols - enemyXOffset` from the left) or explicit `x`/`y` coordinates.
3. Add the pack to `manifest.json`.
4. If the level should be reachable before victory transition, update `manifest.json → coreLevels`.
5. Do **not** edit `levels.js` — that file is the fallback for `file://` loads only. New levels go in JSON.

### Adding a new mode / system
1. Create a new `.js` module at root. One concern, one file.
2. Add a flag to `manifest.json → modes` and default it to `false`.
3. The mode reads its own flag and no-ops if disabled.
4. If the mode adds content types (new entity kinds), extend the content pack schema **additively** — never break existing packs.
5. Document the mode in `docs/` if user-facing.

### Modifying the engine
- Ask first: "Could this be a content-pack change instead?" If yes, do that.
- Engine changes stay content-agnostic. No hero names, level numbers, or enemy types hardcoded in `battleEngine.js` / `applyKnockback.js`.
- Preserve the `fetch → fallback` pattern in `contentLoader.js`.

### Adding randomness
- Use the project's seedable RNG. If one doesn't exist, create one in a new `rng.js` module and route all randomness through it.
- Do not call `Math.random()` directly in game logic.
- Combat-affecting randomness should be seedable per encounter for replay / debug determinism.

---

## 5. Tensions and anti-patterns

### Tensions where the project's values win

| Tension | Default resolution |
|---|---|
| Adding a runtime dependency vs. writing 30 lines | Write the 30 lines. |
| Introducing a bundler vs. one more `<script>` tag | One more `<script>` tag. |
| DRY refactor of `modeup.js` vs. flat switch/case | Keep the flat switch. |
| Engine flexibility vs. content-pack-only extensibility | Content pack. |
| Always-on feature vs. flag-gated feature | Flag-gated, default off in CORE. |
| Renaming a content field vs. additive change | Additive. If you must rename, ship a fallback read for the old name. |

### Anti-patterns Claude should not introduce
- New `npm install` dependencies pulled in at runtime.
- A build step (webpack, vite, parcel, esbuild) without an explicit ask. *(See §8 — `package.json` currently references parcel; this is stale, not aspirational.)*
- Hero or level data inlined into engine modules.
- Direct `Math.random()` in turn logic.
- Silent failures on content load. Log a `console.warn` when falling back so authors can debug their packs.
- TypeScript, JSX, or other syntax that requires transpilation.
- Frameworks (React, Vue, Svelte, etc.). PIOSI is vanilla and stays vanilla.
- Refactoring `modeup.js`'s switch/case into a registry pattern without being asked.

---

## 6. Quality dimensions (prioritized for PIOSI)

**Primary** — always weigh:
- **Data/code separation** — engine vs. content cleanliness
- **Zero-build shippability** — preserve the no-bundler property
- **Graceful degradation** — fetch-fail fallback paths
- **Readability** — vanilla JS, small contributor base
- **Mode toggleability** — manifest-flag hygiene
- **ID stability** — for save/persistence forward compat
- **Determinism** — turn-based logic, seeded RNG

**Secondary** — worth optimizing, not blocking:
- **Modularity** — one concern per file
- **Schema additivity** — content JSON forward/backward compat
- **Documentation** — keep `docs/` in sync with engine changes
- **Debuggability** — clear console logging on content load failures

**Deprioritized** — don't optimize prematurely:
- **Test coverage** — no harness exists; introducing one is fine but not a blocker
- **Frame-budget micro-optimization** — turn-based, not realtime
- **Heavy abstraction** — interfaces, DI, factories. Plain functions win.
- **Type safety** — no TS, no JSDoc enforcement currently

---

## 7. Testing & quality posture

- No test harness currently exists. Don't block features on adding one.
- If introducing tests, prefer: a single Node script that requires no install (Node's built-in `test` runner), parses content JSON, validates schemas, runs pure-function unit tests on engine modules that don't touch the DOM.
- Manual smoke test before commits to `1.0-shippable`: open `index.html`, play one battle, check the world map (if enabled), confirm Mode Up triggers.
- Validate any content-pack changes by loading the game and watching the console for fallback warnings.

---

## 8. Known issues & aspirational improvements

Flagged here so Claude doesn't trip on them, and can propose fixes when relevant:

1. **`package.json` is stale.** It references `parcel`, a `src/` directory, and `gh-pages` deploy — but the actual repo runs from root with no build step, matching the README. **The README is the source of truth.** Either clean up `package.json` (recommended) or migrate to the `src/` layout it implies. Until resolved, treat parcel/gh-pages references as historical noise.
2. **Content schemas are example-driven, not specified.** Hero/level/enemy fields are inferred from README examples. A `content/SCHEMA.md` (or JSON Schema files) would cut ambiguity for less-common fields like `enemyXOffset`, `wallHP`, `armor`.
3. **Asset organization.** MP3s, JPGs, RTF, and stray files (`IMG_0905.JPG`) sit at repo root alongside code. An `assets/` or `audio/` directory would clean this up. Don't move mid-feature, but worthwhile as a focused cleanup pass.
4. **`fantasy_narrative.txt` lives outside the content pack system.** Either fold it into `content/` (perhaps as `content/narrative.<pack>.json`) or document why it lives at root.
5. **No save versioning.** If save/load exists or is coming, add a `saveVersion` field from day one. Migrations are cheap to add early, painful to retrofit.
6. **Content-load failures are silent.** Add a `console.warn("Pack '<name>' failed to load: <reason>, falling back to static data")` in `contentLoader.js` so authors can debug bad packs.
7. **No debug flag in manifest.** Adding `"debug": false` under `manifest.json` would let content authors flip verbose logging without code changes.
8. **No seeded RNG module.** If/when added, route all randomness through it for replay and debug determinism.

---

## 9. Working with Claude on this codebase

- **Default to small, surgical changes** over sweeping refactors.
- **Confirm intent before introducing a new dependency, build step, or framework.** These are the one-way doors for this project.
- **Read the README and this file before proposing structural changes** — both reflect deliberate decisions.
- **Cite the recipes in §4 when asked to add content.** They are the project's preferred shape.
- **When unsure whether something belongs in engine or content, ask.** The default leans content.

---

*Last updated: alongside `1.0-shippable`. Update this file when project values or architecture shift.*
