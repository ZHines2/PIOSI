# CHANGELOG

All notable changes to PIOSI are recorded here in reverse chronological order.
Format: **What changed**, **Why**, **What it affects**.

---

## [Unreleased] — 2026-05-17 (continued)

### Asset and directory reorganization

**What:** Moved all loose files from the project root into organized subdirectories and added a `README.md` to every folder:

```
assets/
  audio/        ← all 8 MP3 tracks (was root)
  characters/   ← all 25 hero PNGs (was "PIOSI Characters/")
  images/       ← loose artwork and reference images (was root)
content/
  fantasy_narrative.txt  ← Griot training corpus (was root)
```

Updated all references: `index.html` audio `src` attributes, `emanations.js` song array, `heroes.js` sprite paths, `content/heroes.core.json` sprite paths, `griot.js` default corpus URL.

**Why:** Audio files, images, and an RTF document were scattered at the project root alongside engine code. The character sprite folder had a space in its name (`PIOSI Characters/`) which is fragile in shell contexts. Consolidating under `assets/` makes the root readable and aligns with the CLAUDE.md known-issue that flagged this cleanup.

**Affects:** `index.html`, `emanations.js`, `heroes.js`, `content/heroes.core.json`, `griot.js` (path strings only — no logic changes). All 97 regression tests continue to pass.

---

### Codebase modularization (refactor-SIX branch)

**What:** Extracted the ~940-line inline `<script>` from `index.html` into 9 focused ES modules at the project root:

| New file | Responsibility |
|---|---|
| `state.js` | Shared mutable game-state singleton |
| `audioManager.js` | `fadeOut` / `stopAudio` utilities |
| `logger.js` | `logMessage`, `clearLog`, `recordAttack` |
| `renderer.js` | `getCompleteStats`, `renderBattlefield`, `updateBattleHUD` |
| `screenManager.js` | `showScreen` — screen state machine |
| `partySelectUI.js` | `updateHeroDisplay`, `selectHero` |
| `modeUpUI.js` | `updateModeUpHeroDisplay` |
| `gameFlow.js` | `startGame`, `initializeBattle`, `onLevelComplete`, `onGameOver`, `restartGame`, `showModeUpWindow`, `applyCurrentModeUp`, `activateCheat`, `worldMapCheatCode`, `startSummitMode`, `startEmanationsMode` |
| `inputHandler.js` | Keyboard router, cheat detection, touch, D-pad, iso-toggle wiring |

`index.html` is now a ~130-line document with a 20-line thin init `<script type="module">`.

**Why:** The single-file inline script was becoming difficult to navigate, extend, and reason about. Separating concerns by file makes it easier to add new modes, swap subsystems, and review changes without scrolling through a monolithic block. The engine files (`battleEngine.js`, `applyKnockback.js`, `sluj.js`, `modeup.js`) were already modular — this brings the UI/flow layer to the same standard.

**Affects:** All game screens and flows. The engine files are untouched. The 97-test regression suite passes without modification, confirming behavioral parity.

---

### CLAUDE.md, regression test suite, play.bat (1.01-fortification branch)

**What:**
- `CLAUDE.md` — AI-facing project guide: commands, architecture map, BattleEngine data contract, turn structure, content system, recipes, anti-patterns, test stub guidance.
- `tests/battle.test.js` — 97 tests across 18 describe blocks using Node's built-in test runner (no install required). Covers: movement, attack ray, knockback, chain AoE, burn/slüj DoT, swarm, hero death/resurrection, armor, rage, dodge formula, chain multiplier formula, enemy AI, turn rotation, constructor initialization.
- `play.bat` — Double-click launcher; starts Python HTTP server on port 8000 and opens the browser.
- `package.json` — Added `"test": "node --test tests/*.test.js"` script.

**Why:** No regression harness existed. The engine had accumulated many interacting systems (burn, slüj, yeet, chain, bomba, swarm, trick, psych, heal, rage, armor, dodge, ankh, rise) with no automated coverage. Any refactor or new-content work risked silently breaking existing behavior. `play.bat` removes the friction of starting the local server manually.

**Affects:** Developer workflow only. No runtime game logic changed.

---

## 2026-03-11 — Persistent battle HUD (PR #73)

**What:** Added a persistent HUD above the battlefield with three panels:
- **Top strip** — current hero, move points, attack/move mode, wall HP, enemy count.
- **Party panel** — all party members with HP, armor, status effects; active hero highlighted, dead heroes dimmed.
- **Narrative panel** — last 3 high-signal battle events (turn transitions, deaths, level completions).

**Why:** The previous log-only feedback made it hard to track party state at a glance, especially on mobile. The persistent HUD keeps critical info visible without scrolling.

**Affects:** `index.html` (HTML structure + `updateBattleHUD` function), `styles.css` (HUD layout).

---

## 2026-03-11 — CORE data-driven content system (PR #72)

