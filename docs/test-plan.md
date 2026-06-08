# PIOSI — Test Plan (1.03-council-enhancements)

## Overview

This plan covers automated regression tests, manual smoke tests, and council-enhancement verification. Run before merging to `1.0-shippable`.

---

## 1. Automated Tests

```bash
npm test   # node --test tests/*.test.js  — must pass 97/97
```

All 18 suites, 97 cases cover:

| Suite | What it guards |
|---|---|
| `isWithinBounds` | Grid boundary math |
| `isCellPassable` | Wall/hero/enemy/vittle cell logic |
| `getLiveHeroes` | `persistentDeath` filtering |
| `findClosestHero` | Enemy AI targeting |
| `moveUnit` | Move, pickup, knockback into wall, leap-to-wall collapse |
| `attackInDirection` | Ray cast, damage, burn/slüj/trick/psych/heal, bomba, dodge |
| `applyChainDamage` | Chain propagation and kill |
| `applyKnockback` | Yeet distance, OOB collision |
| `handleHeroDeath` | Rise resurrection, ankh on-death boost, persistent death |
| `enemyAttackAdjacent` | Armor absorption, rage on-hit, no-attack-at-range |
| `moveEnemy` | Pathing, blocked alternate direction, H/V preference |
| `applyStatusEffects – burn` | Burn tick, duration, kill |
| `applySwarmDamage` | 8-adjacent aura, non-adjacent immunity |
| `nextTurn` | Turn advance, skip-dead, enemy-turn trigger, game-over trigger |
| `applySlujEffect` | Interval, duration expiry, level scaling |
| `BattleEngine constructor` | Init, skip-dead currentUnit, all-dead game-over, status effects |
| `dodge formula` | 0→0%, cap at 50% |
| `chain damage formula` | Multiplier monotonicity, chain=0 edge case |

---

## 2. Manual Smoke Tests

### 2.1 Title Screen
- [ ] Griot line appears beneath the image before pressing Space
- [ ] Pressing Space transitions to party select

### 2.2 Party Select (Theatre Stage)
- [ ] Stage row shows all heroes as silhouettes (dimmed)
- [ ] Current hero steps forward (center-stage) with footlight
- [ ] Selecting a hero: silhouette brightens to full color
- [ ] `#start-btn` hidden when 0 heroes selected
- [ ] `#start-btn` appears when ≥1 hero is selected
- [ ] Clicking `#start-btn` starts the game correctly
- [ ] Pressing Space selects/deselects heroes
- [ ] Pressing Space when ≥1 hero selected and `#start-btn` visible starts game (keyboard path)
- [ ] Synergy hint updates when 1–2 heroes are selected
- [ ] Upstage (bottom) shows filled slots with large sprites

### 2.3 Variable Party Size
- [ ] Game starts with 1 hero
- [ ] Game starts with 2 heroes
- [ ] Game starts with 3 heroes
- [ ] No alert or block for non-3 party sizes

### 2.4 Battle
- [ ] Arrow keys move hero, Space triggers attack-direction mode
- [ ] Movement hint overlay appears on reachable cells
- [ ] Turn timeline shows hero/enemy order
- [ ] Enemy intent shows planned target
- [ ] Interaction log entry (`⚡`) appears with yellow highlight when emitted
- [ ] Log caps at 220 entries, scrolls to bottom
- [ ] Pinned HUD lines update for important events
- [ ] Touch D-pad visible automatically on touch devices (or via toggle)

### 2.5 Level Progression
- [ ] Levels 1–6 load without error (check all three new designed levels: 4, 5, 6)
- [ ] Wall geometry (`layout` array) renders correctly in levels 4–6
- [ ] Mode Up triggers after each level completion
- [ ] Level title displays correctly per JSON `title` field

