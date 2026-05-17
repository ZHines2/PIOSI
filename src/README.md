# src/

All JavaScript engine and UI modules. Loaded as ES modules from `index.html` via `<script type="module">` — no build step.

## Module map

### Engine (DOM-free, testable in Node)
| File | Responsibility |
|---|---|
| `battleEngine.js` | Turn-based grid combat: movement, attack, status effects, turn rotation |
| `applyKnockback.js` | Knockback (yeet) resolution |
| `sluj.js` | Slüj DoT tick logic |
| `modeup.js` | Hero-specific level-up buffs via `switch(hero.id)` |

### Data / content layer
| File | Responsibility |
|---|---|
| `state.js` | Shared mutable game-state singleton |
| `contentLoader.js` | Fetches manifest + JSON packs; falls back to static data on failure |
| `heroes.js` | Static hero fallback data (used when JSON fetch fails) |
| `levels.js` | Static level fallback data (used when JSON fetch fails) |

### UI / presentation
| File | Responsibility |
|---|---|
| `renderer.js` | `renderBattlefield`, `updateBattleHUD`, `getCompleteStats` |
| `screenManager.js` | `showScreen` — drives the screen state machine |
| `partySelectUI.js` | Party selection screen logic |
| `modeUpUI.js` | Mode Up selection display |
| `logger.js` | `logMessage`, `clearLog`, `recordAttack` |
| `audioManager.js` | `fadeOut`, `stopAudio` |

### Modes
| File | Responsibility |
|---|---|
| `worldMap.js` | World map screen — gated by `manifest.modes.worldMap` |
| `summitMode.js` | Summit auto-battle mode — gated by `manifest.modes.summit` |
| `emanations.js` | Music player / visualizer — gated by `manifest.modes.emanations` |
| `griot.js` | Markov chain narrative; external API fetches for hero flavor text |

### Application layer
| File | Responsibility |
|---|---|
| `gameFlow.js` | `startGame`, `initializeBattle`, `onLevelComplete`, `onGameOver`, `restartGame`, cheat codes, mode launchers |
| `inputHandler.js` | Keyboard router, cheat detection, touch handler, D-pad and iso-toggle wiring |

## Import rules

- `battleEngine.js` and `applyKnockback.js` must stay content-agnostic — no hero names, level IDs, or enemy types hardcoded.
- `modeup.js`'s flat `switch(hero.id)` is intentional — do not refactor to a registry without discussing first.
- `contentLoader.js` owns all content I/O — other modules consume loaded data, they do not `fetch()`.
- `state.js` has no upstream game imports — it only imports from `heroes.js` and `levels.js` for fallback defaults.
