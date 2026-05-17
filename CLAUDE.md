# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

> **Project**: PIOSI — "THE SAGAS CONTINUE"
> **Stack**: Vanilla JS (ES modules), HTML, CSS. No framework, no build step at runtime.
> **Deployment**: Self-contained web app. Tauri-wrapped for desktop shipping.

---

## Commands

```bash
# Run the game locally (double-click or from terminal)
play.bat                        # starts Python HTTP server + opens browser

# Equivalent manual command
python -m http.server 8000      # then open http://localhost:8000

# Run all regression tests (Node 18+ required, no install needed)
npm test                        # node --test tests/*.test.js

# Run a single test file
node --test tests/battle.test.js

# Run tests matching a name pattern
node --test --test-name-pattern "moveUnit" tests/battle.test.js
```

No build step exists or should be added. `package.json` references parcel/gh-pages — treat those as historical noise; the game runs directly from `index.html` at root.

---

## Architecture

PIOSI is a turn-based grid tactics game. All game logic runs in a `<script type="module">` block inside `index.html`. There is no bundler.

### Screen flow

```
title → party (hero select) → battle → modeUp → battle → ... → victory
                                              ↘ worldMap → summitMode
                                                         → emanationsMode
```

`index.html` owns the screen state machine (`showScreen()`), the keyboard router (`keyActions` map), and all DOM wiring. It imports from the engine modules below.

### Engine modules (root `*.js` files)

| File | Responsibility |
|---|---|
| `contentLoader.js` | Fetch `manifest.json`, load hero/level JSON packs, fall back to static data |
| `battleEngine.js` | Turn-based grid combat: movement, attack, status effects, turn rotation |
| `applyKnockback.js` | Knockback (yeet) resolution — extracted from battleEngine for testability |
| `sluj.js` | Slüj DoT status effect tick logic |
| `modeup.js` | Hero-specific level-up buffs via `switch(hero.id)` |
| `heroes.js` | Static hero fallback data (used when JSON fetch fails) |
| `levels.js` | Static level fallback data (same) |
| `worldMap.js` | World map screen — mode-gated by `manifest.modes.worldMap` |
| `summitMode.js` | Summit mode — gated by `manifest.modes.summit` |
| `emanations.js` | Music player / visualizer mode — gated by `manifest.modes.emanations` |
| `griot.js` | Narrative layer; fetches jokes, tarot, bacon ipsum etc. for specific heroes |

### Content system

```
content/
  manifest.json          # enabled packs + mode flags + coreLevels count
  heroes.core.json       # hero definitions for the core pack
  levels.core.json       # level definitions for the core pack
```

`loadContent()` in `contentLoader.js` reads the manifest, fetches each pack listed under `packs`, merges them, and returns `{ manifest, heroes, getLevel }`. If any fetch fails (e.g. `file://` protocol), the return falls back to `heroes.js` / `levels.js` static data. This fallback path must be preserved on any content-loading change.

Enemies in JSON use either explicit `x`/`y` or `enemyXOffset` (placed at `cols - enemyXOffset`, mid-height). `resolveEnemies()` in `contentLoader.js` normalizes this.

### BattleEngine data contract

`BattleEngine` is constructed with `(party, enemies, rows, cols, wallHP, logCallback, onLevelComplete, onGameOver)`. It is fully DOM-free and can be exercised in Node tests. Key internals:

- `battlefield[y][x]` — 2D char array; `'.'` = empty, `'ᚙ'` / `'█'` = wall, `'ౚ'` = vittle, `'ඉ'` = mushroom
- `currentUnit` — index into `party[]`; advances past `persistentDeath` heroes
- `movePoints` — remaining moves for current hero (reset to `hero.agility` each turn)
- `awaitingAttackDirection` — set `true` by Space, cleared after attack resolves
- `getLiveHeroes()` — heroes without `persistentDeath`
- `handleHeroDeath(hero)` — checks `rise` for resurrection, otherwise sets `PersistentDeath`

All special abilities (`burn`, `sluj`, `yeet`, `chain`, `bomba`, `swarm`, `trick`, `psych`, `heal`, `rage`, `armor`, `dodge`) are stat-driven; the engine reads properties off entity objects and applies effects — no hero names or enemy types are hardcoded in the engine.

### Turn structure

1. Hero acts (`moveUnit` or `attackInDirection`) until `movePoints === 0`
2. `nextTurn()`: apply status effects → apply swarm → advance `currentUnit` → if wrapped, run `enemyTurn()`
3. Enemy turn: each enemy moves `agility` steps toward nearest live hero (Manhattan distance), attacks adjacent heroes, ticks slüj
4. After enemy turn, check live hero count; game over if zero

---

## Advisory Councils

Two expert councils inform design and experience decisions on this project. When making a choice about mechanics, content, feel, or interface, consult the relevant council's perspective before committing.

### Game Dev Council