**What:**
- Introduced `content/` directory with `manifest.json`, `heroes.core.json`, `levels.core.json`.
- New `contentLoader.js` — fetches manifest, loads hero/level packs, falls back to `heroes.js` / `levels.js` if fetch fails (e.g. `file://` protocol).
- `modeup.js` — updated to key off `hero.id ?? hero.name` so content-pack heroes with a stable `id` get correct Mode Up buffs even if their display name changes.
- Mode toggles added to `manifest.json → modes` (worldMap, summit, emanations default to false in CORE).
- README and `docs/` updated with content-pack authoring guides.

**Why:** "Ship the engine once, extend forever through content drops." Hardcoding heroes and levels in JS files made adding content require engine edits. The JSON pack system lets authors add heroes and levels without touching engine code. The `fetch → fallback` pattern preserves zero-config local play.

**Affects:** `contentLoader.js` (new), `modeup.js` (id-first lookup), `manifest.json` (new), `heroes.core.json` / `levels.core.json` (new). Static `heroes.js` and `levels.js` retained as fallback.

---

## 2026-02-26 — Isometric view + mobile D-pad (PR #67)

**What:**
- Isometric battlefield canvas view toggled by the ⬡ button (top-right of battle screen).
- On-screen D-pad (🕹 button) — hidden by default, toggleable; sends synthetic `keydown` events for Arrow keys and Space.
- Touch fallback: tap zones (left/right edges = left/right, top/bottom = up/down, center = space).

**Why:** Accessibility and aesthetic variety. The isometric view offers a different visual presentation of the same game state. The D-pad makes the game playable on touchscreen devices without a physical keyboard.

**Affects:** `index.html` (iso-toggle button, D-pad HTML, event wiring, `isometricMode` flag, `renderBattlefield`), `battleEngine.js` (`drawIsometricBattlefield` method), `styles.css` (D-pad and iso-canvas layout).

---

## 2026-02-21 — Aesthetic polish

**What:** Visual upgrades to `styles.css`: button hover effects, cell glow animations, screen transition polish.

**Why:** Quality-of-life visual refinements ahead of the isometric feature branch.

**Affects:** `styles.css` only. No logic changes.

---

## 2026-02-20 — Bug fixes: dead hero freeze + Mode Up mobile overflow

**What:**
- Fixed game freeze when the lead party member has `persistentDeath` at battle start — `initializeBattle` / constructor now skips dead heroes to find the first live `currentUnit`.
- Fixed `initializeBattle` null crash on a missing level.
- Fixed Mode Up window overflowing on mobile — stats now render in a two-column layout.
- Added `"type": "module"` to `package.json`.

**Why:** These were blocking bugs: a dead first-slot hero would hard-freeze the game; the Mode Up screen was unusable on phones.

**Affects:** `battleEngine.js` (constructor dead-hero skip), `index.html` (Mode Up two-column layout), `package.json`.

---

## 2026-02-05 — Core engine and Griot narrative layer

**What:**
- `battleEngine.js` extracted from inline `index.html` script — turn-based grid combat, movement, attack ray, all status effects.
- `griot.js` — Markov chain narrative generator; external API fetches (joke, tarot, bacon ipsum, etc.) for hero-specific flavor during party select and attacks.
- `applyKnockback.js` — knockback resolution extracted from engine for testability.
- `sluj.js` — Slüj DoT tick logic.
- `heroes.js`, `levels.js` — static data extracted from inline script.

**Why:** The original project was a single `index.html` file. Extracting engine logic into modules enabled independent testing and made the codebase navigable.

**Affects:** All combat and movement behavior now lives in `battleEngine.js`. `index.html` became the UI/flow orchestrator consuming engine exports.

---

## 2025-10-xx — Summit Mode

**What:** `summitMode.js` — canvas-based auto-battle simulation between two AI teams drawn from the party roster. Accessible from the world map.

**Why:** Additional mode expanding replayability and showing off the engine's AI in an automated context.

**Affects:** `summitMode.js` (new), `index.html` (summit screen + key bindings), `worldMap.js` (node wiring).

---

## 2025-08-xx — Emanations Mode (PR #55)

**What:** `emanations.js` — audio player and canvas visualizer for the game's soundtrack. Accessible from the world map.

**Why:** Gives the music a dedicated showcase mode separate from battle.

**Affects:** `emanations.js` (new), `index.html` (emanations screen, audio fade on entry), `styles.css`.

---

## 2025-05-xx — World Map

**What:** `worldMap.js` — branching node map between levels. Nodes lead to battle, Summit Mode, or Emanations Mode. Gated by `manifest.modes.worldMap`.

**Why:** Provides progression structure and a hub for the game's extended modes beyond the core battle loop.

**Affects:** `worldMap.js` (new), `index.html` (world map screen + key bindings).

---

## 2025-01-30 — Initial commit

**What:** First version of PIOSI. Single `index.html` with inline game logic, `styles.css`, hero and level data, basic turn-based grid combat.

**Why:** Project inception.

**Affects:** Everything.

---

*Keep this file updated with every meaningful change: what changed, why it was done, and what it affects. Ephemeral fixes and typo corrections can be grouped; architectural decisions and new systems each get their own entry.*