### 2.6 Mode Up — Two Path Choice
- [ ] Mode Up window shows two option cards: **⚔ Destiny Path** and **✦ Emergent Path**
- [ ] ArrowUp selects Destiny Path (highlighted)
- [ ] ArrowDown selects Emergent Path (highlighted)
- [ ] Clicking an option card selects it
- [ ] Active card: gold border, slight lift shadow
- [ ] Stat column shows `+N` next to buffed stat for chosen path
- [ ] Mode Up instruction text: `◀ ▶ change hero · ▲ ▼ change path · Space confirm`
- [ ] Space applies the chosen path's buff and pulses the window (600ms)
- [ ] Emergent Path buff: top stat +2, bottom stat +1 (verify with a hero after a battle)

### 2.7 Game Over
- [ ] Game Over screen shows
- [ ] Griot line appears below "All your heroes have been defeated."
- [ ] Pressing Space restarts (returns to party select, music resets)

### 2.8 Victory
- [ ] Victory screen shows
- [ ] Griot line appears below "Congratulations!"
- [ ] Pressing Space restarts

### 2.9 Griot Contextual Reactions
- [ ] After 2+ kills in a battle, Griot reaction starts with "Blood begets blood —" or "Victory rings —"
- [ ] After 2+ hero deaths, Griot reaction starts with "The fallen cry out —"
- [ ] Griot line on game-over/victory is never empty (fallback: raw Markov text)

### 2.10 World Map
- [ ] World map accessible after level 20 (or cheat code)
- [ ] Left/Right keys navigate nodes
- [ ] Space selects node

### 2.11 Offline / Fallback Mode
- [ ] Run `index.html` directly from filesystem (no server)
- [ ] Console shows `[contentLoader] Hero JSON unavailable; using static fallback`
- [ ] `state.offlineMode` is `true`
- [ ] Game still playable with static hero/level data

### 2.12 Options Panel
- [ ] Isometric toggle switches view
- [ ] Turn Order, Enemy Intent, Move Hints toggles work
- [ ] Options panel opens/closes via button

---

## 3. Council Enhancement Verification Checklist

| # | Enhancement | Test |
|---|---|---|
| 1 | World map enabled | Manifest `worldMap: true`; accessible in-game |
| 2 | Two-path Mode Up | Destiny + Emergent options visible and functional |
| 3 | Emergent buff derivation | Verify highest stat +2, lowest stat +1 |
| 4 | Griot on game-over | `#game-over-griot` populated |
| 5 | Griot on victory | `#victory-griot` populated |
| 6 | Griot on title screen | `#title-griot` populated at startup |
| 7 | Contextual Griot reactions | Type tags flow kill→"Blood begets blood" etc. |
| 8 | Interaction log entries | `[⚡ INTERACTION]` prefix → yellow pinned entry |
| 9 | Mode Up ceremony | `modeup-pulse` animation fires on confirm |
| 10 | Start button | Appears at ≥1 selected, hidden at 0 |
| 11 | Variable party size | 1-2-3 hero parties all work |
| 12 | Touch D-pad auto-show | Auto-visible on touch device |
| 13 | Offline mode flag | `state.offlineMode` set in fallback path |
| 14 | Three designed levels | Levels 4, 5, 6 load with wall geometry |
| 15 | Battle instruction removed | No static "Use Arrow Keys…" paragraph in battle screen |

---

## 4. Regression Guard

After any change to `battleEngine.js`, `applyKnockback.js`, or `sluj.js`:

```bash
npm test
```

After any content change (heroes/levels JSON):
- Open game, verify hero roster and level titles match JSON

After any CSS change to party select:
- Resize to mobile (375px wide) and verify layout doesn't break
- Check spotlight, stage row, upstage slots on mobile

---

## 5. Known Limitations (not blocking)

- No seeded RNG — `Math.random()` used in turn logic; non-deterministic tests use `>=` comparisons
- Level 99 cheat level is static (not in JSON) — tested via cheat code sequence
- Griot Markov text quality depends on corpus size; may produce short fragments on first load before corpus fetches
- World map node layout is hard-coded in `worldMap.js` — not data-driven yet