| Advisor | Known for | Philosophy applied to PIOSI |
|---|---|---|
| **Shigeru Miyamoto** | Mario, Zelda, Donkey Kong | Start with feel — if pushing a hero one cell isn't satisfying, no mechanic fixes it |
| **John Romero** | Doom, Quake | Level layout creates rhythm; enemy placement is choreography; every map should be learnable |
| **Gabe Newell** | Half-Life, Steam | Remove every barrier between player and play — zero-install, double-click launch is a design value |
| **Warren Spector** | Deus Ex, System Shock | Enable player approaches; the engine should open options, not prescribe solutions |
| **Ken Levine** | BioShock | Story lives in the world — heroes, enemies, levels should imply a universe without a cutscene |
| **Jordan Mechner** | Prince of Persia, Karateka | Movement is performance; the moment-to-moment feel of a turn matters as much as its outcome |
| **Yu Suzuki** | Shenmue, Virtua Fighter, OutRun | Depth through authentic simulation — the more systems interact honestly, the richer the emergence |
| **Peter Molyneux** | Populous, Dungeon Keeper | Players will find behaviors you never planned; build systems that reward experimentation over exploitation |

### UI/UX Council

| Advisor | Known for | Philosophy applied to PIOSI |
|---|---|---|
| **Don Norman** | *The Design of Everyday Things* | Every affordance must be visible; the game should communicate what you can do without a manual |
| **Steve Krug** | *Don't Make Me Think* | Any UI that requires explanation has already failed; cut cognitive load relentlessly |
| **Brenda Laurel** | *Computers as Theatre* | Interaction is drama — party select, Mode Up, game over all have emotional arcs that should be designed |
| **Aarron Walter** | *Designing for Emotion* | Mechanical perfection is forgettable; personality is memorable — give every screen a voice |
| **David Kelley** | IDEO, Stanford d.school | Watch a new player's face for ten seconds — their confusion is the design roadmap |
| **Jesse James Garrett** | *The Elements of User Experience* | Surface → skeleton → structure → scope → strategy; every layer must be intentional, not accidental |
| **John Maeda** | *The Laws of Simplicity* | Simplicity is not the absence of complexity but the mastery of it — remove until it breaks, then add one thing back |

---

## Core values (priority order)

1. **Zero-build runtime** — no bundler, no transpilation, no runtime npm deps
2. **Data/code separation** — new content goes in `content/*.json`, not in engine modules
3. **Graceful degradation** — `fetch → fallback` in `contentLoader.js` must be preserved
4. **Mode toggleability** — new systems get a `manifest.modes` flag, default `false`
5. **ID stability** — hero keys use `hero.id ?? hero.name`; critical for Mode Up and future saves
6. **Determinism** — RNG must be seedable; do not call `Math.random()` directly in turn logic
7. **Readability** — plain functions beat clever patterns; vanilla JS, small team
8. **File-level modularity** — one concern per `.js` file

---

## Recipes

### Adding a hero
1. Add entry to `content/heroes.<pack>.json`, add pack to `manifest.json → packs`
2. Add `case "<id>":` to `modeup.js` — heroes without a case get the `ghis` default (intentional)
3. Drop sprite in `PIOSI Characters/`, reference path in JSON
4. Use a stable lowercase `id` field

### Adding a level
1. Add entry to `content/levels.<pack>.json`; use `enemyXOffset` or explicit `x`/`y`
2. Add pack to `manifest.json`, update `coreLevels` if needed
3. Do **not** edit `levels.js` — static fallback only

### Adding a mode
1. New `.js` file at root; reads its own `manifest.modes.<flag>` and no-ops if false
2. Add flag to `manifest.json → modes`, default `false`
3. Document in `docs/` if user-facing

### Modifying the engine
- Ask: "Can this be a content-pack change instead?" If yes, do that.
- `battleEngine.js` and `applyKnockback.js` must remain content-agnostic (no hero names, level numbers, enemy type checks)
- `modeup.js`'s `switch/case` is intentional — do not refactor to registry/strategy without asking

---

## Anti-patterns

- Runtime `npm install` dependencies
- A build step without an explicit ask
- Hero/level data inlined into engine modules
- `Math.random()` in turn logic
- Silent content-load failures (log a `console.warn` on fallback)
- TypeScript, JSX, or any transpilation-required syntax
- Frameworks (React, Vue, Svelte, etc.)

---

## Testing

```bash
npm test   # runs tests/battle.test.js via Node built-in test runner — no install needed
```

Tests cover: movement, attack ray, knockback, chain damage, burn/slüj DoT, swarm, hero death/resurrection, armor, rage, enemy AI, turn rotation, dodge formula, chain formula, and constructor initialization.

`BattleEngine` is DOM-free and fully testable in Node. Tests stub `shortPause` to `() => Promise.resolve()` and clear random vittle/mushroom placements after construction for determinism. When testing `attackInDirection` for status-effect application, stub `engine.nextTurn = () => {}` to prevent the post-attack turn from ticking durations before assertions.

Manual smoke test before merging to `1.0-shippable`: open `index.html`, complete one battle, confirm Mode Up triggers, check world map (if enabled in manifest).

---

## Known issues

1. **`package.json` stale** — references `parcel`, `src/`, `gh-pages`. README is source of truth. Clean up or ignore.
2. **No seeded RNG** — `Math.random()` used throughout turn logic. Create `rng.js` when adding replay/determinism.
3. **Asset sprawl** — MP3s, JPGs, RTF at repo root. Consolidate into `assets/` in a focused cleanup pass; don't move mid-feature.
4. **`fantasy_narrative.txt` at root** — fold into `content/` or document why it lives outside the pack system.
5. **No save versioning** — add `saveVersion` field before implementing any save/load.
6. **Content schemas informal** — fields inferred from README examples; a `content/SCHEMA.md` would help.
7. **No debug flag** — `manifest.json → "debug": false` would enable verbose logging without code changes.
